"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, ChevronLeft, ChevronRight, MoreVertical, Search, X } from "lucide-react";
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
import { useTestMode } from "@/components/layout/testModeContext";
import { getAccessToken } from "@/lib/auth-client";
import { toast } from "sonner";

const PAGE_LIMIT = 10;

// Status/trust options

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

// Helpers

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

// Dropdown component

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

// Badges

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
  if (!verdict) return <span className="text-[12px] text-[#9a9a9a]">-</span>;
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

// Page

export default function RequestsPage() {
  const router = useRouter();
  const { activeOrg } = useOrg();
  const { isTestMode } = useTestMode();
  const mode = isTestMode ? "test" : "live";
  const orgId = activeOrg?.orgId ?? "";

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
    if (!orgId) return;
    const token = getAccessToken();
    if (!token) return;

    listWorkflows(orgId, 1, 50, mode, token)
      .then((res) => setWorkflows(res.data?.workflows ?? []))
      .catch(() => undefined);
  }, [orgId, mode]);

  const loadRequests = useCallback(() => {
    if (!orgId) return;
    const token = getAccessToken();
    if (!token) return;

    const filters: RequestFilters = {};
    if (filterWorkflow) filters.workflowId = filterWorkflow;
    if (filterStatus)   filters.status     = filterStatus;

    const key = `${orgId}|${mode}|${page}|${filterWorkflow}|${filterStatus}|${filterTrust}`;
    fetchKeyRef.current = key;
    setLoading(true);

    listRequests(orgId, page, PAGE_LIMIT, mode, token, filters)
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
  }, [orgId, mode, page, filterWorkflow, filterStatus, filterTrust]);

  useEffect(() => {
    void Promise.resolve().then(loadRequests);
  }, [loadRequests]);

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
            onSelect={(value) => {
              setFilterWorkflow(value);
              setPage(1);
            }}
            onClear={() => {
              setFilterWorkflow("");
              setPage(1);
            }}
          />
          <FilterDropdown
            label="Status"
            options={STATUS_OPTIONS}
            selected={filterStatus}
            onSelect={(value) => {
              setFilterStatus(value);
              setPage(1);
            }}
            onClear={() => {
              setFilterStatus("");
              setPage(1);
            }}
          />
          <FilterDropdown
            label="Trust Score"
            options={TRUST_OPTIONS}
            selected={filterTrust}
            onSelect={(value) => {
              setFilterTrust(value);
              setPage(1);
            }}
            onClear={() => {
              setFilterTrust("");
              setPage(1);
            }}
          />
          {hasActiveFilter && (
            <button
              type="button"
              className="text-[12px] text-[#9a9a9a] hover:text-[#4a4a4a]"
              onClick={() => {
                setFilterWorkflow("");
                setFilterStatus("");
                setFilterTrust("");
                setPage(1);
              }}
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

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow className="border-b bg-white hover:bg-white">
              <TableHead className="h-14 px-6 text-[13px] font-medium text-[#6f7582]">
                Candidate Name
              </TableHead>
              <TableHead className="px-6 text-[13px] font-medium text-[#6f7582]">
                Phone Number
              </TableHead>
              <TableHead className="px-6 text-[13px] font-medium text-[#6f7582]">
                Status
              </TableHead>
              <TableHead className="px-6 text-[13px] font-medium text-[#6f7582]">
                Workflow Name
              </TableHead>
              <TableHead className="px-6 text-[13px] font-medium text-[#6f7582]">
                Requested On
              </TableHead>
              <TableHead className="px-6 text-[13px] font-medium text-[#6f7582]">
                Trust Score
              </TableHead>
              <TableHead className="px-6 text-[13px] font-medium text-[#6f7582]">
                Verdict
              </TableHead>
              {/* <TableHead className="px-6 text-right text-[13px] font-medium text-[#6f7582]">
                Action
              </TableHead> */}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((__, j) => (
                    <TableCell key={j} className={j === 0 ? "px-6 py-5" : "px-6"}>
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
                  className="h-[64px] cursor-pointer border-b hover:bg-neutral-50"
                  onClick={() => router.push(`/bluecollar/requests/${req.candidateId}`)}
                >
                  <TableCell className="px-6 py-4 text-[13px] font-semibold text-[#111827]">
                    {req.candidateName}
                  </TableCell>
                  <TableCell className="px-6 text-[13px] text-[#2f3b4c]">
                    {req.phoneNumber}
                  </TableCell>
                  <TableCell className="px-6">
                    <StatusBadge status={req.status} />
                  </TableCell>
                  <TableCell className="px-6 text-[13px] text-[#2f3b4c]">
                    {req.workflowName}
                  </TableCell>
                  <TableCell className="px-6 text-[13px] text-[#2f3b4c]">
                    {formatDate(req.requestedOn)}
                  </TableCell>
                  <TableCell className="px-6">
                    <TrustBadge score={req.trustBadge} />
                  </TableCell>
                  <TableCell className="px-6">
                    <VerdictBadge verdict={req.verdict} />
                  </TableCell>
                  {/* <TableCell className="px-6 text-right">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 cursor-pointer rounded-md border-neutral-200 bg-white shadow-sm hover:bg-neutral-50"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-4 w-4 text-[#1f1f1f]" />
                    </Button>
                  </TableCell> */}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between border-t border-neutral-200 bg-neutral-50 px-6 py-4 text-[13px] text-[#6f7582]">
          <p>
            {loading
              ? "Loading..."
              : `Showing ${currentFrom}-${currentTo} of ${total} Candidate${total === 1 ? "" : "s"}`}
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
                  "inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-[13px] transition-colors",
                  page <= 1 || loading
                    ? "cursor-not-allowed text-neutral-300"
                    : "cursor-pointer text-[#1f1f1f] hover:bg-white",
                )}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </button>

              {/* Page numbers with ellipsis */}
              {(() => {
                const pages: (number | "...")[] = [];
                if (totalPages <= 5) {
                  for (let i = 1; i <= totalPages; i++) pages.push(i);
                } else {
                  pages.push(1);
                  if (page > 3) pages.push("...");
                  for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
                    pages.push(i);
                  }
                  if (page < totalPages - 2) pages.push("...");
                  pages.push(totalPages);
                }
                return pages.map((p, idx) =>
                  p === "..." ? (
                    <span key={`ellipsis-${idx}`} className="px-1 text-neutral-400">...</span>
                  ) : (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPage(p)}
                      className={cn(
                        "h-8 min-w-[32px] rounded-md px-2 text-[13px] transition-colors",
                        p === page
                          ? "bg-[#ff5723] font-semibold text-white"
                          : "cursor-pointer text-[#1f1f1f] hover:bg-white",
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
                  "inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-[13px] transition-colors",
                  page >= totalPages || loading
                    ? "cursor-not-allowed text-neutral-300"
                    : "cursor-pointer text-[#1f1f1f] hover:bg-white",
                )}
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
