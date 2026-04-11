import { getSupabaseAdminClient } from "@/lib/supabase";
import { buildBreakdown, buildDailyOrders } from "@/lib/transform";
import type { DashboardKpi, SupabaseOrderRow } from "@/types/order";

export async function getDashboardData() {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select("retailcrm_order_id, order_number, created_at, city, status, utm_source_code, total_amount, notified_high_value")
    .order("created_at", { ascending: true });

  const rows = ((error ? [] : data) ?? []) as Array<
    Pick<
      SupabaseOrderRow,
      | "retailcrm_order_id"
      | "order_number"
      | "created_at"
      | "city"
      | "status"
      | "utm_source_code"
      | "total_amount"
      | "notified_high_value"
    >
  >;

  const kpis: DashboardKpi = {
    totalOrders: rows.length,
    totalRevenue: rows.reduce((sum, row) => sum + row.total_amount, 0),
    highValueOrders: rows.filter((row) => row.total_amount > 50000).length,
    averageOrderValue:
      rows.length > 0 ? rows.reduce((sum, row) => sum + row.total_amount, 0) / rows.length : 0,
  };

  return {
    error: error?.message ?? null,
    rows,
    kpis,
    dailyOrders: buildDailyOrders(rows),
    bySource: buildBreakdown(rows, "utm_source_code"),
    byCity: buildBreakdown(rows, "city"),
  };
}
