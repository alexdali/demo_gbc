import { env } from "@/lib/env";
import { AppError } from "@/lib/errors";
import {
  retailCrmCreateOrderSchema,
  retailCrmListParamsSchema,
  validateOrThrow,
} from "@/lib/validation";
import type { MockOrder, RetailCrmOrder } from "@/types/order";

type RetailCrmResponse<T> = {
  success: boolean;
  generatedId?: number;
  id?: number;
  order?: T;
  orders?: T[];
  pagination?: {
    currentPage: number;
    totalPageCount: number;
  };
  errorMsg?: string;
  errors?: Record<string, string>;
};

export function buildRetailCrmUrl(path: string, params?: URLSearchParams) {
  const normalizedBase = env.RETAILCRM_BASE_URL.replace(/\/$/, "");
  const normalizedPath = path.replace(/^\//, "");
  const url = new URL(`${normalizedBase}/api/v5/${normalizedPath}`);

  if (params) {
    params.forEach((value, key) => url.searchParams.set(key, value));
  }

  return url;
}

async function retailCrmRequest<T>(
  path: string,
  init?: RequestInit & { searchParams?: URLSearchParams },
) {
  const url = buildRetailCrmUrl(path, init?.searchParams);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  let response: Response;

  try {
    response = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "X-API-KEY": env.RETAILCRM_API_KEY,
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new AppError("RetailCRM did not respond within 20 seconds.", 504, url.toString());
    }

    throw new AppError("RetailCRM request failed before receiving a response.", 502);
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const errorBody = await response.text();
    throw new AppError(
      `RetailCRM responded with ${response.status} ${response.statusText}.`,
      502,
      errorBody || undefined,
    );
  }

  const payload = (await response.json()) as RetailCrmResponse<T>;

  if (!payload.success) {
    const message = payload.errorMsg ?? JSON.stringify(payload.errors ?? {});
    throw new AppError("RetailCRM rejected the request.", 400, message);
  }

  return payload;
}

export async function createRetailCrmOrder(order: Record<string, unknown>, site?: string) {
  validateOrThrow(
    retailCrmCreateOrderSchema,
    order,
    "RetailCRM order payload is invalid.",
  );

  const body = new URLSearchParams();
  body.set("order", JSON.stringify(order));

  if (site) {
    body.set("site", site);
  }

  return retailCrmRequest<number>("orders/create", {
    method: "POST",
    body,
  });
}

export async function findRetailCrmOrderByExternalId(externalId: string) {
  const searchParams = new URLSearchParams();
  searchParams.append("filter[externalIds][]", externalId);
  searchParams.set("limit", "20");

  const response = await retailCrmRequest<RetailCrmOrder>("orders", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    searchParams,
  });

  return response.orders?.[0] ?? null;
}

export async function listRetailCrmOrders(page = 1, limit = 100) {
  const validated = validateOrThrow(
    retailCrmListParamsSchema,
    { page, limit },
    "RetailCRM list parameters are invalid.",
  );
  const searchParams = new URLSearchParams();
  searchParams.set("page", String(validated.page));
  searchParams.set("limit", String(validated.limit));

  return retailCrmRequest<RetailCrmOrder>("orders", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    searchParams,
  });
}

export function buildRetailCrmMockPayload(mockOrder: MockOrder, externalId: string) {
  const totalSumm = mockOrder.items.reduce(
    (sum, item) => sum + item.quantity * item.initialPrice,
    0,
  );

  return {
    externalId,
    firstName: mockOrder.firstName,
    lastName: mockOrder.lastName,
    phone: mockOrder.phone,
    email: mockOrder.email,
    customerComment: mockOrder.delivery?.address?.text ?? undefined,
    customFields: mockOrder.customFields,
    items: mockOrder.items.map((item) => ({
      initialPrice: item.initialPrice,
      quantity: item.quantity,
      productName: item.productName,
    })),
    delivery: mockOrder.delivery,
    totalSumm,
    ...(env.RETAILCRM_ORDER_TYPE_CODE
      ? { orderType: env.RETAILCRM_ORDER_TYPE_CODE }
      : {}),
    ...(env.RETAILCRM_ORDER_METHOD_CODE
      ? { orderMethod: env.RETAILCRM_ORDER_METHOD_CODE }
      : {}),
    ...(env.RETAILCRM_STATUS_CODE ? { status: env.RETAILCRM_STATUS_CODE } : {}),
  };
}
