import { format } from "date-fns";

import type { BreakdownPoint, DailyOrdersPoint, MockOrder, RetailCrmOrder, SupabaseOrderRow } from "@/types/order";
import type { MockOrderEnrichment } from "@/lib/mock-orders";

export function createStableExternalId(index: number, order: MockOrder) {
  const prefix = sanitizeExternalIdPrefix(order.externalIdPrefix ?? "mock");
  return `${prefix}-${index + 1}-${sanitizeToken(order.phone)}`;
}

function sanitizeToken(value: string) {
  return value.replace(/[^\dA-Za-z]/g, "");
}

function sanitizeExternalIdPrefix(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^0-9a-z-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/--+/g, "-") || "mock";
}

export function calculateMockOrderTotal(order: MockOrder) {
  return order.items.reduce((sum, item) => sum + item.quantity * item.initialPrice, 0);
}

function toNumber(value: unknown) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

export function calculateRetailCrmOrderTotal(order: RetailCrmOrder) {
  const explicitTotal = toNumber(order.totalSumm ?? order.summ);

  if (explicitTotal > 0) {
    return explicitTotal;
  }

  return (order.items ?? []).reduce((sum, item) => {
    return sum + toNumber(item.quantity) * toNumber(item.initialPrice ?? item.purchasePrice);
  }, 0);
}

export function mapRetailCrmOrderToSupabaseRow(
  order: RetailCrmOrder,
  enrichment?: MockOrderEnrichment | null,
): SupabaseOrderRow {
  return {
    retailcrm_order_id: order.id,
    external_id: order.externalId ?? null,
    order_number: order.number ?? null,
    created_at: order.createdAt ?? null,
    customer_name: [order.firstName, order.lastName].filter(Boolean).join(" ") || null,
    customer_phone: order.phone ?? null,
    city: order.delivery?.address?.city ?? enrichment?.city ?? null,
    status: order.status ?? null,
    utm_source: order.customFields?.utm_source ?? enrichment?.utmSource ?? null,
    total_amount: calculateRetailCrmOrderTotal(order),
    currency: "KZT",
    raw_payload: order,
    synced_at: new Date().toISOString(),
  };
}

export function buildHighValueMessage(row: Pick<SupabaseOrderRow, "order_number" | "retailcrm_order_id" | "total_amount" | "customer_name" | "city" | "utm_source">) {
  return [
    "Новый крупный заказ",
    `Заказ: #${row.order_number ?? row.retailcrm_order_id}`,
    `Сумма: ${new Intl.NumberFormat("ru-RU").format(row.total_amount)} ₸`,
    `Клиент: ${row.customer_name ?? "Не указан"}`,
    `Город: ${row.city ?? "Не указан"}`,
    `Источник: ${row.utm_source ?? "Не указан"}`,
  ].join("\n");
}

export function buildDailyOrders(rows: Array<Pick<SupabaseOrderRow, "created_at" | "total_amount">>): DailyOrdersPoint[] {
  const groups = new Map<string, DailyOrdersPoint>();

  for (const row of rows) {
    const key = row.created_at ? format(new Date(row.created_at), "yyyy-MM-dd") : "unknown";
    const current = groups.get(key) ?? { date: key, orders: 0, revenue: 0 };
    current.orders += 1;
    current.revenue += row.total_amount;
    groups.set(key, current);
  }

  return [...groups.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export function buildBreakdown<T extends { total_amount: number }, K extends keyof T>(
  rows: T[],
  field: K,
): BreakdownPoint[] {
  const groups = new Map<string, BreakdownPoint>();

  for (const row of rows) {
    const rawValue = row[field];
    const label = typeof rawValue === "string" && rawValue.trim() ? rawValue : "Не указано";
    const current = groups.get(label) ?? { label, count: 0, revenue: 0 };
    current.count += 1;
    current.revenue += row.total_amount;
    groups.set(label, current);
  }

  return [...groups.values()].sort((a, b) => b.count - a.count).slice(0, 8);
}
