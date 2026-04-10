import { readFile } from "node:fs/promises";
import path from "node:path";

import { env } from "@/lib/env";
import { getReadableError } from "@/lib/errors";
import {
  buildRetailCrmMockPayload,
  createRetailCrmOrder,
  findRetailCrmOrderByExternalId,
} from "@/lib/retailcrm";
import { createStableExternalId } from "@/lib/transform";
import {
  importScriptArgsSchema,
  mockOrdersSchema,
  validateOrThrow,
} from "@/lib/validation";
import type { MockOrder } from "@/types/order";

function parseArgs() {
  const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
  const fileArg = process.argv.find((arg) => arg.startsWith("--file="));
  const dryRun = process.argv.includes("--dry-run");
  const skipExistingCheck = process.argv.includes("--skip-existing-check");
  const limitText = limitArg ? limitArg.split("=")[1] : null;
  const filePath = fileArg ? fileArg.split("=")[1] : null;
  const parsedLimit = limitText ? Number(limitText) : null;

  return validateOrThrow(
    importScriptArgsSchema,
    {
      dryRun,
      skipExistingCheck,
      limit:
        limitArg === undefined
          ? null
          : Number.isFinite(parsedLimit) && parsedLimit && parsedLimit > 0
            ? parsedLimit
            : Number.NaN,
      filePath,
    },
    "CLI arguments for import-mock-to-retailcrm are invalid.",
  );
}

async function main() {
  const { dryRun, limit, skipExistingCheck, filePath } = parseArgs();
  const resolvedFilePath = filePath
    ? path.resolve(process.cwd(), filePath)
    : path.join(process.cwd(), "data", "mock_orders.json");
  const content = await readFile(resolvedFilePath, "utf-8");
  const orders = validateOrThrow(
    mockOrdersSchema,
    JSON.parse(content) as MockOrder[],
    `${path.basename(resolvedFilePath)} has invalid structure.`,
  );
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
      const readable = getReadableError(error, "RetailCRM import failed.");
      console.error(
        JSON.stringify({
          index,
          externalId,
          success: false,
          error: readable.message,
          details: readable.details,
        }),
      );
    }
  }
}

main().catch((error) => {
  const readable = getReadableError(error, "Import script failed.");
  console.error(JSON.stringify({ success: false, error: readable.message, details: readable.details }));
  process.exit(1);
});
