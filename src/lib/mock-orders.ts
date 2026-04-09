import { readFile } from "node:fs/promises";
import path from "node:path";

import { createStableExternalId } from "@/lib/transform";
import type { MockOrder } from "@/types/order";

export type MockOrderEnrichment = {
  utmSource: string | null;
  city: string | null;
};

export async function loadMockOrderEnrichment() {
  const filePath = path.join(process.cwd(), "data", "mock_orders.json");
  const content = await readFile(filePath, "utf-8");
  const orders = JSON.parse(content) as MockOrder[];

  const lookup = new Map<string, MockOrderEnrichment>();

  for (const [index, order] of orders.entries()) {
    lookup.set(createStableExternalId(index, order), {
      utmSource: order.customFields?.utm_source ?? null,
      city: order.delivery?.address?.city ?? null,
    });
  }

  return lookup;
}
