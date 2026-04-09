import { getSupabaseAdminClient } from "@/lib/supabase";
import { AppError } from "@/lib/errors";
import {
  getHighValueOrderIds,
  isHighValueOrder,
  shouldSkipInitialBackfillNotifications,
} from "@/lib/sync-logic";
import { sendTelegramMessage } from "@/lib/telegram";
import {
  buildHighValueMessage,
  calculateRetailCrmOrderTotal,
  mapRetailCrmOrderToSupabaseRow,
} from "@/lib/transform";
import { listRetailCrmOrders } from "@/lib/retailcrm";
import type { SupabaseOrderRow } from "@/types/order";

export type SyncResult = {
  pagesFetched: number;
  ordersFetched: number;
  ordersUpserted: number;
  notificationsSent: number;
  notificationsSkipped: number;
  skippedInitialBackfillNotifications: boolean;
};

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
  if (rows.length === 0) {
    return;
  }

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

async function claimHighValueOrder(retailcrmOrderId: number) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .update({ notified_high_value: true })
    .eq("retailcrm_order_id", retailcrmOrderId)
    .eq("notified_high_value", false)
    .select("retailcrm_order_id");

  if (error) {
    throw new AppError(
      "Failed to claim a high-value order notification in Supabase.",
      500,
      error.message,
    );
  }

  return Boolean(data?.length);
}

async function rollbackHighValueClaim(retailcrmOrderId: number) {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("orders")
    .update({ notified_high_value: false })
    .eq("retailcrm_order_id", retailcrmOrderId);

  if (error) {
    throw new AppError(
      "Failed to rollback notification flag in Supabase after Telegram error.",
      500,
      error.message,
    );
  }
}

export async function syncRetailCrmToSupabase(): Promise<SyncResult> {
  const rows: SupabaseOrderRow[] = [];
  const ordersCountBeforeSync = await getOrdersCount();
  let page = 1;
  let totalPages = 1;
  let pagesFetched = 0;

  do {
    const response = await listRetailCrmOrders(page, 100);
    const orders = response.orders ?? [];
    pagesFetched += 1;
    rows.push(...orders.map(mapRetailCrmOrderToSupabaseRow));
    totalPages = response.pagination?.totalPageCount ?? page;
    page += 1;
  } while (page <= totalPages);

  if (rows.length === 0) {
    return {
      pagesFetched,
      ordersFetched: 0,
      ordersUpserted: 0,
      notificationsSent: 0,
      notificationsSkipped: 0,
      skippedInitialBackfillNotifications: false,
    };
  }

  await upsertOrders(rows);

  if (shouldSkipInitialBackfillNotifications(ordersCountBeforeSync)) {
    await markHighValueOrdersAsNotified(rows);

    return {
      pagesFetched,
      ordersFetched: rows.length,
      ordersUpserted: rows.length,
      notificationsSent: 0,
      notificationsSkipped: getHighValueOrderIds(rows).length,
      skippedInitialBackfillNotifications: true,
    };
  }

  let notificationsSent = 0;
  let notificationsSkipped = 0;

  for (const row of rows) {
    if (!isHighValueOrder(row)) {
      notificationsSkipped += 1;
      continue;
    }

    const claimed = await claimHighValueOrder(row.retailcrm_order_id);

    if (!claimed) {
      notificationsSkipped += 1;
      continue;
    }

    try {
      await sendTelegramMessage(buildHighValueMessage(row));
      notificationsSent += 1;
    } catch (error) {
      await rollbackHighValueClaim(row.retailcrm_order_id);
      throw error;
    }
  }

  return {
    pagesFetched,
    ordersFetched: rows.length,
    ordersUpserted: rows.length,
    notificationsSent,
    notificationsSkipped,
    skippedInitialBackfillNotifications: false,
  };
}
