import { readFile } from "node:fs/promises";
import path from "node:path";

import { getReadableError } from "@/lib/errors";
import {
  createRetailCrmCustomDictionary,
  createRetailCrmOrderDictionaryField,
  editRetailCrmCustomDictionary,
  findRetailCrmCustomDictionary,
  findRetailCrmCustomField,
} from "@/lib/retailcrm";
import {
  DEFAULT_UTM_SOURCE_ORDERING_STEP,
  extractUniqueUtmSources,
  RETAILCRM_UTM_SOURCE_DICTIONARY_CODE,
  RETAILCRM_UTM_SOURCE_DICTIONARY_NAME,
  RETAILCRM_UTM_SOURCE_FIELD_CODE,
} from "@/lib/utm-source";
import {
  bootstrapUtmDictionaryArgsSchema,
  mockOrdersSchema,
  validateOrThrow,
} from "@/lib/validation";
import type { MockOrder } from "@/types/order";

function parseArgs() {
  const dryRun = process.argv.includes("--dry-run");
  const fileArg = process.argv.find((arg) => arg.startsWith("--file="));
  const filePath = fileArg ? fileArg.split("=")[1] : null;

  return validateOrThrow(
    bootstrapUtmDictionaryArgsSchema,
    {
      dryRun,
      filePath,
    },
    "CLI arguments for bootstrap-retailcrm-utm-dictionary are invalid.",
  );
}

async function loadMockOrders(filePath: string | null) {
  const resolvedFilePath = filePath
    ? path.resolve(process.cwd(), filePath)
    : path.join(process.cwd(), "data", "mock_orders.json");
  const content = await readFile(resolvedFilePath, "utf-8");

  return validateOrThrow(
    mockOrdersSchema,
    JSON.parse(content) as MockOrder[],
    `${path.basename(resolvedFilePath)} has invalid structure.`,
  );
}

async function main() {
  const { dryRun, filePath } = parseArgs();
  const orders = await loadMockOrders(filePath);
  const uniqueSources = extractUniqueUtmSources(orders.map((order) => order.utmSource));

  if (uniqueSources.length === 0) {
    throw new Error("No utmSource values were found in the selected mock orders file.");
  }

  const dictionaryElements = uniqueSources.map((value, index) => ({
    name: value,
    code: value,
    ordering: (index + 1) * DEFAULT_UTM_SOURCE_ORDERING_STEP,
  }));

  if (dryRun) {
    console.log(
      JSON.stringify(
        {
          success: true,
          dryRun: true,
          dictionaryCode: RETAILCRM_UTM_SOURCE_DICTIONARY_CODE,
          dictionaryName: RETAILCRM_UTM_SOURCE_DICTIONARY_NAME,
          fieldCode: RETAILCRM_UTM_SOURCE_FIELD_CODE,
          values: uniqueSources,
        },
        null,
        2,
      ),
    );
    return;
  }

  const existingDictionary = await findRetailCrmCustomDictionary(
    RETAILCRM_UTM_SOURCE_DICTIONARY_CODE,
  ).catch(() => null);

  if (!existingDictionary) {
    await createRetailCrmCustomDictionary({
      name: RETAILCRM_UTM_SOURCE_DICTIONARY_NAME,
      code: RETAILCRM_UTM_SOURCE_DICTIONARY_CODE,
      elements: [dictionaryElements[0]],
    });
  }

  await editRetailCrmCustomDictionary(RETAILCRM_UTM_SOURCE_DICTIONARY_CODE, {
    name: RETAILCRM_UTM_SOURCE_DICTIONARY_NAME,
    elements: dictionaryElements,
  });

  const existingField = await findRetailCrmCustomField(
    "order",
    RETAILCRM_UTM_SOURCE_FIELD_CODE,
  ).catch(() => null);

  if (!existingField) {
    await createRetailCrmOrderDictionaryField({
      name: "UTM Source",
      code: RETAILCRM_UTM_SOURCE_FIELD_CODE,
      dictionary: RETAILCRM_UTM_SOURCE_DICTIONARY_CODE,
      displayArea: "customer",
      ordering: 50,
      required: false,
      inFilter: true,
      inList: true,
      inGroupActions: false,
      viewMode: "editable",
      viewModeMobile: "editable",
    });
  }

  console.log(
    JSON.stringify(
      {
        success: true,
        dictionaryCode: RETAILCRM_UTM_SOURCE_DICTIONARY_CODE,
        fieldCode: RETAILCRM_UTM_SOURCE_FIELD_CODE,
        values: uniqueSources,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  const readable = getReadableError(error, "RetailCRM UTM dictionary bootstrap failed.");
  console.error(
    JSON.stringify({ success: false, error: readable.message, details: readable.details }),
  );
  process.exit(1);
});
