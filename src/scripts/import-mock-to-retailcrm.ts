import { readFile } from "node:fs/promises";
import path from "node:path";

import { env } from "@/lib/env";
import {
  buildRetailCrmMockPayload,
  createRetailCrmOrder,
  findRetailCrmOrderByExternalId,
} from "@/lib/retailcrm";
import { createStableExternalId } from "@/lib/transform";
import type { MockOrder } from "@/types/order";

async function main() {
  const filePath = path.join(process.cwd(), "data", "mock_orders.json");
  const content = await readFile(filePath, "utf-8");
  const orders = JSON.parse(content) as MockOrder[];

  for (const [index, order] of orders.entries()) {
    const externalId = createStableExternalId(index, order);
    const payload = buildRetailCrmMockPayload(order, externalId);

    try {
      const existingOrder = await findRetailCrmOrderByExternalId(externalId);

      if (existingOrder) {
        console.log(
          JSON.stringify({
            index,
            externalId,
            retailcrmOrderId: existingOrder.id,
            success: true,
            skipped: true,
          }),
        );
        continue;
      }

      const response = await createRetailCrmOrder(payload, env.RETAILCRM_SITE_CODE);
      console.log(
        JSON.stringify({
          index,
          externalId,
          retailcrmOrderId: response.id ?? response.generatedId ?? null,
          success: true,
          skipped: false,
        }),
      );
    } catch (error) {
      console.error(
        JSON.stringify({
          index,
          externalId,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        }),
      );
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
