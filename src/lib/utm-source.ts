type CustomFields = Record<string, string | undefined> | null | undefined;
export const RETAILCRM_UTM_SOURCE_FIELD_CODE = "utm_source";

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
