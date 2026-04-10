import { describe, expect, it } from "vitest";

import { buildRetailCrmMockPayload } from "@/lib/retailcrm";
import type { MockOrder } from "@/types/order";

describe("retailcrm payload builder", () => {
  it("includes customFields from a mock order payload", () => {
    const order: MockOrder = {
      firstName: "Айгуль",
      lastName: "Касымова",
      phone: "+77001234567",
      email: "aigul@example.com",
      items: [{ productName: "Nova Classic", quantity: 1, initialPrice: 15000 }],
      customFields: {
        utm_source: "instagram",
      },
    };

    const payload = buildRetailCrmMockPayload(order, "mock-1-77001234567");

    expect(payload.customFields).toEqual({
      utm_source: "instagram",
    });
    expect(payload.totalSumm).toBe(15000);
  });
});
