"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  ClipboardList,
  MoreVertical,
  Pause,
  Pencil,
  Play,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { useOrg } from "@/components/layout/orgContext";
import { useProject } from "@/components/layout/projectContext";
import { useTestMode } from "@/components/layout/testModeContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import PaginationControl from "@/components/ui/pagination-control";

import CreateAssessmentModal, {
  type CreateAssessmentResult,
} from "@/components/whitecollar/assessments/CreateAssessmentModal";
import EditAssessmentModal from "@/components/whitecollar/assessments/EditAssessmentModal";

import {
  listAssessments,
  createAssessment,
  toggleAssessmentActive,
  deleteAssessmentApi,
  type AssessmentItem,
} from "@/api/assessment.api";

// ── Helpers ────────────────────────────────────────────────────────────────────

function getAccessToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("auth_access_token") ?? "";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <TableRow>
      {[160, 120, 90, 80, 40].map((w, i) => (
        <TableCell key={i} className="px-5 py-4">
          <div
            className="h-3.5 animate-pulse rounded bg-neutral-100"
            style={{ width: w }}
          />
        </TableCell>
      ))}
    </TableRow>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <TableRow>
      <TableCell colSpan={5}>
        <div className="flex flex-col items-center justify-center gap-3 py-16">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
            <ClipboardList className="h-5 w-5 text-neutral-400" />
          </div>
          <div className="text-center">
            <p className="text-[13px] font-medium text-[#1f1f1f]">
              No assessments yet
            </p>
            <p className="mt-1 text-[12px] text-[#9a9a9a]">
              Create your first assessment to start evaluating candidates.
            </p>
          </div>
          <Button
            className="mt-1 h-9 gap-2 bg-[#ff5723] px-4 text-[13px] font-semibold text-white hover:bg-[#f04d1d]"
            onClick={onAdd}
          >
            <Plus className="h-4 w-4" />
            Add Assessment
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AssessmentsPage() {
  const { activeOrg } = useOrg();
  const { activeProject } = useProject();
  const { isTestMode } = useTestMode();

  const orgId = activeOrg?.orgId;
  const projectId = activeProject?.projectId ?? undefined;
  const mode      = (isTestMode ? "test" : "live") as "test" | "live";

  // ── Data state ──────────────────────────────────────────────────────────────
  const [assessments, setAssessments] = useState<AssessmentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  // ── Modal state ─────────────────────────────────────────────────────────────
  const [modalOpen,  setModalOpen]  = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [editTarget, setEditTarget] = useState<AssessmentItem | null>(null);

  // ── Fetch ───────────────────────────────────────────────────────────────────

  const abortRef = useRef<AbortController | null>(null);

  const fetchAssessments = useCallback(async (p = 1) => {
    if (!orgId) return;

    abortRef.current?.abort();
    const controller  = new AbortController();
    abortRef.current  = controller;

    setLoading(true);
    try {
      const token = getAccessToken();
      const res   = await listAssessments(
        orgId, p, PAGE_SIZE, mode, token, projectId, controller.signal,
      );
      if (!controller.signal.aborted) {
        setAssessments(res.data?.assessments ?? []);
        setTotal(res.data?.pagination.total ?? 0);
      }
    } catch (err: unknown) {
      if (!controller.signal.aborted) {
        toast.error(err instanceof Error ? err.message : "Failed to fetch assessments");
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [orgId, mode, projectId, PAGE_SIZE]);

  useEffect(() => {
    setPage(1);
    fetchAssessments(1);
  }, [fetchAssessments]);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  // Returns assessmentId so modal can navigate (custom flow) or show success (AI flow)
  const handleCreate = async (
    data: CreateAssessmentResult,
  ): Promise<string | undefined> => {
    if (!orgId) return undefined;
    setSaving(true);
    try {
      const token = getAccessToken();
      const res = await createAssessment(
        {
          orgId,
          mode,
          projectId,
          name: data.name,
          assessmentType: data.assessmentType,
          description: data.description,
          creationMethod: data.creationMethod,
          jobTitle: data.jobTitle,
          jobDescription: data.jobDescription,
          roleType: data.roleType,
          experienceRange: data.experienceRange,
          skills: data.skills,
          questionSetType: data.questionSetType,
          totalMarks: data.totalMarks,
          passMarks: data.passMarks,
          duration: data.duration,
          difficulty: data.difficulty,
        },
        token,
      );
      const newItem = res.data?.assessment;
      if (newItem) setAssessments((prev) => [newItem, ...prev]);
      // AI flow: show success toast (modal handles success screen internally)
      // Custom flow: no toast here; modal navigates to build page
      if (data.creationMethod === "ai") {
        toast.success("Assessment created successfully");
      }
      return newItem?.assessmentId;
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create assessment",
      );
      return undefined;
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (assessmentId: string) => {
    if (!orgId) return;
    try {
      const token = getAccessToken();
      const res = await toggleAssessmentActive(assessmentId, orgId, token);
      const updated = res.data?.assessment;
      if (updated) {
        setAssessments((prev) =>
          prev.map((a) => (a.assessmentId === assessmentId ? updated : a)),
        );
      }
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update assessment",
      );
    }
  };

  const handleDelete = async (assessmentId: string) => {
    if (!orgId) return;
    // Optimistic remove
    setAssessments((prev) =>
      prev.filter((a) => a.assessmentId !== assessmentId),
    );
    try {
      const token = getAccessToken();
      await deleteAssessmentApi(assessmentId, orgId, token);
      toast.success("Assessment deleted");
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete assessment",
      );
      fetchAssessments(); // restore on error
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 p-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-[16px] font-semibold text-[#1f1f1f]">
          Assessments
        </h1>
        <Button
          className="h-10 gap-2 bg-[#ff5723] px-5 text-[13px] font-semibold text-white hover:bg-[#f04d1d]"
          onClick={() => setModalOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Add Assessment
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-md border border-neutral-200 bg-white [&_th]:px-6 [&_th]:py-4 [&_td]:px-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Assessment Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
            ) : assessments.length === 0 ? (
              <EmptyState onAdd={() => setModalOpen(true)} />
            ) : (
              assessments.map((assessment) => (
                <TableRow key={assessment.assessmentId}>
                  {/* Name + ID */}
                  <TableCell>
                    <p className="text-[13px] font-semibold text-[#1f1f1f]">
                      {assessment.name}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[#aaa]">
                      {assessment.assessmentId}
                    </p>
                  </TableCell>

                  {/* Type */}
                  <TableCell>
                    <span className="rounded-md bg-neutral-100 px-2 py-1 text-[12px] text-[#6a6a6a]">
                      {assessment.assessmentType}
                    </span>
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <Badge
                      className={cn(
                        "text-[11px] font-medium",
                        assessment.isActive
                          ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-50"
                          : "bg-neutral-100 text-neutral-500 hover:bg-neutral-100",
                      )}
                    >
                      {assessment.isActive ? "Active" : "Paused"}
                    </Badge>
                  </TableCell>

                  {/* Created */}
                  <TableCell className="text-[13px] text-[#6a6a6a]">
                    {formatDate(assessment.createdAt)}
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="pr-5">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setEditTarget(assessment)}
                      >
                        <Pencil className="h-4 w-4 text-[#697282]" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreVertical className="h-4 w-4 text-[#697282]" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem
                            className="gap-2 text-[13px] text-[#3f4652] px-[12px] py-[10px]"
                            onClick={() =>
                              handleToggleActive(assessment.assessmentId)
                            }
                          >
                            {assessment.isActive ? (
                              <Pause className="h-3.5 w-3.5 text-[#697282]" />
                            ) : (
                              <Play className="h-3.5 w-3.5 text-[#697282]" />
                            )}
                            {assessment.isActive ? "Pause" : "Activate"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="gap-2 text-[13px] text-red-500 focus:text-red-500 px-[12px] py-[10px]"
                            onClick={() =>
                              handleDelete(assessment.assessmentId)
                            }
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>        
      </div>
      {!loading && total > 0 && (
          <div className="flex items-center justify-end px-5 py-4">
            <PaginationControl
              currentPage={page}
              totalPages={Math.max(1, Math.ceil(total / PAGE_SIZE))}
              onPageChange={(p) => {
                setPage(p);
                fetchAssessments(p);
              }}
            />
          </div>
        )}

      {/* Create Assessment Modal */}
      <CreateAssessmentModal
        open={modalOpen}
        saving={saving}
        onClose={() => setModalOpen(false)}
        onCreate={handleCreate}
      />

      {/* Edit Assessment Modal */}
      <EditAssessmentModal
        open={!!editTarget}
        assessment={editTarget}
        orgId={orgId ?? ""}
        onClose={() => setEditTarget(null)}
        onUpdated={(updated) => {
          setAssessments((prev) =>
            prev.map((a) => (a.assessmentId === updated.assessmentId ? updated : a)),
          );
          setEditTarget(null);
        }}
      />


    </div>
  );
}
