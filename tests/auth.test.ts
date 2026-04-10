import { describe, expect, it } from "vitest";

import {
  isAuthorizedByBasicAuth,
  parseBasicAuthHeader,
} from "@/lib/auth";

const config = {
  username: "dashboard-admin",
  password: "secret-pass",
};

function encode(username: string, password: string) {
  return `Basic ${Buffer.from(`${username}:${password}`, "utf8").toString("base64")}`;
}

describe("basic auth helpers", () => {
  it("parses valid basic auth headers", () => {
    expect(parseBasicAuthHeader(encode("demo", "pass"))).toEqual({
      username: "demo",
      password: "pass",
    });
  });

  it("returns null for malformed basic auth headers", () => {
    expect(parseBasicAuthHeader(null)).toBeNull();
    expect(parseBasicAuthHeader("Bearer test")).toBeNull();
    expect(parseBasicAuthHeader("Basic ???")).toBeNull();
  });

  it("validates credentials against configured dashboard auth", () => {
    expect(isAuthorizedByBasicAuth(encode("dashboard-admin", "secret-pass"), config)).toBe(true);
    expect(isAuthorizedByBasicAuth(encode("dashboard-admin", "wrong"), config)).toBe(false);
    expect(isAuthorizedByBasicAuth(null, config)).toBe(false);
  });
});
