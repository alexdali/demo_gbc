import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { createStableExternalId } from "@/lib/transform";
import { mockOrdersSchema, validateOrThrow } from "@/lib/validation";
import type { MockOrder } from "@/types/order";

export type MockOrderEnrichment = {
  utmSource: string | null;
  city: string | null;
};

async function listMockOrderFiles(dataDirPath: string) {
  try {
    return (await readdir(dataDirPath))
      .filter((fileName) => /^mock_orders.*\.json$/i.test(fileName))
      .sort((a, b) => a.localeCompare(b))
      .map((fileName) => path.join(dataDirPath, fileName));
  } catch (error) {
    const isMissingDirectory =
      error instanceof Error && "code" in error && error.code === "ENOENT";

    if (isMissingDirectory) {
      return [];
    }

    throw error;
  }
}

export async function loadMockOrderEnrichment() {
  const rootDataDirPath = path.join(process.cwd(), "data");
  const localDataDirPath = path.join(rootDataDirPath, "local");
  const filePaths = [
    ...(await listMockOrderFiles(rootDataDirPath)),
    ...(await listMockOrderFiles(localDataDirPath)),
  ];
  const lookup = new Map<string, MockOrderEnrichment>();

  for (const filePath of filePaths) {
    const fileName = path.basename(filePath);
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
