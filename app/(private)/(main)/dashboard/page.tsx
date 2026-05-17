"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, X } from "lucide-react";
import { toast } from "sonner";

import { getDashboardStats, type DashboardStats } from "@/api/dashboard.api";
import { listWorkflows, type WorkflowItem } from "@/api/workflow.api";
import { useOrg } from "@/components/layout/orgContext";
import { useProject } from "@/components/layout/projectContext";
import { useTestMode } from "@/components/layout/testModeContext";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAccessToken } from "@/lib/auth-client";

function formatCount(value: number) {
  return value.toLocaleString("en-IN");
}

function kpiValue(stats: DashboardStats | null, key: keyof DashboardStats) {
  return stats ? formatCount(stats[key]) : "0";
}

function StatSkeleton() {
  return (
    <div className="h-[76px] animate-pulse rounded-md border border-neutral-200 bg-white" />
  );
}

function SkeletonRow() {
  return (
    <TableRow>
      {Array.from({ length: 6 }).map((_, index) => (
        <TableCell key={index} className="px-5 py-5">
          <div className="h-3.5 w-24 animate-pulse rounded bg-neutral-100" />
        </TableCell>
      ))}
    </TableRow>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { activeOrg } = useOrg();
  const { activeProject } = useProject();
  const { isTestMode } = useTestMode();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingTable, setLoadingTable] = useState(true);
  const fetchKeyRef = useRef("");

  useEffect(() => {
    if (!activeOrg?.orgId) return;
    const token = getAccessToken();
    if (!token) return;

    const mode = isTestMode ? "test" : "live";
    const projectId = activeProject?.projectId ?? "";
    const fetchKey = `${activeOrg.orgId}|${mode}|${projectId}`;
    fetchKeyRef.current = fetchKey;

    setLoadingStats(true);
    getDashboardStats(activeOrg.orgId, mode, token, projectId || undefined)
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
  }, [activeOrg?.orgId, activeProject?.projectId, isTestMode]);

  const kpis = [
    { label: "Journeys initiated", value: kpiValue(stats, "journeysInitiated"), trend: "↗ +10%", tone: "up" },
    { label: "Completed", value: kpiValue(stats, "completed"), trend: "↗ +10%", tone: "up" },
    { label: "Not attempted", value: kpiValue(stats, "notAttempted"), trend: "↗ +10%", tone: "up" },
    { label: "Still in progress", value: kpiValue(stats, "stillInProgress"), trend: "↙ -10%", tone: "down" },
    { label: "Expired", value: kpiValue(stats, "expired"), trend: "↙ -1%", tone: "down" },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-semibold text-[#1f1f1f]">Overview</h1>
        <Button variant="outline" className="h-9 gap-2 rounded-lg px-4 text-[12px] text-[#7a7a7a]">
          Last 30 days
          <ChevronDown className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="flex items-start justify-between rounded-[18px] bg-[#fff8f1] px-6 py-5">
        <p className="max-w-[900px] text-[14px] leading-6 text-[#7a7a7a]">
          These KPIs reflect workflow activity for the selected date range. Use the date picker
          to adjust the window. Click any status card to drill down into workflows matching that status.
        </p>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-[#9a9a9a]">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {loadingStats
          ? Array.from({ length: 5 }).map((_, index) => <StatSkeleton key={index} />)
          : kpis.map((kpi) => (
              <button
                key={kpi.label}
                type="button"
                className="rounded-md border border-neutral-200 bg-white p-4 text-left transition-colors hover:bg-neutral-50"
              >
                <p className="text-[12px] font-medium text-[#7a7a7a]">{kpi.label}</p>
                <div className="mt-3 flex items-end justify-between gap-3">
                  <p className="text-[24px] font-semibold leading-none text-[#0f172a]">{kpi.value}</p>
                  <span
                    className={`text-[11px] font-semibold ${
                      kpi.tone === "up" ? "text-emerald-500" : "text-red-500"
                    }`}
                  >
                    {kpi.trend}
                  </span>
                </div>
              </button>
            ))}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-[#1f1f1f]">Workflow-wise Usage</h2>
          <Button
            variant="outline"
            className="h-8 rounded-md px-3 text-[12px]"
            onClick={() => router.push("/workflows")}
          >
            View all
          </Button>
        </div>

        <div className="overflow-hidden rounded-md border border-neutral-200 bg-white">
          <Table>
            <TableHeader>
              <TableRow className="bg-white hover:bg-white">
                <TableHead className="h-12 px-5 text-[13px] font-medium text-[#7a7a7a]">
                  Workflow Name
                </TableHead>
                <TableHead className="text-[13px] font-medium text-[#7a7a7a]">
                  Journeys initiated
                </TableHead>
                <TableHead className="text-[13px] font-medium text-[#7a7a7a]">
                  Completed
                </TableHead>
                <TableHead className="text-[13px] font-medium text-[#7a7a7a]">
                  In progress
                </TableHead>
                <TableHead className="text-[13px] font-medium text-[#7a7a7a]">
                  Not attempted
                </TableHead>
                <TableHead className="text-[13px] font-medium text-[#7a7a7a]">
                  Expired
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingTable ? (
                Array.from({ length: 5 }).map((_, index) => <SkeletonRow key={index} />)
              ) : workflows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-16 text-center text-[13px] text-[#9a9a9a]">
                    No workflow usage found.
                  </TableCell>
                </TableRow>
              ) : (
                workflows.map((workflow) => (
                  <TableRow key={workflow.workflowId}>
                    <TableCell className="px-5 py-5 text-[13px] font-semibold text-[#1f1f1f]">
                      {workflow.name}
                    </TableCell>
                    <TableCell className="text-[13px] text-[#1f1f1f]">
                      {workflow.totalRequests.toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell className="text-[13px] text-[#1f1f1f]">
                      {workflow.verifiedCount.toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell className="text-[13px] text-[#1f1f1f]">0</TableCell>
                    <TableCell className="text-[13px] text-[#1f1f1f]">0</TableCell>
                    <TableCell className="text-[13px] text-[#1f1f1f]">0</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between border-t border-neutral-200 px-5 py-4 text-[12px] text-[#7a7a7a]">
            <p>Showing {workflows.length} of {workflows.length} Workflows</p>
            <div className="flex items-center gap-4 text-[#1f1f1f]">
              <button className="text-[12px] text-[#6a6a6a]">‹ Previous</button>
              <span>1</span>
              <span className="rounded-md border border-neutral-200 px-3 py-2">2</span>
              <span>3</span>
              <span>...</span>
              <button className="text-[12px] text-[#1f1f1f]">Next ›</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
