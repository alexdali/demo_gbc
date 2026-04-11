import { describe, expect, it } from "vitest";

import {
  buildRetailCrmCustomFields,
  extractUtmSourceFromCustomFields,
} from "@/lib/utm-source";

describe("utm source mapping", () => {
  it("writes utm source into the configured CRM field code", () => {
    expect(
      buildRetailCrmCustomFields("instagram", { some_flag: "yes" }, "traffic_source_dict"),
    ).toEqual({
      some_flag: "yes",
      traffic_source_dict: "instagram",
    });
  });

  it("reads utm source only from the configured CRM field code", () => {
    expect(
      extractUtmSourceFromCustomFields(
        {
          utm_source: "instagram",
        },
        "utm_source",
      ),
    ).toBe("instagram");
  });
});
