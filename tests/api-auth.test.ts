import { describe, expect, it } from "vitest";

import { assertApiToken } from "@/lib/api-auth";
import { AppError } from "@/lib/errors";

describe("api token protection", () => {
  it("accepts matching x-api-token values", () => {
    process.env.API_PROTECTION_TOKEN = "demo-token";

    expect(() => assertApiToken("demo-token")).not.toThrow();
  });

  it("rejects missing or invalid x-api-token values", () => {
    process.env.API_PROTECTION_TOKEN = "demo-token";

    expect(() => assertApiToken(null)).toThrow(AppError);
    expect(() => assertApiToken("wrong-token")).toThrow(AppError);
  });
});
