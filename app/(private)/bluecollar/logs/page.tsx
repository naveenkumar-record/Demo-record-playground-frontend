"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  listLogs,
  resendLog,
  type LogItem,
  type LogFilters,
  type WhatsAppDeliveryStatus,
} from "@/api/bluecollar.api";
import { listWorkflows, type WorkflowItem } from "@/api/workflow.api";
import { useOrg } from "@/components/layout/orgContext";
import { useTestMode } from "@/components/layout/testModeContext";
import { getAccessToken } from "@/lib/auth-client";
import { toast } from "sonner";

const PAGE_LIMIT = 20;

// ── helpers ────────────────────────────────────────────────────────────────────

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function capitalise(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ── WhatsApp status badge ──────────────────────────────────────────────────────

const STATUS_META: Record<
  WhatsAppDeliveryStatus,
  { label: string; dot: string; pill: string }
> = {
  link_delivered: {
    label: "Link Delivered",
    dot:   "bg-green-500",
    pill:  "bg-green-100 text-green-700",
  },
  sent: {
    label: "Sent – Awaiting Reply",
    dot:   "bg-amber-400",
    pill:  "bg-amber-50 text-amber-600",
  },
  failed: {
    label: "Failed",
    dot:   "bg-red-500",
    pill:  "bg-red-50 text-red-600",
  },
  queued: {
    label: "Queued",
    dot:   "bg-neutral-300",
    pill:  "bg-neutral-100 text-neutral-500",
  },
};

function WhatsAppBadge({
  status,
  error,
}: {
  status: WhatsAppDeliveryStatus;
  error: string;
}) {
  const meta = STATUS_META[status] ?? STATUS_META.queued;
  return (
    <div className="flex flex-col gap-0.5">
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] font-medium",
          meta.pill,
        )}
      >
        <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
        {meta.label}
      </span>
      {error && (
        <span className="pl-1 text-[11px] text-[#9a9a9a]">{error}</span>
      )}
    </div>
  );
}

// ── language badge ─────────────────────────────────────────────────────────────

function LanguageBadge({ language }: { language: string }) {
  return (
    <span className="inline-flex items-center rounded-md bg-neutral-100 px-2 py-0.5 text-[12px] text-[#4a4a4a]">
      {capitalise(language)}
    </span>
  );
}

// ── filter dropdown ────────────────────────────────────────────────────────────

function FilterDropdown({
  label,
  options,
  selected,
  onSelect,
  onClear,
}: {
  label: string;
  options: { label: string; value: string }[];
  selected: string;
  onSelect: (v: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const activeLabel = options.find((o) => o.value === selected)?.label;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-2 text-[13px] transition-colors",
          selected
            ? "border-[#ff5723] bg-orange-50 text-[#ff5723]"
            : "border-neutral-200 bg-white text-[#4a4a4a] hover:bg-neutral-50",
        )}
      >
        {selected ? activeLabel : label}
        {selected ? (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onClear(); setOpen(false); }}
            className="ml-0.5 text-[#ff5723] hover:text-red-500"
          >
            <X className="h-3 w-3" />
          </button>
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-neutral-400" />
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-[180px] overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-[13px] text-[#1f1f1f] hover:bg-neutral-50"
              onClick={() => { onSelect(opt.value); setOpen(false); }}
            >
              {selected === opt.value && <Check className="h-3.5 w-3.5 shrink-0 text-[#ff5723]" />}
              <span className={selected === opt.value ? "font-medium" : "ml-5"}>{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function WorkflowFilterDropdown({
  workflows,
  selected,
  onSelect,
  onClear,
}: {
  workflows: WorkflowItem[];
  selected: string;
  onSelect: (v: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const activeLabel = workflows.find((w) => w.workflowId === selected)?.name;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-2 text-[13px] transition-colors",
          selected
            ? "border-[#ff5723] bg-orange-50 text-[#ff5723]"
            : "border-neutral-200 bg-white text-[#4a4a4a] hover:bg-neutral-50",
        )}
      >
        <span className="max-w-[140px] truncate">{selected ? activeLabel : "Workflow"}</span>
        {selected ? (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onClear(); setOpen(false); }}
            className="ml-0.5 text-[#ff5723] hover:text-red-500"
          >
            <X className="h-3 w-3" />
          </button>
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-neutral-400" />
        )}
      </button>

      {open && workflows.length > 0 && (
        <div className="absolute left-0 top-full z-50 mt-1 max-h-60 min-w-[200px] overflow-y-auto rounded-lg border border-neutral-200 bg-white shadow-lg">
          {workflows.map((wf) => (
            <button
              key={wf.workflowId}
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-[13px] text-[#1f1f1f] hover:bg-neutral-50"
              onClick={() => { onSelect(wf.workflowId); setOpen(false); }}
            >
              {selected === wf.workflowId && <Check className="h-3.5 w-3.5 shrink-0 text-[#ff5723]" />}
              <span className={selected === wf.workflowId ? "font-medium" : "ml-5"}>{wf.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── resend button ──────────────────────────────────────────────────────────────

function ResendButton({ candidateId, mode, onDone }: { candidateId: string; mode: "live" | "test"; onDone: () => void }) {
  const [loading, setLoading] = useState(false);

  const handleResend = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const token = getAccessToken();
    if (!token) return;

    setLoading(true);
    try {
      await resendLog(candidateId, mode, token);
      toast.success("WhatsApp message resent successfully");
      onDone();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to resend message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="h-8 gap-1.5 text-[12px]"
      disabled={loading}
      onClick={handleResend}
    >
      <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
      {loading ? "Sending…" : "Resend"}
    </Button>
  );
}

// ── status filter options ──────────────────────────────────────────────────────

const WHATSAPP_STATUS_OPTIONS = [
  { label: "Link Delivered",      value: "link_delivered" },
  { label: "Sent – Awaiting Reply", value: "sent" },
  { label: "Failed",              value: "failed" },
  { label: "Queued",              value: "queued" },
];

// ── page ───────────────────────────────────────────────────────────────────────

export default function LogsPage() {
  const { activeOrg } = useOrg();
  const { isTestMode } = useTestMode();
  const mode = isTestMode ? "test" : "live";

  const [logs, setLogs]           = useState<LogItem[]>([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");

  const [workflows, setWorkflows]         = useState<WorkflowItem[]>([]);
  const [filterWorkflow, setFilterWorkflow] = useState("");
  const [filterStatus, setFilterStatus]   = useState("");

  const fetchKeyRef = useRef("");

  // Fetch workflows once for the dropdown
  useEffect(() => {
    if (!activeOrg?.orgId) return;
    const token = getAccessToken();
    if (!token) return;
    listWorkflows(activeOrg.orgId, 1, 100, mode, token)
      .then((res) => setWorkflows(res.data?.workflows ?? []))
      .catch(() => undefined);
  }, [activeOrg?.orgId, mode]);

  const loadLogs = useCallback(() => {
    if (!activeOrg?.orgId) return;
    const token = getAccessToken();
    if (!token) return;

    const filters: LogFilters = {};
    if (filterWorkflow) filters.workflowId     = filterWorkflow;
    if (filterStatus)   filters.whatsappStatus = filterStatus;

    const key = `${activeOrg.orgId}|${mode}|${page}|${filterWorkflow}|${filterStatus}`;
    fetchKeyRef.current = key;
    setLoading(true);

    listLogs(activeOrg.orgId, page, PAGE_LIMIT, mode, token, filters)
      .then((res) => {
        if (fetchKeyRef.current !== key) return;
        if (res.data) {
          setLogs(res.data.logs);
          setTotal(res.data.pagination.total);
          setTotalPages(res.data.pagination.totalPages);
        }
      })
      .catch((err: unknown) => {
        toast.error(err instanceof Error ? err.message : "Failed to load logs");
      })
      .finally(() => {
        if (fetchKeyRef.current === key) setLoading(false);
      });
  }, [activeOrg?.orgId, mode, page, filterWorkflow, filterStatus]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  useEffect(() => { setPage(1); }, [filterWorkflow, filterStatus]);

  const filtered = search.trim()
    ? logs.filter(
        (l) =>
          l.candidateName.toLowerCase().includes(search.toLowerCase()) ||
          l.phoneNumber.includes(search) ||
          l.workflowName.toLowerCase().includes(search.toLowerCase()),
      )
    : logs;

  const currentFrom  = total === 0 ? 0 : (page - 1) * PAGE_LIMIT + 1;
  const currentTo    = Math.min(page * PAGE_LIMIT, total);
  const hasFilter    = Boolean(filterWorkflow || filterStatus);

  return (
    <div className="space-y-5 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[16px] font-semibold text-[#1f1f1f]">WhatsApp Logs</h1>
          <p className="mt-0.5 text-[12px] text-[#8a8a8a]">
            Track delivery status of every WhatsApp message sent to candidates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <WorkflowFilterDropdown
            workflows={workflows}
            selected={filterWorkflow}
            onSelect={setFilterWorkflow}
            onClear={() => setFilterWorkflow("")}
          />
          <FilterDropdown
            label="WA Status"
            options={WHATSAPP_STATUS_OPTIONS}
            selected={filterStatus}
            onSelect={setFilterStatus}
            onClear={() => setFilterStatus("")}
          />
          {hasFilter && (
            <button
              type="button"
              className="text-[12px] text-[#9a9a9a] hover:text-[#4a4a4a]"
              onClick={() => { setFilterWorkflow(""); setFilterStatus(""); }}
            >
              Clear all
            </button>
          )}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              className="h-9 w-52 pl-9 text-[13px]"
              placeholder="Search candidate…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-md border border-neutral-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-white hover:bg-white">
              <TableHead className="h-12 px-5 text-[13px] font-medium text-[#7a7a7a]">
                Candidate
              </TableHead>
              <TableHead className="text-[13px] font-medium text-[#7a7a7a]">
                Phone
              </TableHead>
              <TableHead className="text-[13px] font-medium text-[#7a7a7a]">
                WA Delivery Status
              </TableHead>
              <TableHead className="text-[13px] font-medium text-[#7a7a7a]">
                Workflow
              </TableHead>
              <TableHead className="text-[13px] font-medium text-[#7a7a7a]">
                Language
              </TableHead>
              <TableHead className="text-[13px] font-medium text-[#7a7a7a]">
                Sent At
              </TableHead>
              <TableHead className="text-[13px] font-medium text-[#7a7a7a]">
                Link Delivered At
              </TableHead>
              <TableHead className="pr-5 text-right text-[13px] font-medium text-[#7a7a7a]">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((__, j) => (
                    <TableCell key={j} className={j === 0 ? "px-5 py-4" : ""}>
                      <div className="h-4 w-24 animate-pulse rounded bg-neutral-100" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-16 text-center text-[13px] text-[#9a9a9a]">
                  {search || hasFilter
                    ? "No logs match your filters."
                    : "No logs yet. Logs will appear here once you send WhatsApp messages."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((log) => (
                <TableRow key={log.candidateId} className="hover:bg-neutral-50">
                  {/* Candidate */}
                  <TableCell className="px-5 py-4">
                    <p className="text-[13px] font-semibold text-[#1f1f1f]">
                      {log.candidateName}
                    </p>
                    {log.role && (
                      <p className="mt-0.5 text-[12px] text-[#8a8a8a]">{log.role}</p>
                    )}
                  </TableCell>

                  {/* Phone */}
                  <TableCell className="text-[13px] text-[#4a4a4a]">
                    {log.phoneNumber}
                  </TableCell>

                  {/* WA Status */}
                  <TableCell>
                    <WhatsAppBadge
                      status={log.whatsappStatus}
                      error={log.deliveryError}
                    />
                  </TableCell>

                  {/* Workflow */}
                  <TableCell className="max-w-[160px]">
                    <p className="truncate text-[13px] text-[#4a4a4a]">
                      {log.workflowName}
                    </p>
                  </TableCell>

                  {/* Language */}
                  <TableCell>
                    <LanguageBadge language={log.language} />
                  </TableCell>

                  {/* Sent At */}
                  <TableCell className="text-[13px] text-[#4a4a4a]">
                    {formatDate(log.sentAt)}
                  </TableCell>

                  {/* Link Delivered At */}
                  <TableCell className="text-[13px] text-[#4a4a4a]">
                    {formatDate(log.linkSentAt)}
                  </TableCell>

                  {/* Resend */}
                  <TableCell className="pr-5 text-right">
                    <ResendButton candidateId={log.candidateId} mode={mode} onDone={loadLogs} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Footer / pagination */}
        <div className="flex items-center justify-between border-t border-neutral-200 px-5 py-4 text-[13px] text-[#7a7a7a]">
          <p>
            {loading
              ? "Loading…"
              : `Showing ${currentFrom}–${currentTo} of ${total} log${total === 1 ? "" : "s"}`}
          </p>

          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className={cn(
                  "rounded-md px-3 py-1.5 text-[13px] transition-colors",
                  page <= 1 || loading
                    ? "cursor-not-allowed text-neutral-300"
                    : "text-[#4a4a4a] hover:bg-neutral-100",
                )}
              >
                ‹ Previous
              </button>

              {(() => {
                const pages: (number | "…")[] = [];
                if (totalPages <= 5) {
                  for (let i = 1; i <= totalPages; i++) pages.push(i);
                } else {
                  pages.push(1);
                  if (page > 3) pages.push("…");
                  for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
                    pages.push(i);
                  }
                  if (page < totalPages - 2) pages.push("…");
                  pages.push(totalPages);
                }
                return pages.map((p, idx) =>
                  p === "…" ? (
                    <span key={`ellipsis-${idx}`} className="px-1 text-neutral-400">…</span>
                  ) : (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPage(p)}
                      className={cn(
                        "h-8 min-w-[32px] rounded-md px-2 text-[13px] transition-colors",
                        p === page
                          ? "bg-[#ff5723] font-semibold text-white"
                          : "text-[#4a4a4a] hover:bg-neutral-100",
                      )}
                    >
                      {p}
                    </button>
                  ),
                );
              })()}

              <button
                type="button"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className={cn(
                  "rounded-md px-3 py-1.5 text-[13px] transition-colors",
                  page >= totalPages || loading
                    ? "cursor-not-allowed text-neutral-300"
                    : "text-[#4a4a4a] hover:bg-neutral-100",
                )}
              >
                Next ›
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
