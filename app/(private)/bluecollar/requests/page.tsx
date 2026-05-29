"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, MoreVertical, Search, X } from "lucide-react";
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
import { listRequests, type RequestListItem, type RequestFilters } from "@/api/bluecollar.api";
import { listWorkflows, type WorkflowItem } from "@/api/workflow.api";
import { useOrg } from "@/components/layout/orgContext";
import { getAccessToken } from "@/lib/auth-client";
import { toast } from "sonner";

const PAGE_LIMIT = 10;

// ── status/trust options ───────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { label: "Completed", value: "completed" },
  { label: "Sent", value: "requested" },
  { label: "Expired", value: "expired" },
];

const TRUST_OPTIONS = [
  { label: "High Trust", value: "High" },
  { label: "Low Trust", value: "Low" },
  { label: "Pending", value: "" },
];

// ── helpers ────────────────────────────────────────────────────────────────────

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

// ── dropdown component ─────────────────────────────────────────────────────────

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
  onSelect: (value: string) => void;
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

  const active = Boolean(selected);
  const activeLabel = options.find((o) => o.value === selected)?.label;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-2 text-[13px] transition-colors",
          active
            ? "border-[#ff5723] bg-orange-50 text-[#ff5723]"
            : "border-neutral-200 bg-white text-[#4a4a4a] hover:bg-neutral-50",
        )}
      >
        {active ? activeLabel : label}
        {active ? (
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
        <div className="absolute left-0 top-full z-50 mt-1 min-w-[160px] overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-[13px] text-[#1f1f1f] hover:bg-neutral-50"
              onClick={() => { onSelect(opt.value); setOpen(false); }}
            >
              {selected === opt.value && <Check className="h-3.5 w-3.5 shrink-0 text-[#ff5723]" />}
              <span className={selected === opt.value ? "ml-0 font-medium" : "ml-5"}>
                {opt.label}
              </span>
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
  onSelect: (value: string) => void;
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

  const active = Boolean(selected);
  const activeLabel = workflows.find((w) => w.workflowId === selected)?.name;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-2 text-[13px] transition-colors",
          active
            ? "border-[#ff5723] bg-orange-50 text-[#ff5723]"
            : "border-neutral-200 bg-white text-[#4a4a4a] hover:bg-neutral-50",
        )}
      >
        <span className="max-w-[140px] truncate">
          {active ? activeLabel : "Choose Workflow"}
        </span>
        {active ? (
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
              {selected === wf.workflowId && (
                <Check className="h-3.5 w-3.5 shrink-0 text-[#ff5723]" />
              )}
              <span className={selected === wf.workflowId ? "font-medium" : "ml-5"}>
                {wf.name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── badges ─────────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: RequestListItem["status"] }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-medium",
        status === "Completed" && "bg-green-100 text-green-600",
        status === "Sent" && "bg-amber-50 text-amber-500",
        status === "Expired" && "bg-red-50 text-red-500",
      )}
    >
      {status}
    </span>
  );
}

function TrustBadge({ score }: { score: RequestListItem["trustBadge"] }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-medium",
        score === "High Trust" && "bg-green-100 text-green-600",
        score === "Low Trust" && "bg-amber-100 text-amber-600",
        score === "Pending" && "bg-neutral-100 text-neutral-500",
      )}
    >
      {score}
    </span>
  );
}

function VerdictBadge({ verdict }: { verdict: RequestListItem["verdict"] }) {
  if (!verdict) return <span className="text-[12px] text-[#9a9a9a]">—</span>;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[12px] font-medium",
        verdict === "Place" && "border-green-200 text-green-600",
        verdict === "Review" && "border-amber-200 text-amber-600",
        verdict === "Do Not Place" && "border-red-200 text-red-500",
      )}
    >
      {verdict}
    </span>
  );
}

// ── page ───────────────────────────────────────────────────────────────────────

export default function RequestsPage() {
  const router = useRouter();
  const { activeOrg } = useOrg();

  const [requests, setRequests] = useState<RequestListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Filter state
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [filterWorkflow, setFilterWorkflow] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterTrust, setFilterTrust] = useState("");

  const fetchKeyRef = useRef("");

  // Fetch workflows once for the dropdown
  useEffect(() => {
    if (!activeOrg?.orgId) return;
    const token = getAccessToken();
    if (!token) return;

    listWorkflows(activeOrg.orgId, 1, 50, "live", token)
      .then((res) => setWorkflows(res.data?.workflows ?? []))
      .catch(() => undefined);
  }, [activeOrg?.orgId]);

  const loadRequests = useCallback(() => {
    if (!activeOrg?.orgId) return;
    const token = getAccessToken();
    if (!token) return;

    const filters: RequestFilters = {};
    if (filterWorkflow) filters.workflowId = filterWorkflow;
    if (filterStatus)   filters.status     = filterStatus;

    const key = `${activeOrg.orgId}|${page}|${filterWorkflow}|${filterStatus}|${filterTrust}`;
    fetchKeyRef.current = key;
    setLoading(true);

    listRequests(activeOrg.orgId, page, PAGE_LIMIT, token, filters)
      .then((res) => {
        if (fetchKeyRef.current !== key) return;
        if (res.data) {
          let items = res.data.requests;
          // Client-side trust level filter (derived from result data, not stored on candidate)
          if (filterTrust) {
            items = items.filter((r) => r.trustLevel === filterTrust);
          }
          setRequests(items);
          setTotal(res.data.pagination.total);
          setTotalPages(res.data.pagination.totalPages);
        }
      })
      .catch((err: unknown) => {
        toast.error(err instanceof Error ? err.message : "Failed to load requests");
      })
      .finally(() => {
        if (fetchKeyRef.current === key) setLoading(false);
      });
  }, [activeOrg?.orgId, page, filterWorkflow, filterStatus, filterTrust]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setPage(1);
  }, [filterWorkflow, filterStatus, filterTrust]);

  const filtered = search.trim()
    ? requests.filter((r) =>
        r.candidateName.toLowerCase().includes(search.toLowerCase()) ||
        r.phoneNumber.includes(search),
      )
    : requests;

  const currentFrom = total === 0 ? 0 : (page - 1) * PAGE_LIMIT + 1;
  const currentTo = Math.min(page * PAGE_LIMIT, total);
  const hasActiveFilter = Boolean(filterWorkflow || filterStatus || filterTrust);

  return (
    <div className="space-y-5 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[16px] font-semibold text-[#1f1f1f]">Your Requests</h1>
        <div className="flex items-center gap-2">
          <WorkflowFilterDropdown
            workflows={workflows}
            selected={filterWorkflow}
            onSelect={setFilterWorkflow}
            onClear={() => setFilterWorkflow("")}
          />
          <FilterDropdown
            label="Status"
            options={STATUS_OPTIONS}
            selected={filterStatus}
            onSelect={setFilterStatus}
            onClear={() => setFilterStatus("")}
          />
          <FilterDropdown
            label="Trust Score"
            options={TRUST_OPTIONS}
            selected={filterTrust}
            onSelect={setFilterTrust}
            onClear={() => setFilterTrust("")}
          />
          {hasActiveFilter && (
            <button
              type="button"
              className="text-[12px] text-[#9a9a9a] hover:text-[#4a4a4a]"
              onClick={() => { setFilterWorkflow(""); setFilterStatus(""); setFilterTrust(""); }}
            >
              Clear all
            </button>
          )}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              className="h-9 w-52 pl-9 text-[13px]"
              placeholder="Search Candidate."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-md border border-neutral-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-white hover:bg-white">
              <TableHead className="h-12 px-5 text-[13px] font-medium text-[#7a7a7a]">
                Candidate Name
              </TableHead>
              <TableHead className="text-[13px] font-medium text-[#7a7a7a]">
                Phone Number
              </TableHead>
              <TableHead className="text-[13px] font-medium text-[#7a7a7a]">
                Status
              </TableHead>
              <TableHead className="text-[13px] font-medium text-[#7a7a7a]">
                Workflow Name
              </TableHead>
              <TableHead className="text-[13px] font-medium text-[#7a7a7a]">
                Requested On
              </TableHead>
              <TableHead className="text-[13px] font-medium text-[#7a7a7a]">
                Trust Score
              </TableHead>
              <TableHead className="text-[13px] font-medium text-[#7a7a7a]">
                Verdict
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
                  {search || hasActiveFilter
                    ? "No candidates match your filters."
                    : "No requests yet."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((req) => (
                <TableRow
                  key={req.candidateId}
                  className="cursor-pointer hover:bg-neutral-50"
                  onClick={() => router.push(`/bluecollar/requests/${req.candidateId}`)}
                >
                  <TableCell className="px-5 py-4 text-[13px] font-semibold text-[#1f1f1f]">
                    {req.candidateName}
                  </TableCell>
                  <TableCell className="text-[13px] text-[#4a4a4a]">
                    {req.phoneNumber}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={req.status} />
                  </TableCell>
                  <TableCell className="text-[13px] text-[#4a4a4a]">
                    {req.workflowName}
                  </TableCell>
                  <TableCell className="text-[13px] text-[#4a4a4a]">
                    {formatDate(req.requestedOn)}
                  </TableCell>
                  <TableCell>
                    <TrustBadge score={req.trustBadge} />
                  </TableCell>
                  <TableCell>
                    <VerdictBadge verdict={req.verdict} />
                  </TableCell>
                  <TableCell className="pr-5 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-4 w-4 text-[#697282]" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between border-t border-neutral-200 px-5 py-4 text-[13px] text-[#7a7a7a]">
          <p>
            {loading
              ? "Loading..."
              : `Showing ${currentFrom}–${currentTo} of ${total} Candidate${total === 1 ? "" : "s"}`}
          </p>

          {/* Numbered pagination */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              {/* Previous */}
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

              {/* Page numbers with ellipsis */}
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

              {/* Next */}
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
