import { z } from "zod";

import { AppError } from "@/lib/errors";

export const retailCrmListParamsSchema = z.object({
  page: z.number().int().positive(),
  limit: z.union([z.literal(20), z.literal(50), z.literal(100)]),
});

export const retailCrmCreateOrderSchema = z.object({
  externalId: z.string().min(1, "RetailCRM order payload must include externalId."),
  phone: z.string().min(1, "RetailCRM order payload must include phone."),
  items: z
    .array(
      z.object({
        quantity: z.number().positive("RetailCRM item quantity must be greater than 0."),
        initialPrice: z.number().nonnegative("RetailCRM item price cannot be negative."),
        productName: z.string().min(1, "RetailCRM item must include productName."),
      }),
    )
    .min(1, "RetailCRM order payload must contain at least one item."),
});

export const telegramTestBodySchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, "Telegram message text cannot be empty.")
    .max(4000, "Telegram message text is too long.")
    .optional(),
});

export const importScriptArgsSchema = z.object({
  dryRun: z.boolean(),
  skipExistingCheck: z.boolean(),
  limit: z.number().int().positive().max(50).nullable(),
});

export function validateOrThrow<T>(schema: z.ZodSchema<T>, value: unknown, message: string) {
  const result = schema.safeParse(value);

  if (!result.success) {
    const issues = result.error.issues.map((issue) => issue.message).join(" ");
    throw new AppError(message, 400, issues);
  }

  return result.data;
}
