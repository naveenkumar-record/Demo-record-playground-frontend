"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, X, Loader2 } from "lucide-react";
import { Button }   from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input }    from "@/components/ui/input";
import { Label }    from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn }                                    from "@/lib/utils";
import { listWorkflowSkills, searchWorkflowSkills, type WorkflowSkill } from "@/api/workflow.api";
import { updateAssessment, type AssessmentItem, type UpdateAssessmentPayload } from "@/api/assessment.api";
import { toast } from "sonner";

function getAccessToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("auth_access_token") ?? "";
}

const ROLE_TYPES        = ["IT", "NON-IT"];
const EXPERIENCE_RANGES = ["0–1 years", "1–3 years", "3–5 years", "5–8 years", "8+ years"];
const DIFFICULTIES      = ["Easy", "Medium", "Hard", "Expert"];

type Props = {
  open:       boolean;
  assessment: AssessmentItem | null;
  orgId:      string;
  onClose:    () => void;
  onUpdated:  (updated: AssessmentItem) => void;
};

type FormState = {
  name:            string;
  jobTitle:        string;
  jobDescription:  string;
  roleType:        string;
  experienceRange: string;
  totalMarks:      string;
  passMarks:       string;
  duration:        string;
  difficulty:      string;
  selectedSkills:  WorkflowSkill[];
};

// ── Skill Picker Dialog ───────────────────────────────────────────────────────

function SkillPickerDialog({
  open, selectedSkills, onClose, onToggle,
}: {
  open:           boolean;
  selectedSkills: WorkflowSkill[];
  onClose:        () => void;
  onToggle:       (skill: WorkflowSkill) => void;
}) {
  const [query,     setQuery]     = useState("");
  const [results,   setResults]   = useState<WorkflowSkill[]>([]);
  const [searching, setSearching] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => { if (!open) { setQuery(""); setResults([]); } }, [open]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) { setResults([]); return; }
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    const timer = window.setTimeout(() => {
      setSearching(true);
      searchWorkflowSkills(trimmed, getAccessToken(), abortRef.current!.signal)
        .then((res) => setResults(res.data?.skills ?? []))
        .catch((err: unknown) => {
          if (err instanceof DOMException && err.name === "AbortError") return;
          setResults([]);
        })
        .finally(() => setSearching(false));
    }, 250);
    return () => { window.clearTimeout(timer); abortRef.current?.abort(); };
  }, [query]);

  const isSelected = (s: WorkflowSkill) => selectedSkills.some((x) => x.skillId === s.skillId);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[500px] p-0" showCloseButton>
        <DialogHeader className="border-b border-neutral-200 px-5 py-4">
          <DialogTitle className="text-[16px] font-semibold">Add Skills</DialogTitle>
          <p className="text-[12px] text-[#7a7a7a]">Search and select up to 5 skills.</p>
        </DialogHeader>
        <div className="space-y-4 px-5 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input autoFocus placeholder="Search skills…" className="pl-9 text-[13px]"
              value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <div className="min-h-44 overflow-hidden rounded-md border border-neutral-200">
            {query.trim().length < 2 ? (
              <p className="px-4 py-8 text-center text-[13px] text-[#8a8a8a]">
                Type at least 2 characters to search.
              </p>
            ) : searching ? (
              <p className="px-4 py-8 text-center text-[13px] text-[#8a8a8a]">Searching…</p>
            ) : results.length === 0 ? (
              <p className="px-4 py-8 text-center text-[13px] text-[#8a8a8a]">No skills found.</p>
            ) : (
              <div className="max-h-64 overflow-y-auto">
                {results.map((skill) => (
                  <label key={skill.skillId}
                    className="flex cursor-pointer items-center gap-3 border-b border-neutral-100 px-4 py-3 last:border-b-0 hover:bg-neutral-50">
                    <Checkbox checked={isSelected(skill)} onCheckedChange={() => {
                      if (!isSelected(skill) && selectedSkills.length >= 5) return;
                      onToggle(skill);
                    }} />
                    <span className="flex-1 text-[13px] font-medium text-[#1f1f1f]">{skill.name}</span>
                    <span className="text-[11px] text-[#9a9a9a]">{skill.skillId}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center justify-between text-[12px] text-[#8a8a8a]">
            <span>{selectedSkills.length} of 5 selected</span>
            <Button className="bg-[#ff5723] text-white hover:bg-[#f04d1d]" onClick={onClose}>Done</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────

export default function EditAssessmentModal({ open, assessment, orgId, onClose, onUpdated }: Props) {
  const router = useRouter();

  const [form,            setForm]            = useState<FormState>({
    name: "", jobTitle: "", jobDescription: "", roleType: "",
    experienceRange: "", totalMarks: "", passMarks: "", duration: "", difficulty: "",
    selectedSkills: [],
  });
  const [saving,          setSaving]          = useState(false);
  const [skillPickerOpen, setSkillPickerOpen] = useState(false);

  // Populate form when assessment changes, resolving skill IDs → names
  useEffect(() => {
    if (!assessment) return;

    const baseForm = {
      name:            assessment.name            ?? "",
      jobTitle:        assessment.jobTitle        ?? "",
      jobDescription:  assessment.jobDescription  ?? "",
      roleType:        assessment.roleType        ?? "",
      experienceRange: assessment.experienceRange ?? "",
      totalMarks:      assessment.totalMarks != null ? String(assessment.totalMarks) : "",
      passMarks:       assessment.passMarks  != null ? String(assessment.passMarks)  : "",
      duration:        assessment.duration   != null ? String(assessment.duration)   : "",
      difficulty:      assessment.difficulty      ?? "",
    };

    const skillIds = assessment.skills ?? [];

    if (skillIds.length === 0) {
      setForm({ ...baseForm, selectedSkills: [] });
      return;
    }

    // Fetch all skills once to resolve IDs → names
    listWorkflowSkills(getAccessToken())
      .then((res) => {
        const allSkills = res.data?.skills ?? [];
        const resolved = skillIds.map((id) => {
          const found = allSkills.find((s) => s.skillId === id);
          return found ?? { skillId: id, name: id };
        });
        setForm({ ...baseForm, selectedSkills: resolved });
      })
      .catch(() => {
        // Fallback: show skill IDs if fetch fails
        setForm({ ...baseForm, selectedSkills: skillIds.map((id) => ({ skillId: id, name: id })) });
      });
  }, [assessment]);

  const handleClose = () => { setSaving(false); onClose(); };

  const toggleSkill = (skill: WorkflowSkill) =>
    setForm((p) => {
      const exists = p.selectedSkills.some((s) => s.skillId === skill.skillId);
      if (!exists && p.selectedSkills.length >= 5) return p;
      return {
        ...p,
        selectedSkills: exists
          ? p.selectedSkills.filter((s) => s.skillId !== skill.skillId)
          : [...p.selectedSkills, skill],
      };
    });

  const handleSave = async () => {
    if (!assessment) return;
    if (!form.name.trim()) { toast.error("Assessment name is required"); return; }
    setSaving(true);
    try {
      const payload: UpdateAssessmentPayload = {
        orgId,
        name:            form.name.trim()            || undefined,
        jobTitle:        form.jobTitle.trim()        || undefined,
        jobDescription:  form.jobDescription.trim()  || undefined,
        roleType:        form.roleType               || undefined,
        experienceRange: form.experienceRange        || undefined,
        skills:          form.selectedSkills.map((s) => s.skillId),
        totalMarks:      form.totalMarks  ? Number(form.totalMarks)  : undefined,
        passMarks:       form.passMarks   ? Number(form.passMarks)   : undefined,
        duration:        form.duration    ? Number(form.duration)    : undefined,
        difficulty:      form.difficulty  || undefined,
      };
      const token = getAccessToken();
      const res = await updateAssessment(assessment.assessmentId, payload, token);
      const updated = res.data?.assessment;
      if (updated) {
        onUpdated(updated);
        toast.success("Assessment updated");
      }
      handleClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update assessment");
    } finally {
      setSaving(false);
    }
  };

  const isCustom = assessment?.creationMethod === "custom";

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
        <DialogContent className="max-h-[90vh] sm:max-w-[800px] overflow-y-auto p-0" showCloseButton>
          <DialogHeader className="border-b border-neutral-200 px-6 py-4">
            <DialogTitle className="text-[16px] font-semibold">Edit Assessment</DialogTitle>
            <p className="text-[12px] text-[#8a8a8a]">
              {assessment?.assessmentType ?? ""} · {assessment?.assessmentId}
            </p>
          </DialogHeader>

          <div className="space-y-5 px-6 py-5">

            {/* Name + Job Title */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[13px] font-medium text-[#3a3a3a]">
                  Assessment Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="eg: Frontend Developer Assessment"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className="text-[13px]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[13px] font-medium text-[#3a3a3a]">Job Title</Label>
                <Input
                  placeholder="eg: Frontend Developer"
                  value={form.jobTitle}
                  onChange={(e) => setForm((p) => ({ ...p, jobTitle: e.target.value }))}
                  className="text-[13px]"
                />
              </div>
            </div>

            {/* Role Type + Experience */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[13px] font-medium text-[#3a3a3a]">Role Type</Label>
                <Select
                  value={form.roleType}
                  onValueChange={(v) => setForm((p) => ({ ...p, roleType: v }))}
                >
                  <SelectTrigger className="h-10 w-full rounded-xl border-0 bg-neutral-100 text-[13px] shadow-none focus:ring-0 focus:ring-offset-0">
                    <SelectValue placeholder="Select role type" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="w-[--radix-select-trigger-width]">
                    {ROLE_TYPES.map((r) => (
                      <SelectItem key={r} value={r} className="text-[13px]">{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[13px] font-medium text-[#3a3a3a]">Experience Range</Label>
                <Select
                  value={form.experienceRange}
                  onValueChange={(v) => setForm((p) => ({ ...p, experienceRange: v }))}
                >
                  <SelectTrigger className="h-10 w-full rounded-xl border-0 bg-neutral-100 text-[13px] shadow-none focus:ring-0 focus:ring-offset-0">
                    <SelectValue placeholder="Select experience range" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="w-[--radix-select-trigger-width]">
                    {EXPERIENCE_RANGES.map((r) => (
                      <SelectItem key={r} value={r} className="text-[13px]">{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Skills */}
            <div className="space-y-2">
              <Label className="text-[13px] font-medium text-[#3a3a3a]">Skills</Label>
              {form.selectedSkills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {form.selectedSkills.map((s) => (
                    <span key={s.skillId}
                      className="flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-[12px] font-medium text-[#3a3a3a]">
                      {s.name}
                      <button type="button"
                        onClick={() => setForm((p) => ({ ...p, selectedSkills: p.selectedSkills.filter((x) => x.skillId !== s.skillId) }))}
                        className="ml-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full text-neutral-400 hover:text-neutral-700">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <Button type="button" size="sm"
                disabled={form.selectedSkills.length >= 5}
                onClick={() => setSkillPickerOpen(true)}
                className="h-9 gap-1.5 rounded-lg bg-[#ff5723] px-4 text-[13px] font-semibold text-white hover:bg-[#f04d1d] disabled:opacity-50">
                <Plus className="h-3.5 w-3.5" />
                Add skills
              </Button>
              <p className="text-[11px] text-[#9a9a9a]">Up to 5 skills.</p>
            </div>

            {/* Marks + Duration */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[13px] font-medium text-[#3a3a3a]">Total Marks</Label>
                <Input type="number" placeholder="eg: 100" value={form.totalMarks}
                  className="text-[13px]"
                  onChange={(e) => setForm((p) => ({ ...p, totalMarks: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[13px] font-medium text-[#3a3a3a]">Duration (mins)</Label>
                <Input type="number" placeholder="eg: 75" value={form.duration}
                  className="text-[13px]"
                  onChange={(e) => setForm((p) => ({ ...p, duration: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[13px] font-medium text-[#3a3a3a]">Pass Marks</Label>
                <Input type="number" placeholder="eg: 65" value={form.passMarks}
                  className="text-[13px]"
                  onChange={(e) => setForm((p) => ({ ...p, passMarks: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[13px] font-medium text-[#3a3a3a]">Difficulty</Label>
                <Select value={form.difficulty} onValueChange={(v) => setForm((p) => ({ ...p, difficulty: v }))}>
                  <SelectTrigger className="h-10 w-full rounded-xl border-0 bg-neutral-100 text-[13px] shadow-none focus:ring-0 focus:ring-offset-0">
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="w-[--radix-select-trigger-width]">
                    {DIFFICULTIES.map((d) => (
                      <SelectItem key={d} value={d} className="text-[13px]">{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Build Questions — only for Customized Assessment */}
            {isCustom && (
              <div className={cn(
                "flex items-center justify-between rounded-xl border border-[#ff5723]/30 bg-orange-50 px-4 py-3",
              )}>
                <div>
                  <p className="text-[13px] font-semibold text-[#ff5723]">Build Questions</p>
                  <p className="text-[12px] text-[#9a9a9a]">
                    Manually add questions and answers for this assessment.
                  </p>
                </div>
                <Button
                  type="button"
                  className="shrink-0 bg-[#ff5723] text-white hover:bg-[#f04d1d]"
                  onClick={() => {
                    if (!assessment?.assessmentId) return;
                    handleClose();
                    router.push(`/whitecollar/assessments/${assessment.assessmentId}`);
                  }}
                >
                  Build Questions
                </Button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-neutral-200 px-6 py-4">
            <Button variant="outline" onClick={handleClose} disabled={saving}>Cancel</Button>
            <Button
              className="bg-[#ff5723] text-white hover:bg-[#f04d1d]"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Saving…</> : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <SkillPickerDialog
        open={skillPickerOpen}
        selectedSkills={form.selectedSkills}
        onClose={() => setSkillPickerOpen(false)}
        onToggle={toggleSkill}
      />
    </>
  );
}
