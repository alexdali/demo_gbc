import { describe, expect, it } from "vitest";

import { loadMockOrderEnrichment } from "@/lib/mock-orders";

describe("mock order enrichment", () => {
  it("loads enrichment map from tracked mock_orders*.json files", async () => {
    const enrichment = await loadMockOrderEnrichment();

    expect(enrichment.size).toBeGreaterThanOrEqual(50);
    expect(enrichment.get("mock-1-77001234501")).toEqual({
      utmSource: "instagram",
      city: "Алматы",
    });
  });
});
