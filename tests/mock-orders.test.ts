import { describe, expect, it } from "vitest";

import { loadMockOrderEnrichment } from "@/lib/mock-orders";

describe("mock order enrichment", () => {
  it("loads enrichment map from mock_orders.json", async () => {
    const enrichment = await loadMockOrderEnrichment();

    expect(enrichment.size).toBe(50);
    expect(enrichment.get("mock-1-77001234501")).toEqual({
      utmSource: "instagram",
      city: "Алматы",
    });
  });
});
