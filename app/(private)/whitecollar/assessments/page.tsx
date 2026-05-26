"use client";

import { useState } from "react";
import {
  ClipboardList,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { useOrg }      from "@/components/layout/orgContext";
import { useProject }  from "@/components/layout/projectContext";
import { useTestMode } from "@/components/layout/testModeContext";
import { Badge }       from "@/components/ui/badge";
import { Button }      from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input }    from "@/components/ui/input";
import { Label }    from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { cn }       from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

type AssessmentType =
  | "Technical Screen"
  | "Behavioral Interview"
  | "Cognitive Test"
  | "Domain Knowledge"
  | "Custom";

type Assessment = {
  assessmentId: string;
  name: string;
  assessmentType: AssessmentType;
  description: string;
  isActive: boolean;
  createdAt: string;
};

type CreateAssessmentForm = {
  name: string;
  assessmentType: AssessmentType | "";
  description: string;
};

const ASSESSMENT_TYPES: AssessmentType[] = [
  "Technical Screen",
  "Behavioral Interview",
  "Cognitive Test",
  "Domain Knowledge",
  "Custom",
];

function emptyForm(): CreateAssessmentForm {
  return { name: "", assessmentType: "", description: "" };
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
            <p className="text-[13px] font-medium text-[#1f1f1f]">No assessments yet</p>
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
  const { activeOrg }    = useOrg();
  const { activeProject } = useProject();
  const { isTestMode }   = useTestMode();

  // Derived context values (ready for API wiring)
  const _orgId     = activeOrg?.orgId;
  const _projectId = activeProject?.projectId ?? null;   // null = Default
  const _mode      = isTestMode ? "test" : "live";
  void _orgId; void _projectId; void _mode;              // suppress unused-var until API is wired

  // ── Local state (replace with API fetch later) ─────────────────────────────
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading]                     = useState(false);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm]           = useState<CreateAssessmentForm>(emptyForm());
  const [errors, setErrors]       = useState<Partial<Record<keyof CreateAssessmentForm, string>>>({});
  const [saving, setSaving]       = useState(false);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const openModal = () => {
    setForm(emptyForm());
    setErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setForm(emptyForm());
    setErrors({});
  };

  const updateField = <K extends keyof CreateAssessmentForm>(
    key: K,
    value: CreateAssessmentForm[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
  };

  const validate = (): boolean => {
    const e: Partial<Record<keyof CreateAssessmentForm, string>> = {};
    if (!form.name.trim())          e.name           = "Assessment name is required";
    if (!form.assessmentType)       e.assessmentType  = "Please select a type";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      // TODO: replace with real API call
      // await createAssessment({ orgId, projectId, mode, ...form }, token);

      const newAssessment: Assessment = {
        assessmentId: `asmnt_${Math.random().toString(36).slice(2, 10)}`,
        name:          form.name.trim(),
        assessmentType: form.assessmentType as AssessmentType,
        description:   form.description.trim(),
        isActive:      true,
        createdAt:     new Date().toISOString(),
      };

      setAssessments((prev) => [newAssessment, ...prev]);
      toast.success("Assessment created successfully");
      closeModal();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create assessment");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = (assessmentId: string) => {
    setAssessments((prev) =>
      prev.map((a) =>
        a.assessmentId === assessmentId ? { ...a, isActive: !a.isActive } : a,
      ),
    );
  };

  const handleDelete = (assessmentId: string) => {
    setAssessments((prev) => prev.filter((a) => a.assessmentId !== assessmentId));
    toast.success("Assessment deleted");
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 p-6">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-[16px] font-semibold text-[#1f1f1f]">Assessments</h1>
        <Button
          className="h-10 gap-2 bg-[#ff5723] px-5 text-[13px] font-semibold text-white hover:bg-[#f04d1d]"
          onClick={openModal}
        >
          <Plus className="h-4 w-4" />
          Add Assessment
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-md border border-neutral-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-white hover:bg-white">
              <TableHead className="h-12 px-5 text-[13px] font-medium text-[#7a7a7a]">
                Assessment Name
              </TableHead>
              <TableHead className="text-[13px] font-medium text-[#7a7a7a]">Type</TableHead>
              <TableHead className="text-[13px] font-medium text-[#7a7a7a]">Status</TableHead>
              <TableHead className="text-[13px] font-medium text-[#7a7a7a]">Created</TableHead>
              <TableHead className="pr-5 text-right text-[13px] font-medium text-[#7a7a7a]">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
            ) : assessments.length === 0 ? (
              <EmptyState onAdd={openModal} />
            ) : (
              assessments.map((assessment) => (
                <TableRow key={assessment.assessmentId}>

                  {/* Name + ID */}
                  <TableCell className="px-5 py-4">
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
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Pencil className="h-4 w-4 text-[#697282]" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4 text-[#697282]" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem
                            className="text-[13px]"
                            onClick={() => handleToggleActive(assessment.assessmentId)}
                          >
                            {assessment.isActive ? "Pause" : "Activate"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-[13px] text-red-500 focus:text-red-500"
                            onClick={() => handleDelete(assessment.assessmentId)}
                          >
                            <Trash2 className="mr-2 h-3.5 w-3.5" />
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

        {/* Footer */}
        {assessments.length > 0 && (
          <div className="flex items-center justify-between border-t border-neutral-200 px-5 py-4 text-[12px] text-[#7a7a7a]">
            <p>
              Showing {assessments.length} of {assessments.length}{" "}
              Assessment{assessments.length === 1 ? "" : "s"}
            </p>
          </div>
        )}
      </div>

      {/* ── Create Assessment Modal ──────────────────────────────────────────── */}
      <Dialog open={modalOpen} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent
          className="max-h-[90vh] max-w-[520px] overflow-y-auto p-0"
          showCloseButton
        >
          <DialogHeader className="border-b border-neutral-200 px-5 py-4">
            <DialogTitle className="text-[16px] font-semibold">
              Create Assessment
            </DialogTitle>
            <p className="text-[12px] text-[#8a8a8a]">
              Set up a new assessment to evaluate candidates.
            </p>
          </DialogHeader>

          <div className="space-y-5 px-5 py-5">

            {/* Assessment Name */}
            <div className="space-y-2">
              <Label className="text-[13px] font-medium text-[#3a3a3a]">
                Assessment Name <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="e.g. Senior Software Engineer Screen"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                className={cn(errors.name && "border-red-400 focus-visible:border-red-400")}
              />
              {errors.name && (
                <p className="text-[11px] text-red-500">{errors.name}</p>
              )}
            </div>

            {/* Assessment Type */}
            <div className="space-y-2">
              <Label className="text-[13px] font-medium text-[#3a3a3a]">
                Assessment Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={form.assessmentType}
                onValueChange={(v) => updateField("assessmentType", v as AssessmentType)}
              >
                <SelectTrigger
                  className={cn(errors.assessmentType && "border-red-400")}
                >
                  <SelectValue placeholder="Select a type" />
                </SelectTrigger>
                <SelectContent>
                  {ASSESSMENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type} className="text-[13px]">
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.assessmentType && (
                <p className="text-[11px] text-red-500">{errors.assessmentType}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label className="text-[13px] font-medium text-[#3a3a3a]">
                Description{" "}
                <span className="text-[12px] font-normal text-[#9a9a9a]">(optional)</span>
              </Label>
              <Textarea
                placeholder="Describe the purpose and scope of this assessment..."
                className="min-h-[100px] resize-none"
                maxLength={500}
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
              />
              <div className="flex justify-end text-[11px] text-[#9a9a9a]">
                {form.description.length}/500
              </div>
            </div>

          </div>

          <DialogFooter className="border-t border-neutral-200 px-5 py-4">
            <Button variant="outline" onClick={closeModal} disabled={saving}>
              Cancel
            </Button>
            <Button
              className="bg-[#ff5723] text-white hover:bg-[#f04d1d]"
              onClick={handleCreate}
              disabled={saving}
            >
              {saving ? "Creating..." : "Create Assessment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
