"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter }  from "next/navigation";
import {
  Sparkles, AlignLeft, Search, Plus, X, Loader2, Check,
} from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { searchWorkflowSkills, type WorkflowSkill } from "@/api/workflow.api";

function getAccessToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("auth_access_token") ?? "";
}

// ── Constants ─────────────────────────────────────────────────────────────────

const ROLE_TYPES        = ["IT", "NON-IT"];
const EXPERIENCE_RANGES = ["0–1 years", "1–3 years", "3–5 years", "5–8 years", "8+ years"];
const QUESTION_SET_TYPES = ["Same For All", "Different For All"];
const DIFFICULTIES      = ["Easy", "Medium", "Hard", "Expert"];

// ── Public types ──────────────────────────────────────────────────────────────

export type CreateAssessmentResult = {
  name:            string;
  assessmentType:  string;
  description:     string;
  creationMethod:  "ai" | "custom";
  jobTitle?:        string;
  jobDescription?:  string;
  roleType?:        string;
  experienceRange?: string;
  skills?:          string[];
  questionSetType?: string;
  totalMarks?:      number;
  passMarks?:       number;
  duration?:        number;
  difficulty?:      string;
};

type Props = {
  open:     boolean;
  saving:   boolean;
  onClose:  () => void;
  /** Returns the created assessmentId so the modal can navigate for custom flow */
  onCreate: (data: CreateAssessmentResult) => Promise<string | undefined>;
};

type FlowStep = "options" | "ai-1" | "ai-2" | "custom-1" | "success";

// ── Shared form types ─────────────────────────────────────────────────────────

type AiStep1Form = {
  name:            string;
  jobTitle:        string;
  jobDescription:  string;
  roleType:        string;
  experienceRange: string;
  selectedSkills:  WorkflowSkill[];
};
type AiStep1Errors = Partial<Record<"name" | "jobTitle", string>>;

type AiStep2Form = {
  questionSetType: string;
  totalMarks:      string;
  duration:        string;
  passMarks:       string;
  difficulty:      string;
};
type AiStep2Errors = Partial<Record<keyof AiStep2Form, string>>;

type CustomStep1Form = {
  name:            string;
  jobTitle:        string;
  roleType:        string;
  experienceRange: string;
  selectedSkills:  WorkflowSkill[];
  totalMarks:      string;
  duration:        string;
  passMarks:       string;
  difficulty:      string;
};
type CustomStep1Errors = Partial<Record<"name", string>>;

// ── Progress bar ──────────────────────────────────────────────────────────────

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="mt-1 flex gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "h-[3px] flex-1 rounded-full transition-colors",
            i < step ? "bg-[#ff5723]" : "bg-neutral-200",
          )}
        />
      ))}
    </div>
  );
}

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

// ── Success screen ────────────────────────────────────────────────────────────

function SuccessScreen({ onClose, onAssign }: { onClose: () => void; onAssign: () => void }) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <div className="relative mb-6 flex h-24 w-24 items-center justify-center">
        <span className="absolute inset-0 rounded-full bg-emerald-100 opacity-40" />
        <span className="absolute inset-3 rounded-full bg-emerald-100 opacity-60" />
        <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500">
          <Check className="h-7 w-7 text-white" strokeWidth={3} />
        </span>
      </div>
      <h2 className="text-[18px] font-bold text-[#1f1f1f]">Assessment Created Successfully</h2>
      <p className="mt-2 max-w-[300px] text-[13px] leading-relaxed text-[#8a8a8a]">
        Your assessment has been set up. You can now assign it to candidates or review the details.
      </p>
      <div className="mt-8 flex w-full items-center justify-between border-t border-neutral-200 pt-5">
        <Button variant="outline" onClick={onClose}>Back to Dashboard</Button>
        <Button className="bg-[#ff5723] text-white hover:bg-[#f04d1d]" onClick={onAssign}>
          Assign Assessment
        </Button>
      </div>
    </div>
  );
}

// ── Assessment Options ────────────────────────────────────────────────────────

function AssessmentOptionsStep({
  selected, onSelect, onCancel, onContinue,
}: {
  selected: "ai" | "custom"; onSelect: (m: "ai" | "custom") => void;
  onCancel: () => void; onContinue: () => void;
}) {
  return (
    <>
      <DialogHeader className="border-b border-neutral-200 px-6 py-4">
        <DialogTitle className="text-[16px] font-semibold">Assessment options</DialogTitle>
        <p className="text-[12px] text-[#8a8a8a]">
          Select how you&apos;d like to create your assessment.
        </p>
      </DialogHeader>
      <div className="space-y-3 px-6 py-5">
        {[
          {
            key: "ai" as const,
            icon: <Sparkles className={cn("h-5 w-5", selected === "ai" ? "text-[#ff5723]" : "text-neutral-400")} />,
            title: "AI Powered Assessment",
            desc: "Enter job details, role, experience, and skills. The system generates tailored Q&A sets, same for all or unique per candidate.",
          },
          {
            key: "custom" as const,
            icon: (
              <svg className={cn("h-5 w-5", selected === "custom" ? "text-[#ff5723]" : "text-neutral-400")}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            ),
            title: "Customized Assessment",
            desc: "Manually create your own questions and scenarios to match specific job needs or unique evaluation criteria.",
          },
        ].map(({ key, icon, title, desc }) => (
          <button key={key} type="button" onClick={() => onSelect(key)}
            className={cn(
              "flex w-full items-start gap-4 rounded-xl border-2 p-4 text-left transition-all",
              selected === key ? "border-[#ff5723] bg-orange-50" : "border-neutral-200 bg-white hover:border-neutral-300",
            )}>
            <span className={cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
              selected === key ? "bg-orange-100" : "bg-neutral-100")}>
              {icon}
            </span>
            <div>
              <p className={cn("text-[14px] font-semibold", selected === key ? "text-[#ff5723]" : "text-[#1f1f1f]")}>
                {title}
              </p>
              <p className="mt-1 text-[12px] leading-relaxed text-[#8a8a8a]">{desc}</p>
            </div>
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between border-t border-neutral-200 px-6 py-4">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button className="bg-[#ff5723] text-white hover:bg-[#f04d1d]" onClick={onContinue}>Continue</Button>
      </div>
    </>
  );
}

// ── Shared skill chips ────────────────────────────────────────────────────────

function SkillChips({ skills, onRemove, onAdd }: {
  skills: WorkflowSkill[]; onRemove: (id: string) => void; onAdd: () => void;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-[13px] font-medium text-[#3a3a3a]">Skills</Label>
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {skills.map((s) => (
            <span key={s.skillId}
              className="flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-[12px] font-medium text-[#3a3a3a]">
              {s.name}
              <button type="button" onClick={() => onRemove(s.skillId)}
                className="ml-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full text-neutral-400 hover:text-neutral-700">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <Button type="button" size="sm" disabled={skills.length >= 5} onClick={onAdd}
        className="h-9 gap-1.5 rounded-full bg-[#ff5723] px-4 text-[13px] font-semibold text-white hover:bg-[#f04d1d] disabled:opacity-50">
        <Plus className="h-3.5 w-3.5" />
        Add skills
      </Button>
      <p className="text-[11px] text-[#9a9a9a]">You can add up to 5 skills per assessment.</p>
    </div>
  );
}

// ── AI Step 1 ─────────────────────────────────────────────────────────────────

function AiStep1Content({ form, errors, onOpenSkillPicker, onChange, onRemoveSkill }: {
  form: AiStep1Form; errors: AiStep1Errors; onOpenSkillPicker: () => void;
  onChange: <K extends keyof AiStep1Form>(k: K, v: AiStep1Form[K]) => void;
  onRemoveSkill: (id: string) => void;
}) {
  return (
    <div className="space-y-5 px-6 pb-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-[13px] font-medium text-[#3a3a3a]">Assessment Name <span className="text-red-500">*</span></Label>
          <Input placeholder="eg: Frontend Developer Assess…" value={form.name}
            onChange={(e) => onChange("name", e.target.value)}
            className={cn("text-[13px]", errors.name && "border-red-400 focus-visible:border-red-400")} />
          {errors.name && <p className="text-[11px] text-red-500">{errors.name}</p>}
        </div>
        <div className="space-y-1.5">
          <Label className="text-[13px] font-medium text-[#3a3a3a]">Job Title <span className="text-red-500">*</span></Label>
          <Input placeholder="eg: Frontend Developer" value={form.jobTitle}
            onChange={(e) => onChange("jobTitle", e.target.value)}
            className={cn("text-[13px]", errors.jobTitle && "border-red-400 focus-visible:border-red-400")} />
          {errors.jobTitle && <p className="text-[11px] text-red-500">{errors.jobTitle}</p>}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-[13px] font-medium text-[#3a3a3a]">Job Description</Label>
        <div className="relative">
          <AlignLeft className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
          <Textarea placeholder="eg: Hiring candidates with strong role fundamentals…"
            className="min-h-[120px] resize-none pl-9 text-[13px]"
            maxLength={1500} value={form.jobDescription}
            onChange={(e) => onChange("jobDescription", e.target.value)} />
        </div>
        <div className="flex justify-end text-[11px] text-[#9a9a9a]">{form.jobDescription.length}/1500</div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-[13px] font-medium text-[#3a3a3a]">Role Type</Label>
          <div className="w-full">
            <Select value={form.roleType} onValueChange={(v) => onChange("roleType", v)}>
              <SelectTrigger className="h-10 w-full rounded-xl border-0 bg-neutral-100 text-[13px] text-[#9a9a9a] shadow-none focus:ring-0 focus:ring-offset-0 data-[placeholder]:text-[#9a9a9a]">
                <SelectValue placeholder="Select role type" />
              </SelectTrigger>
              <SelectContent position="popper" className="w-[--radix-select-trigger-width]">
                {ROLE_TYPES.map((r) => <SelectItem key={r} value={r} className="text-[13px]">{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-[13px] font-medium text-[#3a3a3a]">Experience Range</Label>
          <div className="w-full">
            <Select value={form.experienceRange} onValueChange={(v) => onChange("experienceRange", v)}>
              <SelectTrigger className="h-10 w-full rounded-xl border-0 bg-neutral-100 text-[13px] text-[#9a9a9a] shadow-none focus:ring-0 focus:ring-offset-0 data-[placeholder]:text-[#9a9a9a]">
                <SelectValue placeholder="Select experience range" />
              </SelectTrigger>
              <SelectContent position="popper" className="w-[--radix-select-trigger-width]">
                {EXPERIENCE_RANGES.map((r) => <SelectItem key={r} value={r} className="text-[13px]">{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <SkillChips skills={form.selectedSkills} onRemove={onRemoveSkill} onAdd={onOpenSkillPicker} />
    </div>
  );
}

// ── AI Step 2 ─────────────────────────────────────────────────────────────────

function AiStep2Content({ form, errors, onChange }: {
  form: AiStep2Form; errors: AiStep2Errors;
  onChange: <K extends keyof AiStep2Form>(k: K, v: AiStep2Form[K]) => void;
}) {
  return (
    <div className="space-y-5 px-6 pb-2">
      <div className="space-y-1.5">
        <Label className="text-[13px] font-medium text-[#3a3a3a]">Question Set Type <span className="text-red-500">*</span></Label>
        <Select value={form.questionSetType} onValueChange={(v) => onChange("questionSetType", v)}>
          <SelectTrigger className={cn("h-10 w-full rounded-xl border-0 bg-neutral-100 text-[13px] text-[#9a9a9a] shadow-none focus:ring-0 focus:ring-offset-0 data-[placeholder]:text-[#9a9a9a]",
            errors.questionSetType && "ring-1 ring-red-400")}>
            <SelectValue placeholder="Select Question Set Type" />
          </SelectTrigger>
          <SelectContent position="popper" className="w-[--radix-select-trigger-width]">
            {QUESTION_SET_TYPES.map((t) => <SelectItem key={t} value={t} className="text-[13px]">{t}</SelectItem>)}
          </SelectContent>
        </Select>
        {errors.questionSetType && <p className="text-[11px] text-red-500">{errors.questionSetType}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-[13px] font-medium text-[#3a3a3a]">Total Marks</Label>
          <Input type="number" placeholder="eg: 100" value={form.totalMarks}
            className="text-[13px]" onChange={(e) => onChange("totalMarks", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[13px] font-medium text-[#3a3a3a]">Duration</Label>
          <Input placeholder="eg: 75 mins" value={form.duration}
            className="text-[13px]" onChange={(e) => onChange("duration", e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-[13px] font-medium text-[#3a3a3a]">Pass Marks</Label>
          <Input placeholder="eg: 65/100" value={form.passMarks}
            className="text-[13px]" onChange={(e) => onChange("passMarks", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[13px] font-medium text-[#3a3a3a]">Difficulty</Label>
          <Select value={form.difficulty} onValueChange={(v) => onChange("difficulty", v)}>
            <SelectTrigger className="h-10 w-full rounded-xl border-0 bg-neutral-100 text-[13px] text-[#9a9a9a] shadow-none focus:ring-0 focus:ring-offset-0 data-[placeholder]:text-[#9a9a9a]">
              <SelectValue placeholder="Select Difficulty level" />
            </SelectTrigger>
            <SelectContent position="popper" className="w-[--radix-select-trigger-width]">
              {DIFFICULTIES.map((d) => <SelectItem key={d} value={d} className="text-[13px]">{d}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

// ── Custom Step 1 — Assessment Details ────────────────────────────────────────

function CustomStep1Content({ form, errors, onOpenSkillPicker, onChange, onRemoveSkill }: {
  form: CustomStep1Form; errors: CustomStep1Errors; onOpenSkillPicker: () => void;
  onChange: <K extends keyof CustomStep1Form>(k: K, v: CustomStep1Form[K]) => void;
  onRemoveSkill: (id: string) => void;
}) {
  return (
    <div className="space-y-5 px-6 pb-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-[13px] font-medium text-[#3a3a3a]">Assessment Name <span className="text-red-500">*</span></Label>
          <Input placeholder="eg: Frontend Developer Assess…" value={form.name}
            onChange={(e) => onChange("name", e.target.value)}
            className={cn("text-[13px]", errors.name && "border-red-400 focus-visible:border-red-400")} />
          {errors.name && <p className="text-[11px] text-red-500">{errors.name}</p>}
        </div>
        <div className="space-y-1.5">
          <Label className="text-[13px] font-medium text-[#3a3a3a]">Job Title</Label>
          <Input placeholder="eg: Frontend Developer" value={form.jobTitle}
            onChange={(e) => onChange("jobTitle", e.target.value)} className="text-[13px]" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-[13px] font-medium text-[#3a3a3a]">Role Type</Label>
          <div className="w-full">
            <Select value={form.roleType} onValueChange={(v) => onChange("roleType", v)}>
              <SelectTrigger className="h-10 w-full rounded-xl border-0 bg-neutral-100 text-[13px] text-[#9a9a9a] shadow-none focus:ring-0 focus:ring-offset-0 data-[placeholder]:text-[#9a9a9a]">
                <SelectValue placeholder="Select role type" />
              </SelectTrigger>
              <SelectContent position="popper" className="w-[--radix-select-trigger-width]">
                {ROLE_TYPES.map((r) => <SelectItem key={r} value={r} className="text-[13px]">{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-[13px] font-medium text-[#3a3a3a]">Experience Range</Label>
          <div className="w-full">
            <Select value={form.experienceRange} onValueChange={(v) => onChange("experienceRange", v)}>
              <SelectTrigger className="h-10 w-full rounded-xl border-0 bg-neutral-100 text-[13px] text-[#9a9a9a] shadow-none focus:ring-0 focus:ring-offset-0 data-[placeholder]:text-[#9a9a9a]">
                <SelectValue placeholder="Select experience range" />
              </SelectTrigger>
              <SelectContent position="popper" className="w-[--radix-select-trigger-width]">
                {EXPERIENCE_RANGES.map((r) => <SelectItem key={r} value={r} className="text-[13px]">{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <SkillChips skills={form.selectedSkills} onRemove={onRemoveSkill} onAdd={onOpenSkillPicker} />
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-[13px] font-medium text-[#3a3a3a]">Total Marks</Label>
          <Input type="number" placeholder="eg: 100" value={form.totalMarks}
            className="text-[13px]" onChange={(e) => onChange("totalMarks", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[13px] font-medium text-[#3a3a3a]">Duration</Label>
          <Input placeholder="eg: 75 mins" value={form.duration}
            className="text-[13px]" onChange={(e) => onChange("duration", e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-[13px] font-medium text-[#3a3a3a]">Pass Marks</Label>
          <Input placeholder="eg: 65/100" value={form.passMarks}
            className="text-[13px]" onChange={(e) => onChange("passMarks", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[13px] font-medium text-[#3a3a3a]">Difficulty</Label>
          <Select value={form.difficulty} onValueChange={(v) => onChange("difficulty", v)}>
            <SelectTrigger className="h-10 w-full rounded-xl border-0 bg-neutral-100 text-[13px] text-[#9a9a9a] shadow-none focus:ring-0 focus:ring-offset-0 data-[placeholder]:text-[#9a9a9a]">
              <SelectValue placeholder="Select Difficulty level" />
            </SelectTrigger>
            <SelectContent position="popper" className="w-[--radix-select-trigger-width]">
              {DIFFICULTIES.map((d) => <SelectItem key={d} value={d} className="text-[13px]">{d}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────

const EMPTY_AI1: AiStep1Form     = { name: "", jobTitle: "", jobDescription: "", roleType: "", experienceRange: "", selectedSkills: [] };
const EMPTY_AI2: AiStep2Form     = { questionSetType: "", totalMarks: "", duration: "", passMarks: "", difficulty: "" };
const EMPTY_C1:  CustomStep1Form = { name: "", jobTitle: "", roleType: "", experienceRange: "", selectedSkills: [], totalMarks: "", duration: "", passMarks: "", difficulty: "" };

export default function CreateAssessmentModal({ open, saving, onClose, onCreate }: Props) {
  const router = useRouter();

  const [step,         setStep]         = useState<FlowStep>("options");
  const [methodChoice, setMethodChoice] = useState<"ai" | "custom">("ai");
  const [skillPickerOpen, setSkillPickerOpen] = useState(false);

  const [aiStep1,       setAiStep1]       = useState<AiStep1Form>(EMPTY_AI1);
  const [aiStep1Errors, setAiStep1Errors] = useState<AiStep1Errors>({});
  const [aiStep2,       setAiStep2]       = useState<AiStep2Form>(EMPTY_AI2);
  const [aiStep2Errors, setAiStep2Errors] = useState<AiStep2Errors>({});

  const [customStep1,       setCustomStep1]       = useState<CustomStep1Form>(EMPTY_C1);
  const [customStep1Errors, setCustomStep1Errors] = useState<CustomStep1Errors>({});

  const resetAll = () => {
    setStep("options"); setMethodChoice("ai"); setSkillPickerOpen(false);
    setAiStep1(EMPTY_AI1); setAiStep1Errors({});
    setAiStep2(EMPTY_AI2); setAiStep2Errors({});
    setCustomStep1(EMPTY_C1); setCustomStep1Errors({});
  };
  const handleClose = () => { resetAll(); onClose(); };

  // Skill toggles
  const toggleAiSkill = (skill: WorkflowSkill) =>
    setAiStep1((p) => {
      const exists = p.selectedSkills.some((s) => s.skillId === skill.skillId);
      if (!exists && p.selectedSkills.length >= 5) return p;
      return { ...p, selectedSkills: exists ? p.selectedSkills.filter((s) => s.skillId !== skill.skillId) : [...p.selectedSkills, skill] };
    });

  const toggleCustomSkill = (skill: WorkflowSkill) =>
    setCustomStep1((p) => {
      const exists = p.selectedSkills.some((s) => s.skillId === skill.skillId);
      if (!exists && p.selectedSkills.length >= 5) return p;
      return { ...p, selectedSkills: exists ? p.selectedSkills.filter((s) => s.skillId !== skill.skillId) : [...p.selectedSkills, skill] };
    });

  const isCustomFlow = step === "custom-1";

  // Validation
  const validateAi1 = () => {
    const e: AiStep1Errors = {};
    if (!aiStep1.name.trim())     e.name     = "Assessment name is required";
    if (!aiStep1.jobTitle.trim()) e.jobTitle = "Job title is required";
    setAiStep1Errors(e); return Object.keys(e).length === 0;
  };
  const validateAi2 = () => {
    const e: AiStep2Errors = {};
    if (!aiStep2.questionSetType) e.questionSetType = "Please select a question set type";
    setAiStep2Errors(e); return Object.keys(e).length === 0;
  };
  const validateCustom1 = () => {
    const e: CustomStep1Errors = {};
    if (!customStep1.name.trim()) e.name = "Assessment name is required";
    setCustomStep1Errors(e); return Object.keys(e).length === 0;
  };

  // Handlers
  const handleAiCreate = async () => {
    if (!validateAi2()) return;
    await onCreate({
      name:            aiStep1.name.trim(),
      assessmentType:  "AI Powered Assessment",
      description:     "",
      creationMethod:  "ai",
      jobTitle:        aiStep1.jobTitle.trim(),
      jobDescription:  aiStep1.jobDescription.trim(),
      roleType:        aiStep1.roleType,
      experienceRange: aiStep1.experienceRange,
      skills:          aiStep1.selectedSkills.map((s) => s.skillId),
      questionSetType: aiStep2.questionSetType,
      totalMarks:      aiStep2.totalMarks ? Number(aiStep2.totalMarks) : undefined,
      passMarks:       aiStep2.passMarks  ? Number(aiStep2.passMarks)  : undefined,
      duration:        aiStep2.duration   ? Number(aiStep2.duration)   : undefined,
      difficulty:      aiStep2.difficulty,
    });
    setStep("success");
  };

  const handleCustomSaveAndContinue = async () => {
    if (!validateCustom1() || saving) return;
    const assessmentId = await onCreate({
      name:            customStep1.name.trim(),
      assessmentType:  "Customized Assessment",
      description:     "",
      creationMethod:  "custom",
      jobTitle:        customStep1.jobTitle.trim() || undefined,
      roleType:        customStep1.roleType        || undefined,
      experienceRange: customStep1.experienceRange || undefined,
      skills:          customStep1.selectedSkills.map((s) => s.skillId),
      totalMarks:      customStep1.totalMarks ? Number(customStep1.totalMarks) : undefined,
      passMarks:       customStep1.passMarks  ? Number(customStep1.passMarks)  : undefined,
      duration:        customStep1.duration   ? Number(customStep1.duration)   : undefined,
      difficulty:      customStep1.difficulty || undefined,
    });
    if (assessmentId) {
      handleClose();
      router.push(`/whitecollar/assessments/${assessmentId}/build`);
    }
  };

  const aiStepNum  = step === "ai-1" ? 1 : 2;
  const aiSubtitle = step === "ai-1" ? "Assessment details" : "Set question preferences";

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
        <DialogContent className="max-h-[90vh] max-w-[580px] overflow-y-auto p-0" showCloseButton>

          {step === "success" && (
            <SuccessScreen onClose={handleClose} onAssign={handleClose} />
          )}

          {step === "options" && (
            <AssessmentOptionsStep
              selected={methodChoice} onSelect={setMethodChoice}
              onCancel={handleClose}
              onContinue={() => setStep(methodChoice === "ai" ? "ai-1" : "custom-1")}
            />
          )}

          {step === "ai-1" && (
            <>
              <DialogHeader className="border-b border-neutral-200 px-6 py-4">
                <DialogTitle className="text-[16px] font-semibold">AI Powered Assessment</DialogTitle>
                <p className="text-[12px] text-[#9a9a9a]">Step {aiStepNum} of 2 · {aiSubtitle}</p>
                <ProgressBar step={aiStepNum} total={2} />
              </DialogHeader>
              <div className="py-5">
                <AiStep1Content form={aiStep1} errors={aiStep1Errors}
                  onOpenSkillPicker={() => setSkillPickerOpen(true)}
                  onChange={(k, v) => {
                    setAiStep1((p) => ({ ...p, [k]: v }));
                    const ek = k as "name" | "jobTitle";
                    if (ek === "name" || ek === "jobTitle")
                      setAiStep1Errors((p) => { const n = { ...p }; delete n[ek]; return n; });
                  }}
                  onRemoveSkill={(id) => setAiStep1((p) => ({ ...p, selectedSkills: p.selectedSkills.filter((s) => s.skillId !== id) }))}
                />
              </div>
              <div className="flex items-center justify-between border-t border-neutral-200 px-6 py-4">
                <Button variant="outline" onClick={() => setStep("options")} disabled={saving}>Back</Button>
                <Button className="bg-[#ff5723] text-white hover:bg-[#f04d1d]"
                  onClick={() => { if (validateAi1()) setStep("ai-2"); }} disabled={saving}>Continue</Button>
              </div>
            </>
          )}

          {step === "ai-2" && (
            <>
              <DialogHeader className="border-b border-neutral-200 px-6 py-4">
                <DialogTitle className="text-[16px] font-semibold">AI Powered Assessment</DialogTitle>
                <p className="text-[12px] text-[#9a9a9a]">Step {aiStepNum} of 2 · {aiSubtitle}</p>
                <ProgressBar step={aiStepNum} total={2} />
              </DialogHeader>
              <div className="py-5">
                <AiStep2Content form={aiStep2} errors={aiStep2Errors}
                  onChange={(k, v) => {
                    setAiStep2((p) => ({ ...p, [k]: v }));
                    setAiStep2Errors((p) => { const n = { ...p }; delete n[k]; return n; });
                  }}
                />
              </div>
              <div className="flex items-center justify-between border-t border-neutral-200 px-6 py-4">
                <Button variant="outline" onClick={() => setStep("ai-1")} disabled={saving}>Back</Button>
                <Button className="bg-[#ff5723] text-white hover:bg-[#f04d1d]"
                  onClick={handleAiCreate} disabled={saving}>
                  {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating…</> : "Create Assessment"}
                </Button>
              </div>
            </>
          )}

          {step === "custom-1" && (
            <>
              <DialogHeader className="border-b border-neutral-200 px-6 py-4">
                <DialogTitle className="text-[16px] font-semibold">Customized Assessment</DialogTitle>
                <p className="text-[12px] text-[#9a9a9a]">Step 1 of 4 · Assessment details</p>
                <ProgressBar step={1} total={4} />
              </DialogHeader>
              <div className="py-5">
                <CustomStep1Content form={customStep1} errors={customStep1Errors}
                  onOpenSkillPicker={() => setSkillPickerOpen(true)}
                  onChange={(k, v) => {
                    setCustomStep1((p) => ({ ...p, [k]: v }));
                    if (k === "name") setCustomStep1Errors((p) => { const n = { ...p }; delete n.name; return n; });
                  }}
                  onRemoveSkill={(id) => setCustomStep1((p) => ({ ...p, selectedSkills: p.selectedSkills.filter((s) => s.skillId !== id) }))}
                />
              </div>
              <div className="flex items-center justify-between border-t border-neutral-200 px-6 py-4">
                <Button variant="outline" onClick={() => setStep("options")} disabled={saving}>Back</Button>
                <Button className="bg-[#ff5723] text-white hover:bg-[#f04d1d]"
                  onClick={handleCustomSaveAndContinue} disabled={saving}>
                  {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : "Save & Continue"}
                </Button>
              </div>
            </>
          )}

        </DialogContent>
      </Dialog>

      <SkillPickerDialog
        open={skillPickerOpen}
        selectedSkills={isCustomFlow ? customStep1.selectedSkills : aiStep1.selectedSkills}
        onClose={() => setSkillPickerOpen(false)}
        onToggle={isCustomFlow ? toggleCustomSkill : toggleAiSkill}
      />
    </>
  );
}
