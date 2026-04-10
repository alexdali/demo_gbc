import { calculateRetailCrmOrderTotal } from "@/lib/transform";
import type { SupabaseOrderRow } from "@/types/order";

type PreservedFields = Pick<SupabaseOrderRow, "city" | "utm_source">;

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

export function preserveExistingAnalyticFields(
  row: SupabaseOrderRow,
  existing?: PreservedFields | null,
) {
  if (!existing) {
    return row;
  }

  return {
    ...row,
    city: row.city ?? existing.city ?? null,
    utm_source: row.utm_source ?? existing.utm_source ?? null,
  };
}
