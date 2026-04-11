import { loadMockOrderEnrichment } from "@/lib/mock-orders";
import { featureFlags } from "@/lib/env";
import { AppError, getReadableError } from "@/lib/errors";
import { listRetailCrmOrders } from "@/lib/retailcrm";
import {
  getHighValueOrderIds,
  shouldSkipInitialBackfillNotifications,
} from "@/lib/sync-logic";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { sendTelegramMessage } from "@/lib/telegram";
import { buildHighValueMessage, mapRetailCrmOrderToSupabaseRow } from "@/lib/transform";
import type { SupabaseOrderRow } from "@/types/order";

async function getOrdersCount() {
  const supabase = getSupabaseAdminClient();
  const { count, error } = await supabase
    .from("orders")
    .select("retailcrm_order_id", { count: "exact", head: true });

  if (error) {
    throw new AppError("Failed to read current orders count from Supabase.", 500, error.message);
  }

  return count ?? 0;
}

async function upsertOrders(rows: SupabaseOrderRow[]) {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("orders").upsert(rows, {
    onConflict: "retailcrm_order_id",
  });

  if (error) {
    throw new AppError("Failed to upsert synced orders into Supabase.", 500, error.message);
  }
}

async function markHighValueOrdersAsNotified(rows: SupabaseOrderRow[]) {
  const ids = getHighValueOrderIds(rows);

  if (ids.length === 0) {
    return;
  }

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("orders")
    .update({ notified_high_value: true })
    .in("retailcrm_order_id", ids);

  if (error) {
    throw new AppError(
      "Failed to mark historical high-value orders as already notified.",
      500,
      error.message,
    );
  }
}

async function notifyNewHighValueOrders(rows: SupabaseOrderRow[]) {
  const supabase = getSupabaseAdminClient();

  for (const row of rows) {
    if (row.total_amount <= 50000) {
      continue;
    }

    const { data: claimedRows, error: claimError } = await supabase
      .from("orders")
      .update({ notified_high_value: true })
      .eq("retailcrm_order_id", row.retailcrm_order_id)
      .eq("notified_high_value", false)
      .select("retailcrm_order_id");

    if (claimError) {
      throw new AppError(
        "Failed to claim a high-value order notification in Supabase.",
        500,
        claimError.message,
      );
    }

    if (!claimedRows || claimedRows.length === 0) {
      continue;
    }

    try {
      await sendTelegramMessage(buildHighValueMessage(row));
    } catch (error) {
      const { error: rollbackError } = await supabase
        .from("orders")
        .update({ notified_high_value: false })
        .eq("retailcrm_order_id", row.retailcrm_order_id);

      if (rollbackError) {
        throw new AppError(
          "Telegram send failed and rollback of notification flag also failed.",
          500,
          rollbackError.message,
        );
      }

      throw error;
    }
  }
}

async function main() {
  const mappedRows: SupabaseOrderRow[] = [];
  const mockOrderEnrichment = await loadMockOrderEnrichment();
  const ordersCountBeforeSync = await getOrdersCount();
  let page = 1;
  let totalPages = 1;

  do {
    const response = await listRetailCrmOrders(page, 100);
    const orders = response.orders ?? [];
    mappedRows.push(
      ...orders.map((order) =>
        mapRetailCrmOrderToSupabaseRow(
          order,
          order.externalId ? mockOrderEnrichment.get(order.externalId) : null,
        ),
      ),
    );

    totalPages = response.pagination?.totalPageCount ?? page;
    page += 1;
  } while (page <= totalPages);

  if (mappedRows.length === 0) {
    console.log("RetailCRM returned no orders. Nothing to sync.");
    return;
  }

  await upsertOrders(mappedRows);

  if (
    shouldSkipInitialBackfillNotifications(
      ordersCountBeforeSync,
      featureFlags.sendInitialBackfillNotifications,
    )
  ) {
    await markHighValueOrdersAsNotified(mappedRows);
    console.log(
      `Synced ${mappedRows.length} orders and skipped Telegram notifications on initial backfill`,
    );
    return;
  }

  await notifyNewHighValueOrders(mappedRows);

  console.log(`Synced ${mappedRows.length} orders`);
}

main().catch((error) => {
  const readable = getReadableError(error, "Sync script failed.");
  console.error(
    JSON.stringify({ success: false, error: readable.message, details: readable.details }),
  );
  process.exit(1);
});
