import { getSupabaseAdminClient } from "@/lib/supabase";
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
};

async function upsertOrders(rows: SupabaseOrderRow[]) {
  if (rows.length === 0) {
    return;
  }

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("orders").upsert(rows, {
    onConflict: "retailcrm_order_id",
  });

  if (error) {
    throw new Error(`Supabase upsert failed: ${error.message}`);
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
    throw new Error(`Supabase notification claim failed: ${error.message}`);
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
    throw new Error(`Supabase notification rollback failed: ${error.message}`);
  }
}

export async function syncRetailCrmToSupabase(): Promise<SyncResult> {
  const rows: SupabaseOrderRow[] = [];
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

  await upsertOrders(rows);

  let notificationsSent = 0;
  let notificationsSkipped = 0;

  for (const row of rows) {
    if (calculateRetailCrmOrderTotal(row.raw_payload) <= 50000) {
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
  };
}
