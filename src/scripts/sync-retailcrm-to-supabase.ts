import { listRetailCrmOrders } from "@/lib/retailcrm";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { sendTelegramMessage } from "@/lib/telegram";
import { buildHighValueMessage, mapRetailCrmOrderToSupabaseRow } from "@/lib/transform";
import type { SupabaseOrderRow } from "@/types/order";

async function upsertOrders(rows: SupabaseOrderRow[]) {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("orders").upsert(rows, {
    onConflict: "retailcrm_order_id",
  });

  if (error) {
    throw new Error(`Supabase upsert failed: ${error.message}`);
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
  let page = 1;
  let totalPages = 1;

  do {
    const response = await listRetailCrmOrders(page, 100);
    const orders = response.orders ?? [];
    mappedRows.push(...orders.map(mapRetailCrmOrderToSupabaseRow));

    totalPages = response.pagination?.totalPageCount ?? page;
    page += 1;
  } while (page <= totalPages);

  await upsertOrders(mappedRows);
  await notifyNewHighValueOrders(mappedRows);

  console.log(`Synced ${mappedRows.length} orders`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
