"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { ExternalLink, Users } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { getAssignmentDetail, type AssignmentItem, type CandidateRecord } from "@/api/assessmentAssignment.api";
import { listAssessments } from "@/api/assessment.api";
import { useOrg } from "@/components/layout/orgContext";
import { useTestMode } from "@/components/layout/testModeContext";
import PaginationControl from "@/components/ui/pagination-control";

const PAGE_SIZE = 10;

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

function ResultBadge({ passed }: { passed?: boolean }) {
  if (passed === true) {
    return (
      <span className="inline-flex items-center rounded-lg bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-600">
        Pass
      </span>
    );
  }
  if (passed === false) {
    return (
      <span className="inline-flex items-center rounded-lg bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-500">
        Fail
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-lg bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-500">
      Pending
    </span>
  );
}

const STATUS_STYLE: Record<CandidateRecord["status"], string> = {
  pending:   "bg-neutral-100 text-neutral-500",
  started:   "bg-amber-50 text-amber-600",
  completed: "bg-emerald-50 text-emerald-600",
  expired:   "bg-red-50 text-red-500",
};

function StatusBadge({ status }: { status: CandidateRecord["status"] }) {
  return (
    <span className={cn(
      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
      STATUS_STYLE[status],
    )}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

export default function AssignmentDetailPage() {
  const params       = useParams();
  const assignmentId = params.assignmentId as string;
  const { activeOrg }  = useOrg();
  const { isTestMode } = useTestMode();
  const mode = isTestMode ? "test" : "live";

  const [assignment,      setAssignment]      = useState<AssignmentItem | null>(null);
  const [assessmentName,  setAssessmentName]  = useState("");
  const [loading,         setLoading]         = useState(true);
  const [currentPage,     setCurrentPage]     = useState(1);

  useEffect(() => {
    if (!activeOrg?.orgId) return;

    const token = getAccessToken();

    Promise.all([
      getAssignmentDetail(assignmentId, activeOrg.orgId, token, mode),
      listAssessments(activeOrg.orgId, 1, 100, mode, token),
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
  }, [activeOrg?.orgId, assignmentId, mode]);

  const candidates     = useMemo(() => assignment?.candidates ?? [], [assignment?.candidates]);
  const totalPages     = Math.max(1, Math.ceil(candidates.length / PAGE_SIZE));
  const currentFrom    = candidates.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const currentTo      = Math.min(currentPage * PAGE_SIZE, candidates.length);
  const paginated      = useMemo(
    () => candidates.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [candidates, currentPage],
  );

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

  const { assessmentId, batchName, totalCandidates, tag } = assignment;
  const completed = candidates.filter((c) => c.status === "completed").length;

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[22px] font-semibold text-[#1f1f1f]">{batchName}</h1>
        <p className="mt-1 text-[13px] text-[#8a8a8a]">
          {assessmentName}{tag ? ` · ${tag}` : ""}
        </p>

        {/* Stats row */}
        <div className="mt-5 flex items-center gap-1">
          <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2">
            <Users className="h-4 w-4 text-neutral-400" />
            <span className="text-[13px] text-[#4a4a4a]">
              <strong className="text-[#1f1f1f]">{totalCandidates}</strong> candidates
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-[13px] text-[#4a4a4a]">
              <strong className="text-emerald-600">{completed}</strong> completed
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            <span className="text-[13px] text-[#4a4a4a]">
              <strong className="text-[#1f1f1f]">{totalCandidates - completed}</strong> pending / in progress
            </span>
          </div>
        </div>
      </div>

      {/* Candidate table */}
      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white [&_thead_tr]:border-b [&_thead_tr]:bg-white [&_thead_tr:hover]:bg-white [&_th]:h-14 [&_th]:px-6 [&_th]:text-[13px] [&_th]:font-medium [&_th]:text-[#6f7582] [&_tbody_tr]:h-[64px] [&_tbody_tr]:border-b [&_tbody_tr:hover]:bg-neutral-50 [&_td]:px-6">
        <Table>
          <TableHeader>
            <TableRow className="border-b bg-white hover:bg-white">
              <TableHead className="w-[220px]">Name</TableHead>
              <TableHead className="w-[130px]">Email</TableHead>
              <TableHead className="w-[130px]">Status</TableHead>
              <TableHead className="w-[110px]">Result</TableHead>
              <TableHead className="w-[140px]">Assigned</TableHead>
              <TableHead className="w-[150px]">Report</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {candidates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-16 text-center text-[13px] text-[#9a9a9a]">
                  No candidates in this batch.
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((c) => (
                <TableRow key={c.candidateId} className="h-[64px] border-b hover:bg-neutral-50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[12px] font-semibold text-[#5a5a5a]">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-[13px] font-medium text-[#1f1f1f]">{c.name}</span>
                    </div>
                  </TableCell>

                  <TableCell className="text-[13px] text-[#6a6a6a]">{c.email}</TableCell>

                  <TableCell>
                    <StatusBadge status={c.status} />
                  </TableCell>

                  <TableCell>
                    <ResultBadge passed={c.passed} />
                  </TableCell>

                  <TableCell className="text-[13px] text-[#6a6a6a]">
                    {formatDate(c.assignedAt)}
                  </TableCell>

                  <TableCell>
                    {c.status === "completed" ? (
                      <a
                        href={`${ASSESSMENT_PORTAL_URL}/assessment/${assessmentId}/report/${c.candidateId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-[12px] font-medium text-[#1f1f1f] transition-colors hover:bg-neutral-50"
                      >
                        View Report
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-[13px] text-[#bbb]">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      {candidates.length > 0 && (
      <div className="flex items-center justify-between border-t border-neutral-200 bg-neutral-50 px-6 py-4 text-[13px] text-[#6f7582]">
        <p>{`Showing ${currentFrom}-${currentTo} of ${candidates.length} Candidate${candidates.length === 1 ? "" : "s"}`}</p>
        <PaginationControl
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(p) => setCurrentPage(p)}
        />
      </div>
      )}
      </div>
    </div>
  );
}
