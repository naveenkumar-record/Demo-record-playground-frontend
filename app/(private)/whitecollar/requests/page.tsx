"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, Code2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useOrg }      from "@/components/layout/orgContext";
import { useTestMode } from "@/components/layout/testModeContext";
import {
  listSmartAiAssessments,
  getSmartAiSessions,
  type SmartAiAssessmentItem,
  type SmartAiCandidateSession,
} from "@/api/assessment.api";

function getToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("auth_access_token") ?? "";
}

function fmt(d: string | null) {
  if (!d) return "—";
  try { return format(new Date(d), "dd MMM yyyy"); } catch { return "—"; }
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  const cls =
    s === "completed" || s === "submitted" || s === "timed_out"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : s === "in_progress"
      ? "bg-blue-50 text-blue-700 border-blue-200"
      : s === "draft"
      ? "bg-neutral-100 text-neutral-600 border-neutral-200"
      : "bg-amber-50 text-amber-700 border-amber-200";

  const label =
    s === "timed_out"   ? "Timed Out"  :
    s === "in_progress" ? "In Progress":
    status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <span className={cn("rounded-md border px-2 py-0.5 text-[11px] font-medium capitalize", cls)}>
      {label}
    </span>
  );
}

// ── Result badge ──────────────────────────────────────────────────────────────
function ResultBadge({ passed, score }: { passed: boolean | null; score: number | null }) {
  if (passed === null) return <span className="text-[13px] text-neutral-400">—</span>;
  return (
    <span className={cn(
      "rounded-md border px-2 py-0.5 text-[11px] font-medium",
      passed
        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
        : "bg-red-50 text-red-600 border-red-200",
    )}>
      {passed ? "Passed" : "Failed"}{score !== null ? ` · ${score}%` : ""}
    </span>
  );
}

// ── Type badge ────────────────────────────────────────────────────────────────
function TypeBadge({ type }: { type: string }) {
  return (
    <span className="rounded-md border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[11px] font-medium text-neutral-600 capitalize">
      {type}
    </span>
  );
}

// ── Skeleton rows ─────────────────────────────────────────────────────────────
function SkeletonRows({ cols }: { cols: number }) {
  return (
    <>
      {[1, 2, 3, 4].map((i) => (
        <tr key={i} className="border-b border-neutral-100">
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div className="h-4 animate-pulse rounded bg-neutral-200" style={{ width: `${60 + (j * 17) % 30}%` }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function WhitecollarRequestsPage() {
  const { activeOrg }  = useOrg();
  const { isTestMode } = useTestMode();
  const orgId = activeOrg?.orgId ?? "";
  const mode  = isTestMode ? "test" : "live" as "test" | "live";

  // ── Assessment list state ─────────────────────────────────────────────────
  const [assessments, setAssessments] = useState<SmartAiAssessmentItem[]>([]);
  const [loading,     setLoading]     = useState(true);

  // ── Selected assessment (drill-down) ─────────────────────────────────────
  const [selected,  setSelected]  = useState<SmartAiAssessmentItem | null>(null);
  const [sessions,  setSessions]  = useState<SmartAiCandidateSession[]>([]);
  const [sessLoading, setSessLoading] = useState(false);

  // ── Fetch list ─────────────────────────────────────────────────────────────
  const fetchAssessments = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const res = await listSmartAiAssessments(orgId, getToken(), mode);
      setAssessments(res.data?.assessments ?? []);
    } catch {
      toast.error("Failed to load Smart AI assessments");
    } finally {
      setLoading(false);
    }
  }, [orgId, mode]);

  useEffect(() => { fetchAssessments(); }, [fetchAssessments]);

  // ── Fetch sessions on drill-down ───────────────────────────────────────────
  const openAssessment = useCallback(async (item: SmartAiAssessmentItem) => {
    setSelected(item);
    setSessions([]);
    setSessLoading(true);
    try {
      const res = await getSmartAiSessions(item.assessmentId, orgId, getToken(), mode);
      setSessions(res.data?.sessions ?? []);
    } catch {
      toast.error("Failed to load candidate sessions");
    } finally {
      setSessLoading(false);
    }
  }, [orgId, mode]);

  const goBack = () => { setSelected(null); setSessions([]); };

  // ── Detail view ────────────────────────────────────────────────────────────
  if (selected) {
    return (
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={goBack}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50"
          >
            <ChevronLeft className="h-4 w-4 text-neutral-600" />
          </button>
          <div>
            <h1 className="text-[20px] font-semibold text-[#1f1f1f]">{selected.jobTitle || "Untitled"}</h1>
            <p className="text-[12px] text-[#8a8a8a]">
              {selected.assessmentId} · <TypeBadge type={selected.type} /> · Created {fmt(selected.createdAt)}
            </p>
          </div>
        </div>

        {/* Summary chips */}
        <div className="flex flex-wrap gap-2">
          <span className="flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1 text-[12px] text-[#3a3a3a]">
            <span className="h-1.5 w-1.5 rounded-full bg-neutral-400" />
            {selected.totalUsers} candidate{selected.totalUsers !== 1 ? "s" : ""}
          </span>
          <StatusBadge status={selected.status} />
        </div>

        {/* Candidates table */}
        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                {["Name", "Email", "Status", "Result", "Assigned", "Submitted"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#8a8a8a]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sessLoading ? (
                <SkeletonRows cols={6} />
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-[13px] text-neutral-400">
                    No candidate sessions found.
                  </td>
                </tr>
              ) : (
                sessions.map((s, i) => (
                  <tr key={i} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/60">
                    <td className="px-4 py-3 font-medium text-[#1f1f1f]">
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[11px] font-semibold text-neutral-600">
                          {(s.name ?? "?")[0]?.toUpperCase()}
                        </span>
                        {s.name}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#6a6a6a]">{s.email}</td>
                    <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                    <td className="px-4 py-3"><ResultBadge passed={s.passed} score={s.score} /></td>
                    <td className="px-4 py-3 text-[#6a6a6a]">{fmt(s.assignedAt)}</td>
                    <td className="px-4 py-3 text-[#6a6a6a]">{fmt(s.submittedAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ── List view ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100">
            <Code2 className="h-5 w-5 text-neutral-500" />
          </div>
          <div>
            <h1 className="text-[20px] font-semibold text-[#1f1f1f]">API Requests</h1>
            <p className="text-[12px] text-[#8a8a8a]">Smart AI assessments created via API key</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50">
              {["Assessment Name", "Type", "Status", "Candidates", "Created"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#8a8a8a]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows cols={5} />
            ) : assessments.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-16 text-center text-[13px] text-neutral-400">
                  No Smart AI assessments yet.
                </td>
              </tr>
            ) : (
              assessments.map((a) => (
                <tr
                  key={a.assessmentId}
                  onClick={() => openAssessment(a)}
                  className="cursor-pointer border-b border-neutral-100 last:border-0 hover:bg-neutral-50/70 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-[#1f1f1f]">{a.jobTitle || "Untitled"}</td>
                  <td className="px-4 py-3"><TypeBadge type={a.type} /></td>
                  <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                  <td className="px-4 py-3 text-[#6a6a6a]">{a.totalUsers}</td>
                  <td className="px-4 py-3 text-[#6a6a6a]">{fmt(a.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
