import { getRequest, postRequest } from "@/config/http.config";
import apiPathConstants            from "@/constants/api-path.constants";

// ── Types ──────────────────────────────────────────────────────────────────────

export type ChartPoint = { day: string; requests: number };

export type KeyBreakdownItem = {
  keyId:   string;
  keyName: string;
  count:   number;
  amount:  number;
};

export type PendingInvoice = {
  invoiceId:     string;
  month:         number;
  year:          number;
  totalRequests: number;
  subtotal:           number;
  gst:                number;
  total:              number;
  status:             string;
  dueDate:            string;
  overdue:            boolean;
};

export type LastPaidInvoice = {
  invoiceId: string;
  month:     number;
  year:      number;
  total:     number;
  paidAt:    string;
};

export type BillingOverviewResponse = {
  currentMonth: {
    month:         number;
    year:          number;
    totalRequests: number;
    subtotal:     number;
    gst:          number;
    total:        number;
    chartData:    ChartPoint[];
    keyBreakdown: KeyBreakdownItem[];
  };
  pendingInvoice:  PendingInvoice | null;
  lastPaidInvoice: LastPaidInvoice | null;
};

export type InvoiceHistoryItem = {
  invoiceId:     string;
  month:         number;
  year:          number;
  totalRequests: number;
  subtotal:           number;
  gst:                number;
  total:              number;
  status:             "pending" | "paid";
  createdAt:          string;
  paidAt:             string | null;
};

export type RazorpayOrderResponse = {
  orderId:   string;
  amount:    number;
  currency:  string;
  invoiceId: string;
};



export const getBillingOverview = (orgId: string, accessToken: string) =>
  getRequest<BillingOverviewResponse>(apiPathConstants.billing.overview, {
    accessToken,
    params: { orgId },
  });

export const getBillingHistory = (orgId: string, accessToken: string) =>
  getRequest<InvoiceHistoryItem[]>(apiPathConstants.billing.history, {
    accessToken,
    params: { orgId },
  });

export const createRazorpayOrder = (
  orgId:       string,
  invoiceId:   string,
  accessToken: string,
) =>
  postRequest<RazorpayOrderResponse>(
    apiPathConstants.billing.order,
    { invoiceId },
    { accessToken, params: { orgId } },
  );

export const verifyRazorpayPayment = (
  orgId:       string,
  data: {
    invoiceId:         string;
    razorpayOrderId:   string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  },
  accessToken: string,
) =>
  postRequest<{ success: boolean }>(
    apiPathConstants.billing.verify,
    data,
    { accessToken, params: { orgId } },
  );
