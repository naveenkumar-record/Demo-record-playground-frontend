"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Sparkles,
  Users,
  CheckSquare,
  TrendingUp,
  AlignLeft,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useOrg }      from "@/components/layout/orgContext";
import { useTestMode } from "@/components/layout/testModeContext";
import { useProject }  from "@/components/layout/projectContext";
import {
  getAssessmentOverview,
  type AssessmentOverview,
  type AssessmentModeStats,
} from "@/api/assessment.api";

function getToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("auth_access_token") ?? "";
}


function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-neutral-200 bg-white px-5 py-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500">
        {icon}
      </div>
      <div>
        <p className="text-[12px] text-[#8a8a8a]">{label}</p>
        <p className="mt-0.5 text-[22px] font-bold leading-none text-[#1f1f1f]">{value}</p>
      </div>
    </div>
  );
}

// ── Mode icon ─────────────────────────────────────────────────────────────────

function ModeIcon({ mode }: { mode: string }) {
  if (mode === "AI Powered") {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100">
        <Sparkles className="h-5 w-5 text-neutral-500" />
      </div>
    );
  }
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100">
      <AlignLeft className="h-5 w-5 text-neutral-500" />
    </div>
  );
}

// ── Progress bar ──────────────────────────────────────────────────────────────
function Bar({ pct, green = false }: { pct: number; green?: boolean }) {
  return (
    <div className="h-[6px] w-full overflow-hidden rounded-full bg-neutral-200">
      <div
        className={cn(
          "h-full rounded-full transition-all duration-700",
          green ? "bg-emerald-500" : "bg-[#1f1f1f]",
        )}
        style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
      />
    </div>
  );
}

// ── Mode card ─────────────────────────────────────────────────────────────────

function ModeCard({
  stat,
  maxAssigned,
}: {
  stat: AssessmentModeStats;
  maxAssigned: number;
}) {
  const barPct = maxAssigned > 0 ? (stat.completed / maxAssigned) * 100 : 0;

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-5">
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <ModeIcon mode={stat.mode} />
          <div>
            <p className="text-[15px] font-bold text-[#1f1f1f]">{stat.mode}</p>
            <p className="text-[12px] text-[#8a8a8a]">{stat.subtitle}</p>
          </div>
        </div>
        <span className="text-[13px] font-semibold text-emerald-500">
          {stat.passRate}% pass
        </span>
      </div>

      <div className="mb-4 grid grid-cols-4 gap-3">
        {[
          { label: "Created",   value: fmt(stat.created) },
          { label: "Assigned",  value: fmt(stat.assigned) },
          { label: "Completed", value: fmt(stat.completed) },
          { label: "Avg Score", value: stat.avgScore > 0 ? `${stat.avgScore}%` : "—" },
        ].map(({ label, value }) => (
          <div key={label}>
            <p className="text-[11px] text-[#8a8a8a]">{label}</p>
            <p className="mt-0.5 text-[17px] font-bold text-[#1f1f1f]">{value}</p>
          </div>
        ))}
      </div>

      <Bar pct={barPct} />
    </div>
  );
}

// ── Funnel row ────────────────────────────────────────────────────────────────

function FunnelRow({
  label,
  count,
  pct,
  barPct,
  isFirst,
}: {
  label:   string;
  count:   number;
  pct:     number;
  barPct:  number;
  isFirst: boolean;
}) {
  const pctColor =
    pct >= 70 ? "text-emerald-500" :
    pct >= 40 ? "text-amber-500"   :
                "text-[#1f1f1f]";

  return (
    <div className={cn("py-4", !isFirst && "border-t border-neutral-100")}>
      <div className="mb-2 flex items-center justify-between">
        <div>
          <p className="text-[12px] capitalize text-[#8a8a8a]">{label}</p>
          <p className="mt-0.5 text-[17px] font-bold text-[#1f1f1f]">
            {fmt(count)} records
          </p>
        </div>
        <span className={cn("text-[15px] font-bold", pctColor)}>{pct}%</span>
      </div>
      <Bar pct={barPct} green={isFirst} />
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Pulse({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-neutral-200", className)} />;
}

function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <Pulse key={i} className="h-[72px]" />)}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_420px]">
        <Pulse className="h-[540px]" />
        <Pulse className="h-[540px]" />
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-white py-24 text-center">
      <TrendingUp className="mb-3 h-10 w-10 text-neutral-300" />
      <p className="text-[14px] font-semibold text-[#3a3a3a]">No data yet</p>
      <p className="mt-1 text-[13px] text-[#9a9a9a]">
        Create and assign assessments to see overview stats here.
      </p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function WhitecollarDashboardPage() {
  const { activeOrg }     = useOrg();
  const { isTestMode }    = useTestMode();
  const { activeProject } = useProject();
  const orgId     = activeOrg?.orgId ?? "";
  const mode      = isTestMode ? "test" : "live" as "test" | "live";
  // activeProject === null means "Default" (projectId = "")
  const projectId = activeProject?.projectId ?? "";

  const [overview, setOverview] = useState<AssessmentOverview | null>(null);
  const [loading,  setLoading]  = useState(true);

  const fetchOverview = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const res = await getAssessmentOverview(orgId, getToken(), mode, projectId);
      if (res.data?.overview) setOverview(res.data.overview);
    } catch {
      toast.error("Failed to load overview");
    } finally {
      setLoading(false);
    }
  }, [orgId, mode, projectId]);

  useEffect(() => { fetchOverview(); }, [fetchOverview]);

  // ── Funnel row data ────────────────────────────────────────────────────────

  const f = overview?.funnel;
  const funnelRows = f
    ? [
        {
          label: "Created",
          count: f.created,
          pct:   100,
          barPct: 100,
        },
        {
          label: "Assigned",
          count: f.assigned,
          pct:   f.created  > 0 ? Math.round((f.assigned  / f.created)  * 100) : 0,
          barPct: f.created > 0 ? (f.assigned  / f.created)  * 100 : 0,
        },
        {
          label: "Started",
          count: f.started,
          pct:   f.assigned > 0 ? Math.round((f.started   / f.assigned) * 100) : 0,
          barPct: f.assigned > 0 ? (f.started   / f.assigned) * 100 : 0,
        },
        {
          label: "Completed",
          count: f.completed,
          pct:   f.assigned > 0 ? Math.round((f.completed / f.assigned) * 100) : 0,
          barPct: f.assigned > 0 ? (f.completed / f.assigned) * 100 : 0,
        },
        {
          label: "Passed",
          count: f.passed,
          pct:   f.assigned > 0 ? Math.round((f.passed    / f.assigned) * 100) : 0,
          barPct: f.assigned > 0 ? (f.passed    / f.assigned) * 100 : 0,
        },
      ]
    : [];

  const maxModeAssigned = overview
    ? Math.max(...overview.modeStats.map((m) => m.assigned), 1)
    : 1;

  const isEmpty = !loading && overview?.stats.totalAssessments === 0;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-semibold text-[#1f1f1f]">Overview</h1>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-[13px] font-medium text-[#3a3a3a] hover:bg-neutral-50"
        >
          Last 30 days
          <ChevronDown className="h-4 w-4 text-neutral-400" />
        </button>
      </div>

      {loading ? (
        <PageSkeleton />
      ) : isEmpty ? (
        <EmptyState />
      ) : overview ? (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              icon={<Sparkles className="h-5 w-5" />}
              label="Total Assessment"
              value={fmt(overview.stats.totalAssessments)}
            />
            <StatCard
              icon={<Users className="h-5 w-5" />}
              label="Assigned Candidates"
              value={fmt(overview.stats.assignedCandidates)}
            />
            <StatCard
              icon={<CheckSquare className="h-5 w-5" />}
              label="Completed Attempts"
              value={fmt(overview.stats.completedAttempts)}
            />
            <StatCard
              icon={<TrendingUp className="h-5 w-5" />}
              label="Average Pass Rate"
              value={`${overview.stats.averagePassRate}%`}
            />
          </div>

          {/* Two-column content */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_420px]">
            <div className="rounded-lg border border-neutral-200 p-6">
              <h2 className="text-[16px] font-bold text-[#1f1f1f]">
                Assessment mode preference
              </h2>
              <p className="mb-5 mt-0.5 text-[13px] text-[#8a8a8a]">
                Compare usage and outcome across the three product sections.
              </p>
              <div className="space-y-4">
                {overview.modeStats.map((stat) => (
                  <ModeCard
                    key={stat.mode}
                    stat={stat}
                    maxAssigned={maxModeAssigned}
                  />
                ))}
              </div>
            </div>

            {/* Overall assessment funnel */}
            <div className="rounded-lg border border-neutral-200 bg-white p-6">
              <h2 className="text-[16px] font-bold text-[#1f1f1f]">
                Overall assessment funnel
              </h2>
              <p className="mb-1 mt-0.5 text-[13px] text-[#8a8a8a]">
                From creation to passed candidates.
              </p>
              <div>
                {funnelRows.map((row, i) => (
                  <FunnelRow
                    key={row.label}
                    label={row.label}
                    count={row.count}
                    pct={row.pct}
                    barPct={row.barPct}
                    isFirst={i === 0}
                  />
                ))}
              </div>
            </div>
          </div>

        </>
      ) : null}
    </div>
  );
}
