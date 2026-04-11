type CustomFields = Record<string, string | undefined> | null | undefined;
export const RETAILCRM_UTM_SOURCE_FIELD_CODE = "utm_source";
export const RETAILCRM_UTM_SOURCE_DICTIONARY_CODE = "utm_source_dict";
export const RETAILCRM_UTM_SOURCE_DICTIONARY_NAME = "UTM Source";
export const DEFAULT_UTM_SOURCE_ORDERING_STEP = 10;

export function getRetailCrmUtmSourceFieldCode() {
  return RETAILCRM_UTM_SOURCE_FIELD_CODE;
}

export function extractUtmSourceFromCustomFields(
  customFields: CustomFields,
  fieldCode = getRetailCrmUtmSourceFieldCode(),
) {
  if (!customFields) {
    return null;
  }

  const value = customFields[fieldCode];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function buildRetailCrmCustomFields(
  utmSource: string | undefined,
  customFields: CustomFields,
  fieldCode = getRetailCrmUtmSourceFieldCode(),
) {
  const mappedFields = { ...(customFields ?? {}) };

  if (utmSource?.trim()) {
    mappedFields[fieldCode] = utmSource.trim();
  }

  return Object.keys(mappedFields).length > 0 ? mappedFields : undefined;
}

export function extractUniqueUtmSources(values: Array<string | null | undefined>) {
  return [...new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value)))]
    .sort((left, right) => left.localeCompare(right));
}
