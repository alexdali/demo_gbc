import { env } from "@/lib/env";
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

  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      "X-API-KEY": env.RETAILCRM_API_KEY,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`RetailCRM request failed: ${response.status} ${response.statusText}`);
  }

  const payload = (await response.json()) as RetailCrmResponse<T>;

  if (!payload.success) {
    const message = payload.errorMsg ?? JSON.stringify(payload.errors ?? {});
    throw new Error(`RetailCRM API error: ${message}`);
  }

  return payload;
}

export async function createRetailCrmOrder(order: Record<string, unknown>, site?: string) {
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
  searchParams.set("limit", "1");

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
  const searchParams = new URLSearchParams();
  searchParams.set("page", String(page));
  searchParams.set("limit", String(limit));

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
    orderType: mockOrder.orderType ?? "eshop-individual",
    orderMethod: mockOrder.orderMethod ?? "shopping-cart",
    status: mockOrder.status ?? "new",
    customerComment: mockOrder.delivery?.address?.text ?? undefined,
    items: mockOrder.items.map((item) => ({
      initialPrice: item.initialPrice,
      quantity: item.quantity,
      productName: item.productName,
    })),
    delivery: mockOrder.delivery,
    customFields: mockOrder.customFields,
    totalSumm,
  };
}
