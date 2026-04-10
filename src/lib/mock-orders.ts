import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { createStableExternalId } from "@/lib/transform";
import { mockOrdersSchema, validateOrThrow } from "@/lib/validation";
import type { MockOrder } from "@/types/order";

export type MockOrderEnrichment = {
  utmSource: string | null;
  city: string | null;
};

export async function loadMockOrderEnrichment() {
  const dataDirPath = path.join(process.cwd(), "data");
  const fileNames = (await readdir(dataDirPath))
    .filter((fileName) => /^mock_orders.*\.json$/i.test(fileName))
    .sort((a, b) => a.localeCompare(b));
  const lookup = new Map<string, MockOrderEnrichment>();

  for (const fileName of fileNames) {
    const filePath = path.join(dataDirPath, fileName);
    const content = await readFile(filePath, "utf-8");
    const orders = validateOrThrow(
      mockOrdersSchema,
      JSON.parse(content) as MockOrder[],
      `${fileName} has invalid structure.`,
    );

    for (const [index, order] of orders.entries()) {
      lookup.set(createStableExternalId(index, order), {
        utmSource: order.customFields?.utm_source ?? null,
        city: order.delivery?.address?.city ?? null,
      });
    }
  }

  return lookup;
}
