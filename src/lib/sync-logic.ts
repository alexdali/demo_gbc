import { calculateRetailCrmOrderTotal } from "@/lib/transform";
import type { SupabaseOrderRow } from "@/types/order";

export function shouldSkipInitialBackfillNotifications(ordersCountBeforeSync: number) {
  return ordersCountBeforeSync === 0;
}

export function getHighValueOrderIds(rows: SupabaseOrderRow[]) {
  return rows
    .filter((row) => calculateRetailCrmOrderTotal(row.raw_payload) > 50000)
    .map((row) => row.retailcrm_order_id);
}

export function isHighValueOrder(row: SupabaseOrderRow) {
  return calculateRetailCrmOrderTotal(row.raw_payload) > 50000;
}
