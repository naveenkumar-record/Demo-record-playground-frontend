"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button }    from "@/components/ui/button";
import { Skeleton }  from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Download, Printer } from "lucide-react";

import { useOrg }         from "@/components/layout/orgContext";
import { getAccessToken } from "@/lib/auth-client";
import { getBillingHistory, InvoiceHistoryItem } from "@/api/billing.api";

const RATE = 28;
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const fmt = (n: number) =>
  `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });

function InvoiceModal({
  invoice,
  open,
  onClose,
}: {
  invoice: InvoiceHistoryItem | null;
  open:    boolean;
  onClose: () => void;
}) {
  if (!invoice) return null;

  const monthLabel         = `${MONTH_NAMES[invoice.month - 1]} ${invoice.year}`;
  const totalRequests = invoice.totalRequests ?? 0;

  const handlePrint = async () => {
    const win = window.open("", "_blank", "width=960,height=760");
    if (!win) return;

    const accentClr = "#f97316";

    // Embed logo as base64 so it renders in the about:blank print window
    let logoUrl = "";
    try {
      const res  = await fetch("/logo.png");
      const blob = await res.blob();
      logoUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    } catch {
      logoUrl = "";
    }

    const subtotal = invoice.subtotal.toLocaleString("en-IN", { maximumFractionDigits: 0 });
    const gst      = invoice.gst    .toLocaleString("en-IN", { maximumFractionDigits: 0 });
    const total    = invoice.total  .toLocaleString("en-IN", { maximumFractionDigits: 0 });
    const verifs   = totalRequests.toLocaleString("en-IN");

    const issuedDate = new Date(invoice.createdAt).toLocaleDateString("en-IN", {
      day: "2-digit", month: "long", year: "numeric",
    });
    const paidDate = invoice.paidAt
      ? new Date(invoice.paidAt).toLocaleDateString("en-IN", {
          day: "2-digit", month: "long", year: "numeric",
        })
      : null;

    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${invoice.invoiceId}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    @page { size: A4; margin: 0; }

    body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      background: #f4f4f5;
      min-height: 100vh;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding: 40px 20px;
      color: #111827;
    }

    /* ── Page card ── */
    .page {
      background: #fff;
      width: 680px;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 32px rgba(0,0,0,0.10);
    }

    /* ── Header band ── */
    .header {
      background: linear-gradient(135deg, #7c2d12 0%, #c2410c 55%, #ea580c 100%);
      padding: 36px 40px 32px;
      color: #fff;
    }
    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .brand-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand-logo {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      object-fit: contain;
      background: rgba(255,255,255,0.15);
      padding: 3px;
    }
    .brand { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; color: #fff; }
    .brand-sub {
      font-size: 11px;
      color: #fed7aa;
      margin-top: 2px;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 14px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      background: #dcfce7;
      color: #15803d;
    }
    .badge-dot {
      width: 7px; height: 7px;
      border-radius: 50%;
      background: #15803d;
      opacity: 0.7;
    }
    .header-body { margin-top: 28px; }
    .inv-id {
      font-size: 26px;
      font-weight: 700;
      letter-spacing: -0.5px;
      color: #fff;
    }
    .inv-period { font-size: 13px; color: #fdba74; margin-top: 4px; }

    /* ── Meta row ── */
    .meta-row {
      display: flex;
      border-bottom: 1px solid #f3f4f6;
    }
    .meta-cell {
      flex: 1;
      padding: 18px 24px;
      border-right: 1px solid #f3f4f6;
    }
    .meta-cell:last-child { border-right: none; }
    .meta-label {
      font-size: 10px;
      font-weight: 600;
      color: #9ca3af;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .meta-value { font-size: 13px; font-weight: 600; color: #111827; }

    /* ── Body ── */
    .body { padding: 32px 40px; }
    .section-title {
      font-size: 10px;
      font-weight: 700;
      color: #9ca3af;
      letter-spacing: 0.10em;
      text-transform: uppercase;
      margin-bottom: 12px;
    }

    /* ── Line items ── */
    .line-items {
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      overflow: hidden;
    }
    .li-head {
      display: grid;
      grid-template-columns: 1fr auto;
      background: #fff7ed;
      padding: 10px 16px;
      font-size: 10px;
      font-weight: 700;
      color: #9a3412;
      letter-spacing: 0.07em;
      text-transform: uppercase;
    }
    .li-row {
      display: grid;
      grid-template-columns: 1fr auto;
      padding: 13px 16px;
      border-top: 1px solid #f3f4f6;
      font-size: 13px;
      align-items: center;
    }
    .li-row:first-of-type { border-top: none; }
    .li-desc { color: #374151; }
    .li-desc small { display: block; color: #9ca3af; font-size: 11px; margin-top: 2px; }
    .li-amount { font-weight: 600; color: #111827; text-align: right; }

    /* ── Totals ── */
    .totals {
      margin-top: 20px;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      overflow: hidden;
    }
    .tot-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 16px;
      font-size: 13px;
      border-top: 1px solid #f3f4f6;
      color: #374151;
    }
    .tot-row:first-child { border-top: none; }
    .tot-row .label { color: #6b7280; }
    .tot-row .value { font-weight: 600; color: #111827; }
    .tot-final {
      background: #fff7ed;
      padding: 14px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 2px solid #fed7aa;
    }
    .tot-final .label { font-size: 14px; font-weight: 700; color: #9a3412; }
    .tot-final .value { font-size: 22px; font-weight: 800; color: ${accentClr}; }

    /* ── Payment confirmation ── */
    .paid-note {
      margin-top: 20px;
      display: flex;
      align-items: center;
      gap: 10px;
      background: #fff7ed;
      border: 1px solid #fed7aa;
      border-radius: 10px;
      padding: 12px 16px;
      font-size: 12px;
      color: #9a3412;
      font-weight: 500;
    }
    .paid-icon {
      width: 20px; height: 20px;
      background: ${accentClr};
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      color: #fff;
      font-size: 11px;
      font-weight: 700;
    }

    /* ── Footer ── */
    .footer {
      margin-top: 32px;
      padding-top: 20px;
      border-top: 1px solid #f3f4f6;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .footer-left { display: flex; align-items: center; gap: 8px; }
    .footer-brand { font-size: 12px; font-weight: 700; color: ${accentClr}; }
    .footer-note { font-size: 11px; color: #9ca3af; text-align: right; }

    @media print {
      body { background: #fff; padding: 0; }
      .page { box-shadow: none; border-radius: 0; width: 100%; }
    }
  </style>
</head>
<body>
  <div class="page">

    <!-- Header -->
    <div class="header">
      <div class="header-top">
        <div class="brand-row">
          ${logoUrl ? `<img src="${logoUrl}" class="brand-logo" alt="Record" />` : ""}
          <div>
            <div class="brand">Record</div>
            <div class="brand-sub">Skill Verification Platform</div>
          </div>
        </div>
        <span class="badge">
          <span class="badge-dot"></span>
          PAID
        </span>
      </div>
      <div class="header-body">
        <div class="inv-id">${invoice.invoiceId}</div>
        <div class="inv-period">${monthLabel}</div>
      </div>
    </div>

    <!-- Meta row -->
    <div class="meta-row">
      <div class="meta-cell">
        <div class="meta-label">Issue Date</div>
        <div class="meta-value">${issuedDate}</div>
      </div>
      <div class="meta-cell">
        <div class="meta-label">Billing Period</div>
        <div class="meta-value">${monthLabel}</div>
      </div>
      <div class="meta-cell">
        <div class="meta-label">Requests</div>
        <div class="meta-value">${verifs}</div>
      </div>
      <div class="meta-cell">
        <div class="meta-label">Status</div>
        <div class="meta-value" style="color:#15803d;">Paid</div>
      </div>
    </div>

    <!-- Body -->
    <div class="body">
      <div class="section-title">Charge Breakdown</div>

      <div class="line-items">
        <div class="li-head">
          <span>Description</span>
          <span>Amount</span>
        </div>
        <div class="li-row">
          <div class="li-desc">
            API Requests
            <small>${verifs} requests &times; &#8377;${RATE} / request</small>
          </div>
          <div class="li-amount">&#8377;${subtotal}</div>
        </div>
        <div class="li-row">
          <div class="li-desc">
            GST
            <small>Goods &amp; Services Tax @ 18%</small>
          </div>
          <div class="li-amount">&#8377;${gst}</div>
        </div>
      </div>

      <div class="totals">
        <div class="tot-row">
          <span class="label">Subtotal</span>
          <span class="value">&#8377;${subtotal}</span>
        </div>
        <div class="tot-row">
          <span class="label">GST (18%)</span>
          <span class="value">&#8377;${gst}</span>
        </div>
        <div class="tot-final">
          <span class="label">Total Payable</span>
          <span class="value">&#8377;${total}</span>
        </div>
      </div>

      ${paidDate ? `
      <div class="paid-note">
        <span class="paid-icon">&#10003;</span>
        Payment received on ${paidDate}. Thank you for your business!
      </div>` : ""}

      <!-- Footer -->
      <div class="footer">
        <div class="footer-left">
          ${logoUrl ? `<img src="${logoUrl}" style="width:18px;height:18px;border-radius:4px;object-fit:contain;" alt="" />` : ""}
          <span class="footer-brand">Record</span>
        </div>
        <div class="footer-note">
          System-generated invoice &bull; No signature required<br/>
          For queries, contact support@record.com
        </div>
      </div>
    </div>

  </div>
</body>
</html>`);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[15px]">{invoice.invoiceId}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">

          {/* Invoice header */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-[17px] font-semibold text-[#111]">{invoice.invoiceId}</h1>
              <p className="text-[13px] text-[#6f6f6f] mt-0.5">{monthLabel}</p>
            </div>
            <span className="px-3 py-1 rounded-full text-[11px] font-medium bg-green-100 text-green-700">
              Paid
            </span>
          </div>

          <Separator />

          {/* Breakdown */}
          <div className="space-y-3 text-[13px]">
            <div className="flex justify-between">
              <span className="text-[#6f6f6f]">Total requests</span>
              <span className="font-medium">{totalRequests.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6f6f6f]">Rate</span>
              <span className="font-medium">₹{RATE} / request</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6f6f6f]">Subtotal</span>
              <span className="font-medium">{fmt(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6f6f6f]">GST (18%)</span>
              <span className="font-medium">{fmt(invoice.gst)}</span>
            </div>
          </div>

          <Separator />

          <div className="flex justify-between items-center">
            <span className="text-[15px] font-semibold">Total</span>
            <span className="text-[20px] font-semibold text-orange-600">{fmt(invoice.total)}</span>
          </div>

          {invoice.paidAt && (
            <p className="text-[12px] text-[#6f6f6f]">
              Paid on {fmtDate(invoice.paidAt)}
            </p>
          )}

          <p className="text-[12px] text-[#6f6f6f]">
            Issued {fmtDate(invoice.createdAt)}
          </p>

        </div>

        {/* Download / Print */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={handlePrint}
          >
            <Printer className="h-4 w-4" />
            Download / Print
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}


export default function InvoiceTable() {
  const { activeOrg }  = useOrg();
  const [invoices, setInvoices] = useState<InvoiceHistoryItem[]>([]);
  const [loading, setLoading]   = useState(false);
  const [selected, setSelected] = useState<InvoiceHistoryItem | null>(null);

  useEffect(() => {
    if (!activeOrg?.orgId) return;

    setLoading(true);
    const token = getAccessToken();
    getBillingHistory(activeOrg.orgId, token ?? "")
      .then(r => { if (r.data) setInvoices(r.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeOrg?.orgId]);

  if (!activeOrg?.orgId || loading) {
    return (
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center text-[13px] text-[#7a7a7a]">
        No invoices yet. Your first invoice will appear here next month.
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-[13px]">
          <thead className="bg-[#fafafa] text-[#7a7a7a]">
            <tr>
              <th className="text-left p-3">Invoice</th>
              <th className="text-left p-3">Period</th>
              <th className="text-left p-3">Amount</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Date</th>
              <th className="text-left p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.invoiceId} className="border-t hover:bg-[#fafafa]">

                <td className="p-3 font-medium">{inv.invoiceId}</td>

                <td className="p-3 text-[#7a7a7a]">
                  {MONTH_NAMES[inv.month - 1]} {inv.year}
                </td>

                <td className="p-3 font-medium">{fmt(inv.total)}</td>

                <td className="p-3">
                  {inv.status === "paid" ? (
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="text-green-700">Paid</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-amber-400 rounded-full" />
                      <span className="text-amber-700">Pending</span>
                    </span>
                  )}
                </td>

                <td className="p-3 text-[#7a7a7a]">
                  {inv.paidAt ? fmtDate(inv.paidAt) : fmtDate(inv.createdAt)}
                </td>

                {/* View / Download — only available after payment */}
                <td className="p-3">
                  {inv.status === "paid" ? (
                    <button
                      className="flex items-center gap-1 text-[#111] underline underline-offset-2 hover:text-orange-600 transition-colors"
                      onClick={() => setSelected(inv)}
                    >
                      <Download className="h-3.5 w-3.5" />
                      View
                    </button>
                  ) : (
                    <span className="text-[#c4c4c4] text-[12px] select-none">—</span>
                  )}
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <InvoiceModal
        invoice={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
      />
    </>
  );
}
