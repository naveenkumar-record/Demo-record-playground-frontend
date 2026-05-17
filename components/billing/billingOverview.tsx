"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ArrowUpDown,
  Wallet,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button }            from "@/components/ui/button";
import { Separator }         from "@/components/ui/separator";
import { Skeleton }          from "@/components/ui/skeleton";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import { useOrg }          from "@/components/layout/orgContext";
import { getAccessToken }  from "@/lib/auth-client";
import {
  getBillingOverview,
  createRazorpayOrder,
  verifyRazorpayPayment,
  BillingOverviewResponse,
} from "@/api/billing.api";



const RATE       = 28;
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];


declare global {
  interface Window {

    Razorpay: any;
  }
}



const fmt = (n: number) =>
  `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;



export default function BillingOverview() {
  const { activeOrg }  = useOrg();
  const [data, setData]       = useState<BillingOverviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [paying, setPaying]   = useState(false);
  const [paid, setPaid]       = useState(false);


  useEffect(() => {
    if (document.getElementById("razorpay-script")) return;
    const script    = document.createElement("script");
    script.id       = "razorpay-script";
    script.src      = "https://checkout.razorpay.com/v1/checkout.js";
    script.async    = true;
    document.body.appendChild(script);
  }, []);


  useEffect(() => {
    if (!activeOrg?.orgId) return;

    setLoading(true);
    setError(null);
    const token = getAccessToken();
    getBillingOverview(activeOrg.orgId, token ?? "")
      .then(r => { if (r.data) setData(r.data); })
      .catch(err => setError(err?.message ?? "Failed to load billing data"))
      .finally(() => setLoading(false));
  }, [activeOrg?.orgId]);


  const handlePayNow = useCallback(async () => {
    if (!data?.pendingInvoice || !activeOrg?.orgId) return;
    setPaying(true);

    try {
      const token = getAccessToken();
      const order = await createRazorpayOrder(
        activeOrg.orgId,
        data.pendingInvoice.invoiceId,
        token ?? "",
      );
      if (!order.data) return;

      const { orderId, amount, currency, invoiceId } = order.data;

      const options = {
        key:      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "",
        amount,
        currency,
        name:     "Record",
        description: `Invoice ${invoiceId}`,
        order_id: orderId,
        handler: async (response: {
          razorpay_order_id:   string;
          razorpay_payment_id: string;
          razorpay_signature:  string;
        }) => {
          await verifyRazorpayPayment(
            activeOrg.orgId,
            {
              invoiceId,
              razorpayOrderId:   response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            },
            token ?? "",
          );
          setPaid(true);
          // Reset so next load shows no pending invoice
          setData(prev =>
            prev ? { ...prev, pendingInvoice: null } : prev,
          );
        },
        theme: { color: "#10b981" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } finally {
      setPaying(false);
    }
  }, [data?.pendingInvoice, activeOrg?.orgId]);

  if (!activeOrg?.orgId || loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-5 w-32" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-[13px] text-red-600">
        {error}
      </div>
    );
  }

  const cm = data?.currentMonth;
  const pi = data?.pendingInvoice;
  const lp = data?.lastPaidInvoice;

  const stats = [
    {
      icon:      <ArrowUpDown className="h-5 w-5 text-emerald-600" />,
      title:     "Month-to-Date Usage",
      value:     fmt(cm?.subtotal ?? 0),
      subtitle:  `${cm?.totalRequests ?? 0} total requests`,
      badge:     `${MONTH_NAMES[(cm?.month ?? 1) - 1]} ${cm?.year ?? ""}`,
      iconBg:    "bg-emerald-100",
      badgeStyle: "bg-emerald-100 text-emerald-700",
      border:    "border-gray-200",
    },
    {
      icon:      <Wallet className={`h-5 w-5 ${pi?.overdue ? "text-red-600" : "text-amber-600"}`} />,
      title:     "Pending Invoice",
      value:     pi ? fmt(pi.total) : "—",
      subtitle:  pi
        ? `${pi.totalRequests} requests · ${MONTH_NAMES[pi.month - 1]} ${pi.year}`
        : "No pending invoice",
      badge:     pi?.overdue
        ? "Keys deactivated"
        : pi
          ? `Due ${new Date(pi.dueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`
          : "All clear",
      iconBg:    pi?.overdue ? "bg-red-100" : "bg-amber-100",
      badgeStyle: pi?.overdue
        ? "bg-red-100 text-red-700"
        : pi
          ? "bg-amber-100 text-amber-700"
          : "bg-green-100 text-green-700",
      border:    pi?.overdue ? "border-gray-200" : "border-gray-200",
    },
    {
      icon:      <Clock className="h-5 w-5 text-blue-600" />,
      title:     "Last Invoice Paid",
      value:     lp ? fmt(lp.total) : "—",
      subtitle:  lp
        ? `${MONTH_NAMES[lp.month - 1]} ${lp.year} · ${lp.invoiceId}`
        : "No payment yet",
      badge:     lp
        ? `Paid ${new Date(lp.paidAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`
        : "—",
      iconBg:    "bg-blue-100",
      badgeStyle: "bg-blue-100 text-blue-700",
      border:    "border-gray-200",
    },
  ];

  const chartLabel = cm
    ? `Daily requests — ${MONTH_NAMES[cm.month - 1]} ${cm.year}`
    : "Daily requests";

  // Max bars for progress width
  const maxBreakdown = Math.max(1, ...(cm?.keyBreakdown ?? []).map(k => k.count));

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <p className="text-[13px] font-semibold tracking-[0.08em] text-[#6f6f6f] uppercase">
        This Billing Cycle
      </p>

      {/* STATS */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item, i) => (
          <Card key={i} className={`rounded-2xl !py-1 border ${item.border} shadow-sm`}>
            <CardContent className="!p-2 !ml-3">

              <div className={`flex h-[40px] w-[40px] items-center justify-center rounded-xl ${item.iconBg}`}>
                {item.icon}
              </div>

              <div className="mt-2">
                <p className="text-[12px] font-medium tracking-wide text-[#6f6f6f] uppercase">
                  {item.title}
                </p>
                <p className="text-[24px] font-semibold text-[#111]">
                  {item.value}
                </p>
                <p className="text-[11px] text-[#6f6f6f]">
                  {item.subtitle}
                </p>
                <span className={`inline-flex mt-2 rounded-full px-4 py-[6px] text-[11px] font-medium ${item.badgeStyle}`}>
                  {item.badge}
                </span>
              </div>

            </CardContent>
          </Card>
        ))}
      </div>

      {/* CHART */}
      <Card className="rounded-2xl border shadow-sm">
        <CardContent className="p-6 space-y-6">

          <div className="flex justify-between">
            <h3 className="text-[14px] font-medium">{chartLabel}</h3>
            <span className="flex items-center gap-1 text-[12px] text-emerald-600">
              <span className="h-2 w-2 bg-emerald-500 rounded-full" /> Requests
            </span>
          </div>

          <div className="h-[260px]">
            <ResponsiveContainer>
              <LineChart data={cm?.chartData ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="requests"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  activeDot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

        </CardContent>
      </Card>

      {/* KEY BREAKDOWN */}
      {(cm?.keyBreakdown?.length ?? 0) > 0 && (
        <div>
          <h3 className="text-[14px] font-medium mb-3">API key breakdown — {MONTH_NAMES[(cm?.month ?? 1) - 1]} {cm?.year}</h3>
          <Card className="rounded-2xl border shadow-sm">
            <CardContent className="p-6 space-y-5">
              {cm?.keyBreakdown.map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between text-[13px]">
                    <span className="font-medium">{item.keyName}</span>
                    <span className="text-[#6f6f6f]">
                      {item.count} requests · {fmt(item.amount)}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded mt-2">
                    <div
                      className="h-2 bg-emerald-500 rounded transition-all"
                      style={{ width: `${(item.count / maxBreakdown) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {pi && !paid && (
        <div className="space-y-3">

          {/* Overdue warning banner */}
          {pi.overdue && (
            <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-[13px] font-semibold text-red-700">
                  Your API keys have been deactivated
                </p>
                <p className="text-[12px] text-red-600 mt-0.5">
                  The grace period (1–15 {MONTH_NAMES[pi.month % 12]}) has passed. Pay the invoice below to reactivate all live API keys immediately.
                </p>
              </div>
            </div>
          )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className={`rounded-2xl border bg-white shadow-sm ${pi.overdue ? "border-red-300" : ""}`}>
            <CardContent className="p-6 space-y-6">

              <div className="flex justify-between items-start">
                <div>
                  <p className="text-md font-semibold text-[#111]">{pi.invoiceId}</p>
                  <p className="text-[14px] text-[#6f6f6f] mt-1">
                    {MONTH_NAMES[pi.month - 1]} {pi.year}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-[12px] font-medium ${
                  pi.overdue
                    ? "bg-red-100 text-red-700"
                    : "bg-amber-100 text-amber-700"
                }`}>
                  {pi.overdue ? "Overdue" : "Pending"}
                </span>
              </div>

              <div className="space-y-4 text-[14px]">
                <div className="flex justify-between">
                  <p className="text-[#6f6f6f]">Total requests</p>
                  <p className="font-medium text-[#111]">{pi.totalRequests.toLocaleString("en-IN")}</p>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <p className="text-[#6f6f6f]">Rate</p>
                  <p className="font-medium text-[#111]">₹{RATE} / request</p>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <p className="text-[#6f6f6f]">Subtotal</p>
                  <p className="font-medium text-[#111]">{fmt(pi.subtotal)}</p>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <p className="text-[#6f6f6f]">GST (18%)</p>
                  <p className="font-medium text-[#111]">{fmt(pi.gst)}</p>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between items-center pt-2">
                <p className="text-[16px] font-semibold text-[#111]">Total payable</p>
                <p className="text-[22px] font-semibold text-emerald-600">{fmt(pi.total)}</p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                  onClick={handlePayNow}
                  disabled={paying}
                >
                  {paying ? "Opening payment..." : "Pay now"}
                </Button>
              </div>

            </CardContent>
          </Card>
        </div>
        </div>
      )}

      {paid && (
        <Card className="rounded-2xl border border-emerald-200 bg-emerald-50 shadow-sm">
          <CardContent className="p-6 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <p className="text-[14px] text-emerald-700 font-medium">
              Payment successful! Your invoice has been marked as paid.
            </p>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
