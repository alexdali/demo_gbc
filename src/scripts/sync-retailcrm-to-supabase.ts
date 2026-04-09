import { loadMockOrderEnrichment } from "@/lib/mock-orders";
import { listRetailCrmOrders } from "@/lib/retailcrm";
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
    throw new Error(`Supabase count query failed: ${error.message}`);
  }

  return count ?? 0;
}

async function upsertOrders(rows: SupabaseOrderRow[]) {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("orders").upsert(rows, {
    onConflict: "retailcrm_order_id",
  });

  if (error) {
    throw new Error(`Supabase upsert failed: ${error.message}`);
  }
}

async function markHighValueOrdersAsNotified(rows: SupabaseOrderRow[]) {
  const ids = rows
    .filter((row) => row.total_amount > 50000)
    .map((row) => row.retailcrm_order_id);

  if (ids.length === 0) {
    return;
  }

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("orders")
    .update({ notified_high_value: true })
    .in("retailcrm_order_id", ids);

  if (error) {
    throw new Error(`Supabase bulk notification flag update failed: ${error.message}`);
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
      throw new Error(`Supabase notification claim failed: ${claimError.message}`);
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
        throw new Error(
          `Telegram send failed and rollback failed: ${rollbackError.message}`,
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

  await upsertOrders(mappedRows);

  if (ordersCountBeforeSync === 0) {
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
  console.error(error);
  process.exit(1);
});
