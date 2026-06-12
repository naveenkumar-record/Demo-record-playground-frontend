"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, X } from "lucide-react";
import { toast } from "sonner";

import { getDashboardStats, type DashboardStats, type StatTrend } from "@/api/dashboard.api";
import { listWorkflows, type WorkflowItem } from "@/api/workflow.api";
import { useOrg } from "@/components/layout/orgContext";
import { useProject } from "@/components/layout/projectContext";
import { useTestMode } from "@/components/layout/testModeContext";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { getAccessToken } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const DATE_OPTIONS = [
  { label: "Last 7 days",  value: 7  },
  { label: "Last 15 days", value: 15 },
  { label: "Last 30 days", value: 30 },
];

function formatCount(value: number) {
  return value.toLocaleString("en-IN");
}

function kpiValue(stats: DashboardStats | null, key: keyof Omit<DashboardStats, "trends">) {
  return stats ? formatCount(stats[key] as number) : "0";
}

function kpiTrend(stats: DashboardStats | null, key: keyof DashboardStats["trends"]): StatTrend {
  return stats?.trends?.[key] ?? { value: 0, direction: "flat", label: "0%" };
}

function StatSkeleton() {
  return <div className="h-[76px] animate-pulse rounded-md border border-neutral-200 bg-white" />;
}

function SkeletonRow() {
  return (
    <TableRow>
      {Array.from({ length: 6 }).map((_, i) => (
        <TableCell key={i} className="px-5 py-5">
          <div className="h-3.5 w-24 animate-pulse rounded bg-neutral-100" />
        </TableCell>
      ))}
    </TableRow>
  );
}

// ── Date range dropdown ────────────────────────────────────────────────────────

function DateRangeDropdown({
  days,
  onChange,
}: {
  days: number;
  onChange: (d: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const label = DATE_OPTIONS.find((o) => o.value === days)?.label ?? "Last 30 days";

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div ref={ref} className="relative">
      <Button
        variant="outline"
        className="h-9 gap-2 rounded-lg px-4 text-[12px] text-[#7a7a7a]"
        onClick={() => setOpen((v) => !v)}
      >
        {label}
        <ChevronDown className="h-3.5 w-3.5" />
      </Button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg">
          {DATE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={cn(
                "block w-full px-4 py-2.5 text-left text-[13px] hover:bg-neutral-50",
                opt.value === days ? "font-semibold text-[#ff5723]" : "text-[#1f1f1f]",
              )}
              onClick={() => { onChange(opt.value); setOpen(false); }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const { activeOrg }     = useOrg();
  const { activeProject } = useProject();
  const { isTestMode }    = useTestMode();

  const [stats,        setStats]        = useState<DashboardStats | null>(null);
  const [workflows,    setWorkflows]    = useState<WorkflowItem[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingTable, setLoadingTable] = useState(true);
  const [days,         setDays]         = useState(30);
  const [bannerOpen,   setBannerOpen]   = useState(true);
  const fetchKeyRef = useRef("");

  useEffect(() => {
    if (!activeOrg?.orgId) return;
    const token = getAccessToken();
    if (!token) return;

    const mode      = isTestMode ? "test" : "live";
    const projectId = activeProject?.projectId ?? "";
    const fetchKey  = `${activeOrg.orgId}|${mode}|${projectId}|${days}`;
    fetchKeyRef.current = fetchKey;

    setLoadingStats(true);
    getDashboardStats(activeOrg.orgId, mode, token, projectId || undefined, days)
      .then((res) => {
        if (fetchKeyRef.current !== fetchKey) return;
        if (res.data) setStats(res.data);
      })
      .catch((err: unknown) => {
        toast.error(err instanceof Error ? err.message : "Failed to load dashboard");
      })
      .finally(() => {
        if (fetchKeyRef.current === fetchKey) setLoadingStats(false);
      });

    setLoadingTable(true);
    listWorkflows(activeOrg.orgId, 1, 5, mode, token, projectId || undefined)
      .then((res) => {
        if (fetchKeyRef.current !== fetchKey) return;
        setWorkflows(res.data?.workflows ?? []);
      })
      .catch((err: unknown) => {
        toast.error(err instanceof Error ? err.message : "Failed to load workflows");
      })
      .finally(() => {
        if (fetchKeyRef.current === fetchKey) setLoadingTable(false);
      });
  }, [activeOrg?.orgId, activeProject?.projectId, isTestMode, days]);

  const kpis = [
    { label: "Journeys initiated", value: kpiValue(stats, "journeysInitiated"), trend: kpiTrend(stats, "journeysInitiated") },
    { label: "Completed",          value: kpiValue(stats, "completed"),          trend: kpiTrend(stats, "completed") },
    { label: "Not attempted",      value: kpiValue(stats, "notAttempted"),       trend: kpiTrend(stats, "notAttempted") },
    { label: "Still in progress",  value: kpiValue(stats, "stillInProgress"),    trend: kpiTrend(stats, "stillInProgress") },
    { label: "Expired",            value: kpiValue(stats, "expired"),            trend: kpiTrend(stats, "expired") },
  ];

  return (
    <div className="space-y-6 p-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-semibold text-[#1f1f1f]">Overview</h1>
        <DateRangeDropdown days={days} onChange={setDays} />
      </div>

      {/* Banner */}
      {bannerOpen && (
        <div className="flex items-start justify-between rounded-[18px] bg-[#fff8f1] px-6 py-5">
          <p className="max-w-[900px] text-[14px] leading-6 text-[#7a7a7a]">
            These KPIs reflect workflow activity for the selected date range. Use the date picker
            to adjust the window. Click any status card to drill down into workflows matching that status.
          </p>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-[#9a9a9a]"
            onClick={() => setBannerOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {loadingStats
          ? Array.from({ length: 5 }).map((_, i) => <StatSkeleton key={i} />)
          : kpis.map((kpi) => (
              <div
                key={kpi.label}
                className="rounded-md border border-neutral-200 bg-white p-4"
              >
                <p className="text-[12px] font-medium text-[#7a7a7a]">{kpi.label}</p>
                <div className="mt-3 flex items-end justify-between gap-3">
                  <p className="text-[24px] font-semibold leading-none text-[#0f172a]">{kpi.value}</p>
                  {kpi.trend.direction !== "flat" && (
                    <span className={`text-[11px] font-semibold ${kpi.trend.direction === "up" ? "text-emerald-500" : "text-red-500"}`}>
                      {kpi.trend.direction === "up" ? "↗" : "↙"} {kpi.trend.label}
                    </span>
                  )}
                </div>
              </div>
            ))}
      </div>

      {/* Workflow-wise Usage */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-[#1f1f1f]">Workflow-wise Usage</h2>
        </div>

        <div className="overflow-hidden rounded-md border border-neutral-200 bg-white">
          <Table>
            <TableHeader>
              <TableRow className="bg-white hover:bg-white">
                <TableHead className="h-12 px-5 text-[13px] font-medium text-[#7a7a7a]">Workflow Name</TableHead>
                <TableHead className="text-[13px] font-medium text-[#7a7a7a]">Journeys initiated</TableHead>
                <TableHead className="text-[13px] font-medium text-[#7a7a7a]">Completed</TableHead>
                <TableHead className="text-[13px] font-medium text-[#7a7a7a]">In progress</TableHead>
                <TableHead className="text-[13px] font-medium text-[#7a7a7a]">Not attempted</TableHead>
                <TableHead className="text-[13px] font-medium text-[#7a7a7a]">Expired</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingTable ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : workflows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-16 text-center text-[13px] text-[#9a9a9a]">
                    No workflow usage found.
                  </TableCell>
                </TableRow>
              ) : (
                workflows.map((wf) => (
                  <TableRow
                    key={wf.workflowId}
                    className="cursor-pointer hover:bg-neutral-50"
                    onClick={() => router.push(`/bluecollar/requests?workflowId=${wf.workflowId}`)}
                  >
                    <TableCell className="px-5 py-5 text-[13px] font-semibold text-[#1f1f1f]">
                      {wf.name}
                    </TableCell>
                    <TableCell className="text-[13px] text-[#1f1f1f]">
                      {wf.totalRequests.toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell className="text-[13px] text-[#1f1f1f]">
                      {wf.verifiedCount.toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell className="text-[13px] text-[#1f1f1f]">
                      {(wf.inProgress ?? 0).toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell className="text-[13px] text-[#1f1f1f]">
                      {(wf.notAttempted ?? 0).toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell className="text-[13px] text-[#1f1f1f]">
                      {(wf.expired ?? 0).toLocaleString("en-IN")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Footer — no fake pagination */}
          {workflows.length > 0 && (
            <div className="flex items-center justify-between border-t border-neutral-200 px-5 py-4 text-[12px] text-[#7a7a7a]">
              <p>Showing {workflows.length} Workflow{workflows.length !== 1 ? "s" : ""}</p>
              <button
                type="button"
                className="text-[12px] text-[#ff5723] hover:underline"
                onClick={() => router.push("/bluecollar/workflows")}
              >
                View all →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
