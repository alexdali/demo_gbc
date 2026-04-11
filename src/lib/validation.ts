import { z } from "zod";

import { AppError } from "@/lib/errors";

export const mockOrderSchema = z.object({
  externalIdPrefix: z.string().trim().min(1).optional(),
  firstName: z.string().trim().min(1, "Mock order must include firstName."),
  lastName: z.string().trim().min(1, "Mock order must include lastName."),
  phone: z.string().trim().min(1, "Mock order must include phone."),
  email: z.string().email().optional(),
  utmSource: z.string().trim().min(1, "Mock order utmSource cannot be empty.").optional(),
  orderType: z.string().trim().min(1).optional(),
  orderMethod: z.string().trim().min(1).optional(),
  status: z.string().trim().min(1).optional(),
  items: z
    .array(
      z.object({
        productName: z.string().trim().min(1, "Mock order item must include productName."),
        quantity: z.number().positive("Mock order item quantity must be greater than 0."),
        initialPrice: z.number().nonnegative("Mock order item price cannot be negative."),
      }),
    )
    .min(1, "Mock order must contain at least one item."),
  delivery: z
    .object({
      address: z
        .object({
          city: z.string().trim().min(1).optional(),
          text: z.string().trim().min(1).optional(),
        })
        .optional(),
    })
    .optional(),
  customFields: z.record(z.string(), z.string().optional()).optional(),
});

export const mockOrdersSchema = z
  .array(mockOrderSchema)
  .min(1, "mock_orders.json must contain at least one order.");

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

export const syncRequestBodySchema = z
  .object({
    confirm: z.literal("sync").optional(),
  })
  .optional();

export const importScriptArgsSchema = z.object({
  dryRun: z.boolean(),
  skipExistingCheck: z.boolean(),
  limit: z.number().int().positive().max(50).nullable(),
  filePath: z.string().trim().min(1).nullable(),
});

export const cleanupScriptArgsSchema = z.object({
  prefix: z.string().trim().min(1, "Cleanup prefix is required."),
});

export function validateOrThrow<T>(schema: z.ZodSchema<T>, value: unknown, message: string) {
  const result = schema.safeParse(value);

  if (!result.success) {
    const issues = result.error.issues.map((issue) => issue.message).join(" ");
    throw new AppError(message, 400, issues);
  }

  return result.data;
}
