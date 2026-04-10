import { describe, expect, it } from "vitest";

import {
  buildHighValueMessage,
  calculateRetailCrmOrderTotal,
  createStableExternalId,
  mapRetailCrmOrderToSupabaseRow,
} from "@/lib/transform";
import type { MockOrder, RetailCrmOrder } from "@/types/order";

describe("transform", () => {
  it("creates a stable external id from index and phone", () => {
    const order: MockOrder = {
      firstName: "Айгуль",
      lastName: "Касымова",
      phone: "+7 (700) 123-45-67",
      items: [{ productName: "Test", quantity: 1, initialPrice: 1000 }],
    };

    expect(createStableExternalId(0, order)).toBe("mock-1-77001234567");
  });

  it("uses explicit CRM total when it exists", () => {
    const order: RetailCrmOrder = {
      id: 1,
      totalSumm: 58000,
      items: [{ quantity: 1, initialPrice: 12000 }],
    };

    expect(calculateRetailCrmOrderTotal(order)).toBe(58000);
  });

  it("calculates total from items when explicit total is missing", () => {
    const order: RetailCrmOrder = {
      id: 2,
      items: [
        { quantity: 2, initialPrice: 18000 },
        { quantity: 1, initialPrice: 22000 },
      ],
    };

    expect(calculateRetailCrmOrderTotal(order)).toBe(58000);
  });

  it("falls back to enrichment for utm_source and city", () => {
    const order: RetailCrmOrder = {
      id: 99,
      externalId: "mock-1-77001234567",
      firstName: "Айгуль",
      lastName: "Касымова",
      phone: "+77001234567",
      items: [{ quantity: 1, initialPrice: 15000 }],
    };

    const row = mapRetailCrmOrderToSupabaseRow(order, {
      utmSource: "instagram",
      city: "Алматы",
    });

    expect(row.utm_source).toBe("instagram");
    expect(row.city).toBe("Алматы");
    expect(row.total_amount).toBe(15000);
  });

  it("builds a readable telegram message", () => {
    const message = buildHighValueMessage({
      retailcrm_order_id: 42,
      order_number: "1024",
      total_amount: 78000,
      customer_name: "Иван Петров",
      city: "Алматы",
      utm_source: "instagram",
    });

    expect(message).toContain("Новый крупный заказ");
    expect(message).toContain("Заказ: #1024");
    expect(message).toContain("instagram");
    expect(message).toContain("Алматы");
  });
});
