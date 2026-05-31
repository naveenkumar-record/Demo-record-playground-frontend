"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ExternalLink, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAssignmentDetail, type AssignmentItem, type CandidateRecord } from "@/api/assessmentAssignment.api";
import { listAssessments } from "@/api/assessment.api";
import { useOrg } from "@/components/layout/orgContext";

const ASSESSMENT_PORTAL_URL = process.env.NEXT_PUBLIC_ASSESSMENT_PORTAL_URL ?? "";

function getAccessToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("auth_access_token") ?? "";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  }).format(new Date(value));
}

// ── Result badge (Pass / Fail / Not Yet) ──────────────────────────────────────

function ResultBadge({ passed }: { passed?: boolean }) {
  if (passed === true) {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600">
        Pass
      </span>
    );
  }
  if (passed === false) {
    return (
      <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-semibold text-red-500">
        Fail
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-medium text-neutral-500">
      Not Yet
    </span>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<CandidateRecord["status"], string> = {
  pending:   "bg-neutral-100 text-neutral-500",
  started:   "bg-amber-50 text-amber-600",
  completed: "bg-emerald-50 text-emerald-600",
  expired:   "bg-red-50 text-red-500",
};

function StatusBadge({ status }: { status: CandidateRecord["status"] }) {
  return (
    <span className={cn(
      "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize",
      STATUS_STYLE[status],
    )}>
      {status}
    </span>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AssignmentDetailPage() {
  const params       = useParams();
  const assignmentId = params.assignmentId as string;
  const { activeOrg } = useOrg();

  const [assignment,      setAssignment]      = useState<AssignmentItem | null>(null);
  const [assessmentName,  setAssessmentName]  = useState("");
  const [loading,         setLoading]         = useState(true);

  useEffect(() => {
    if (!activeOrg?.orgId) return;

    const token = getAccessToken();

    Promise.all([
      getAssignmentDetail(assignmentId, activeOrg.orgId, token),
      listAssessments(activeOrg.orgId, 1, 100, "test", token),
    ]).then(([assignRes, assessRes]) => {
      const found = assignRes.data?.assignment ?? null;
      setAssignment(found);

      if (found) {
        const name = assessRes.data?.assessments.find(
          (a) => a.assessmentId === found.assessmentId,
        )?.name ?? found.assessmentId;
        setAssessmentName(name);
      }
    }).catch(() => {
      setAssignment(null);
    }).finally(() => {
      setLoading(false);
    });
  }, [activeOrg?.orgId, assignmentId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f9f9f9]">
        <p className="text-[13px] text-[#9a9a9a]">Loading...</p>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f9f9f9]">
        <p className="text-[13px] text-[#9a9a9a]">Assignment not found.</p>
      </div>
    );
  }

  const { candidates, assessmentId, batchName, totalCandidates, tag } = assignment;

  const completed = candidates.filter((c) => c.status === "completed").length;

  return (
    <div className="min-h-screen bg-[#f9f9f9] p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[20px] font-semibold text-[#1f1f1f]">{batchName}</h1>
        <p className="mt-0.5 text-[13px] text-[#8a8a8a]">
          {assessmentName} {tag ? `· ${tag}` : ""}
        </p>

        {/* Stats row */}
        <div className="mt-4 flex gap-6">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-neutral-400" />
            <span className="text-[13px] text-[#4a4a4a]">
              <strong>{totalCandidates}</strong> candidates
            </span>
          </div>
          <div className="text-[13px] text-[#4a4a4a]">
            <strong className="text-emerald-600">{completed}</strong> completed
          </div>
          <div className="text-[13px] text-[#4a4a4a]">
            <strong>{totalCandidates - completed}</strong> pending / in progress
          </div>
        </div>
      </div>

      {/* Candidate table */}
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50">
              <th className="px-6 py-3 text-left text-[12px] font-medium text-[#7a7a7a]">Name</th>
              <th className="px-6 py-3 text-left text-[12px] font-medium text-[#7a7a7a]">Email</th>
              <th className="px-6 py-3 text-left text-[12px] font-medium text-[#7a7a7a]">Status</th>
              <th className="px-6 py-3 text-left text-[12px] font-medium text-[#7a7a7a]">Result</th>
              <th className="px-6 py-3 text-left text-[12px] font-medium text-[#7a7a7a]">Assigned</th>
              <th className="px-6 py-3 text-right text-[12px] font-medium text-[#7a7a7a]">Report</th>
            </tr>
          </thead>
          <tbody>
            {candidates.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 text-center text-[13px] text-[#9a9a9a]">
                  No candidates in this batch.
                </td>
              </tr>
            ) : (
              candidates.map((c) => (
                <tr
                  key={c.candidateId}
                  className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50"
                >
                  <td className="px-6 py-4 text-[13px] font-medium text-[#1f1f1f]">{c.name}</td>
                  <td className="px-6 py-4 text-[13px] text-[#6a6a6a]">{c.email}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-6 py-4">
                    <ResultBadge passed={c.passed} />
                  </td>
                  <td className="px-6 py-4 text-[12px] text-[#9a9a9a]">
                    {formatDate(c.assignedAt)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <a
                      href={`${ASSESSMENT_PORTAL_URL}/assessment/${assessmentId}/report/${c.candidateId}`}
                      onClick={(e) => c.status !== "completed" && e.preventDefault()}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors",
                        c.status === "completed"
                          ? "bg-[#ff5723] text-white hover:bg-[#f04d1d]"
                          : "cursor-not-allowed bg-neutral-100 text-neutral-400",
                      )}
                    >
                      View Report
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="border-t border-neutral-100 px-6 py-4 text-[12px] text-[#9a9a9a]">
          Showing {candidates.length} candidate{candidates.length !== 1 ? "s" : ""}
        </div>
      </div>
    </div>
  );
}
