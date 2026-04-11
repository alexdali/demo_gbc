import { describe, expect, it } from "vitest";

import { extractUniqueUtmSources } from "@/lib/utm-source";

describe("utm source values", () => {
  it("extracts unique normalized utm source codes", () => {
    expect(
      extractUniqueUtmSources([
        " instagram ",
        "google",
        "instagram",
        undefined,
        null,
        "direct",
      ]),
    ).toEqual(["direct", "google", "instagram"]);
  });
});
