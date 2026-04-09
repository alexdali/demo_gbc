export type MockOrder = {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  orderType?: string;
  orderMethod?: string;
  status?: string;
  items: Array<{
    productName: string;
    quantity: number;
    initialPrice: number;
  }>;
  delivery?: {
    address?: {
      city?: string;
      text?: string;
    };
  };
  customFields?: Record<string, string | undefined>;
};

export type RetailCrmOrder = {
  id: number;
  number?: string;
  externalId?: string;
  createdAt?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  status?: string;
  totalSumm?: number | string;
  summ?: number | string;
  orderMethod?: string;
  orderType?: string;
  customFields?: Record<string, string | undefined>;
  delivery?: {
    address?: {
      city?: string;
      text?: string;
    };
  };
  items?: Array<{
    quantity?: number | string;
    initialPrice?: number | string;
    purchasePrice?: number | string;
    offer?: {
      name?: string;
    };
  }>;
};

export type SupabaseOrderRow = {
  retailcrm_order_id: number;
  external_id: string | null;
  order_number: string | null;
  created_at: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  city: string | null;
  status: string | null;
  utm_source: string | null;
  total_amount: number;
  currency: string;
  raw_payload: RetailCrmOrder;
  synced_at: string;
  notified_high_value?: boolean;
};

export type DashboardKpi = {
  totalOrders: number;
  totalRevenue: number;
  highValueOrders: number;
  averageOrderValue: number;
};

export type DailyOrdersPoint = {
  date: string;
  orders: number;
  revenue: number;
};

export type BreakdownPoint = {
  label: string;
  count: number;
  revenue: number;
};
