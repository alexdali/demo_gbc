import { AppError } from "@/lib/errors";

export function assertApiToken(headerValue: string | null) {
  const expectedToken = process.env.API_PROTECTION_TOKEN;

  if (!expectedToken) {
    throw new AppError(
      "API protection token is not configured.",
      503,
      "Set API_PROTECTION_TOKEN in the environment.",
    );
  }

  if (!headerValue || headerValue !== expectedToken) {
    throw new AppError(
      "Forbidden.",
      403,
      "Provide a valid x-api-token header to call this endpoint directly.",
    );
  }
}
