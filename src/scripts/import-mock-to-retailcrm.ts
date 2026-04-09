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

function parseArgs() {
  const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
  const dryRun = process.argv.includes("--dry-run");
  const skipExistingCheck = process.argv.includes("--skip-existing-check");
  const limit = limitArg ? Number(limitArg.split("=")[1]) : null;

  return {
    dryRun,
    skipExistingCheck,
    limit: Number.isFinite(limit) && limit && limit > 0 ? limit : null,
  };
}

async function main() {
  const filePath = path.join(process.cwd(), "data", "mock_orders.json");
  const content = await readFile(filePath, "utf-8");
  const orders = JSON.parse(content) as MockOrder[];
  const { dryRun, limit, skipExistingCheck } = parseArgs();
  const selectedOrders = limit ? orders.slice(0, limit) : orders;

  for (const [index, order] of selectedOrders.entries()) {
    const externalId = createStableExternalId(index, order);
    const payload = buildRetailCrmMockPayload(order, externalId);

    try {
      if (dryRun) {
        console.log(
          JSON.stringify({
            index,
            externalId,
            success: true,
            skipped: false,
            dryRun: true,
            payload,
          }),
        );
        continue;
      }

      if (!skipExistingCheck) {
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
