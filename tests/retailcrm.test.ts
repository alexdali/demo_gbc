import { describe, expect, it } from "vitest";

import { buildRetailCrmMockPayload } from "@/lib/retailcrm";
import { RETAILCRM_UTM_SOURCE_FIELD_CODE } from "@/lib/utm-source";
import type { MockOrder } from "@/types/order";

describe("retailcrm payload builder", () => {
  it("includes customFields from a mock order payload", () => {
    const order: MockOrder = {
      firstName: "Айгуль",
      lastName: "Касымова",
      phone: "+77001234567",
      email: "aigul@example.com",
      utmSource: "instagram",
      items: [{ productName: "Nova Classic", quantity: 1, initialPrice: 15000 }],
    };

    const payload = buildRetailCrmMockPayload(order, "mock-1-77001234567");

    expect(payload.customFields).toEqual({
      [RETAILCRM_UTM_SOURCE_FIELD_CODE]: "instagram",
    });
    expect(payload.totalSumm).toBe(15000);
  });
});
