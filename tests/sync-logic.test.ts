import { describe, expect, it } from "vitest";

import {
  getHighValueOrderIds,
  isHighValueOrder,
  shouldSkipInitialBackfillNotifications,
} from "@/lib/sync-logic";
import type { RetailCrmOrder, SupabaseOrderRow } from "@/types/order";

function makeRow(id: number, total: number): SupabaseOrderRow {
  const rawPayload: RetailCrmOrder = {
    id,
    totalSumm: total,
  };

  return {
    retailcrm_order_id: id,
    external_id: `mock-${id}`,
    order_number: `${id}`,
    created_at: "2026-04-10T00:00:00.000Z",
    customer_name: "Test User",
    customer_phone: "+77000000000",
    city: "Алматы",
    status: "new",
    utm_source: "instagram",
    total_amount: total,
    currency: "KZT",
    raw_payload: rawPayload,
    synced_at: "2026-04-10T00:00:00.000Z",
    notified_high_value: false,
  };
}

describe("sync logic", () => {
  it("skips telegram notifications only on initial backfill", () => {
    expect(shouldSkipInitialBackfillNotifications(0)).toBe(true);
    expect(shouldSkipInitialBackfillNotifications(1)).toBe(false);
  });

  it("detects high-value orders from CRM payload totals", () => {
    expect(isHighValueOrder(makeRow(1, 51000))).toBe(true);
    expect(isHighValueOrder(makeRow(2, 50000))).toBe(false);
  });

  it("returns ids only for orders above threshold", () => {
    const rows = [makeRow(1, 12000), makeRow(2, 51000), makeRow(3, 90000)];

    expect(getHighValueOrderIds(rows)).toEqual([2, 3]);
  });
});
