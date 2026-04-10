import { describe, expect, it } from "vitest";

import { loadMockOrderEnrichment } from "@/lib/mock-orders";

describe("mock order enrichment", () => {
  it("loads enrichment map from all mock_orders*.json files", async () => {
    const enrichment = await loadMockOrderEnrichment();

    expect(enrichment.size).toBe(150);
    expect(enrichment.get("mock-1-77001234501")).toEqual({
      utmSource: "instagram",
      city: "Алматы",
    });
    expect(enrichment.get("cleanup-demo-100-1-77090000001")).toEqual({
      utmSource: "instagram",
      city: "Алматы",
    });
  });
});
