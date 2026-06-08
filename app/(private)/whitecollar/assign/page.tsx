"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, ExternalLink, Plus, Users } from "lucide-react";
import { toast } from "sonner";

import { useOrg }      from "@/components/layout/orgContext";
import { useProject }  from "@/components/layout/projectContext";
import { useTestMode } from "@/components/layout/testModeContext";
import { Button }      from "@/components/ui/button";
import { Badge }       from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import PaginationControl from "@/components/ui/pagination-control";

import AssignAssessmentModal from "@/components/whitecollar/assessments/AssignAssessmentModal";
import { listOrgAssignments, type AssignmentItem, type CandidateRecord } from "@/api/assessmentAssignment.api";
import { listAssessments,  type AssessmentItem }  from "@/api/assessment.api";

const ASSESSMENT_PORTAL_URL = process.env.NEXT_PUBLIC_ASSESSMENT_PORTAL_URL ?? "";

// ── Helpers ───────────────────────────────────────────────────────────────────

function getAccessToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("auth_access_token") ?? "";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  }).format(new Date(value));
}

function reportUrl(assessmentId: string, candidateId: string) {
  return `${ASSESSMENT_PORTAL_URL}/assessment/${assessmentId}/report/${candidateId}`;
}

// ── Candidate status badge ────────────────────────────────────────────────────

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

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <TableRow>
      {[160, 140, 80, 100, 80, 80].map((w, i) => (
        <TableCell key={i} className="px-5 py-4">
          <div className="h-3.5 animate-pulse rounded bg-neutral-100" style={{ width: w }} />
        </TableCell>
      ))}
    </TableRow>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <TableRow>
      <TableCell colSpan={7}>
        <div className="flex flex-col items-center justify-center gap-3 py-16">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
            <Users className="h-5 w-5 text-neutral-400" />
          </div>
          <div className="text-center">
            <p className="text-[13px] font-medium text-[#1f1f1f]">No assignments yet</p>
            <p className="mt-1 text-[12px] text-[#9a9a9a]">
              Assign an assessment to candidates to get started.
            </p>
          </div>
          <Button
            className="mt-1 h-9 gap-2 bg-[#ff5723] px-4 text-[13px] font-semibold text-white hover:bg-[#f04d1d]"
            onClick={onAdd}
          >
            <Plus className="h-4 w-4" />
            New Assignment
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

// ── Expanded candidate sub-table ──────────────────────────────────────────────

function CandidateSubTable({
  assignment,
  assessmentName,
}: {
  assignment: AssignmentItem;
  assessmentName: string;
}) {
  const { candidates, assessmentId } = assignment;

  return (
    <TableRow className="bg-[#fafafa] hover:bg-[#fafafa]">
      <TableCell colSpan={7} className="px-0 py-0">
        <div className="border-t border-neutral-100 px-8 py-4">
          <p className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-[#9a9a9a]">
            Candidates — {assessmentName}
          </p>

          {candidates.length === 0 ? (
            <p className="text-[13px] text-[#9a9a9a]">No candidates in this batch.</p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50">
                    <th className="px-4 py-2.5 text-left text-[12px] font-medium text-[#7a7a7a]">Name</th>
                    <th className="px-4 py-2.5 text-left text-[12px] font-medium text-[#7a7a7a]">Email</th>
                    <th className="px-4 py-2.5 text-left text-[12px] font-medium text-[#7a7a7a]">Status</th>
                    <th className="px-4 py-2.5 text-left text-[12px] font-medium text-[#7a7a7a]">Assigned</th>
                    <th className="px-4 py-2.5 text-right text-[12px] font-medium text-[#7a7a7a]">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((c) => (
                    <tr key={c.candidateId} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                      <td className="px-4 py-3 text-[13px] font-medium text-[#1f1f1f]">{c.name}</td>
                      <td className="px-4 py-3 text-[13px] text-[#6a6a6a]">{c.email}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="px-4 py-3 text-[12px] text-[#9a9a9a]">
                        {formatDate(c.assignedAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <a
                          href={reportUrl(assessmentId, c.candidateId)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            "inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors",
                            c.status === "completed"
                              ? "bg-[#ff5723] text-white hover:bg-[#f04d1d]"
                              : "cursor-not-allowed bg-neutral-100 text-neutral-400",
                          )}
                          onClick={(e) => {
                            if (c.status !== "completed") e.preventDefault();
                          }}
                        >
                          View Result
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AssignPage() {
  const router            = useRouter();
  const { activeOrg }     = useOrg();
  const { activeProject } = useProject();
  const { isTestMode }    = useTestMode();

  const orgId     = activeOrg?.orgId;
  const projectId = activeProject?.projectId ?? undefined;
  const mode      = isTestMode ? "test" : "live";

  const [assignments,  setAssignments]  = useState<AssignmentItem[]>([]);
  const [assessments,  setAssessments]  = useState<AssessmentItem[]>([]);
  const [loading,      setLoading]      = useState(false);
  const [modalOpen,    setModalOpen]    = useState(false);
  const [page,         setPage]         = useState(1);
  const PAGE_SIZE = 10;

  // ── Fetch assignments ───────────────────────────────────────────────────────

  const fetchAssignments = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const res = await listOrgAssignments(orgId, getAccessToken(), mode as "test" | "live");
      setAssignments(res.data?.assignments ?? []);
      setPage(1);
    } catch {
      toast.error("Failed to load assignments");
    } finally {
      setLoading(false);
    }
  }, [orgId, mode]);

  // ── Fetch assessments (for modal dropdown) ──────────────────────────────────

  const fetchAssessments = useCallback(async () => {
    if (!orgId) return;
    try {
      const res = await listAssessments(orgId, 1, 100, mode, getAccessToken(), projectId);
      setAssessments(res.data?.assessments ?? []);
    } catch { /* silent */ }
  }, [orgId, mode, projectId]);

  useEffect(() => {
    fetchAssignments();
    fetchAssessments();
  }, [fetchAssignments, fetchAssessments]);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const getAssessmentName = (assessmentId: string) =>
    assessments.find((a) => a.assessmentId === assessmentId)?.name ?? assessmentId;

  const openAssignment = (assignmentId: string) => {
    router.push(`/whitecollar/assign/${assignmentId}`);
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 p-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[16px] font-semibold text-[#1f1f1f]">Assign Assessments</h1>
        </div>
        <Button
          className="h-10 gap-2 bg-[#ff5723] px-5 text-[13px] font-semibold text-white hover:bg-[#f04d1d]"
          onClick={() => setModalOpen(true)}
        >
          <Plus className="h-4 w-4" />
          New Assignment
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-md border border-neutral-200 bg-white [&_th]:px-6 [&_th]:py-4 [&_td]:px-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Batch Name</TableHead>
              <TableHead>Assessment</TableHead>
              <TableHead>Tag</TableHead>
              <TableHead>Candidates</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
            ) : assignments.length === 0 ? (
              <EmptyState onAdd={() => setModalOpen(true)} />

            ) : (
              assignments.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((a) => {
                return (
                  <>
                    <TableRow key={a.assignmentId}>
                      {/* Batch name + ID */}
                      <TableCell className="py-4">
                        <p className="text-[13px] font-semibold text-[#1f1f1f]">{a.batchName}</p>
                        <p className="mt-0.5 text-[11px] text-[#aaa]">{a.assignmentId}</p>
                      </TableCell>

                      {/* Assessment */}
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <ClipboardList className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                          <span className="text-[13px] text-[#3a3a3a]">
                            {getAssessmentName(a.assessmentId)}
                          </span>
                        </div>
                      </TableCell>

                      {/* Tag */}
                      <TableCell>
                        {a.tag ? (
                          <span className="rounded-md bg-neutral-100 px-2 py-1 text-[12px] text-[#6a6a6a]">
                            {a.tag}
                          </span>
                        ) : (
                          <span className="text-[12px] text-[#bbb]">—</span>
                        )}
                      </TableCell>

                      {/* Candidates count */}
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-neutral-400" />
                          <span className="text-[13px] text-[#3a3a3a]">{a.totalCandidates}</span>
                        </div>
                      </TableCell>

                      {/* Created */}
                      <TableCell className="text-[13px] text-[#6a6a6a]">
                        {formatDate(a.createdAt)}
                      </TableCell>

                      {/* Status badge */}
                      <TableCell>
                        <Badge className="bg-emerald-50 text-emerald-600 hover:bg-emerald-50 text-[11px] font-medium">
                          Active
                        </Badge>
                      </TableCell>

                      <TableCell className="pr-5 text-left">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 gap-1.5 px-3 text-[12px] font-medium text-[#3a3a3a]"
                          onClick={() => openAssignment(a.assignmentId)}
                        >
                          <Users className="h-3.5 w-3.5" />
                          View Candidates
                        </Button>
                      </TableCell>
                    </TableRow>

                  </>
                );
              })
            )}
          </TableBody>
        </Table>       
      </div>
      {assignments.length > 0 && (
          <div className="flex items-center justify-end px-5 py-4">
            <PaginationControl
              currentPage={page}
              totalPages={Math.max(1, Math.ceil(assignments.length / PAGE_SIZE))}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        )}

      {/* Assign Modal */}
      <AssignAssessmentModal
        open={modalOpen}
        assessments={assessments}
        orgId={orgId ?? ""}
        mode={mode}
        getToken={getAccessToken}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchAssignments}
      />

    </div>
  );
}
