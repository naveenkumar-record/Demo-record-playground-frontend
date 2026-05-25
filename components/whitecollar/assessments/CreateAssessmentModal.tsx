"use client";

import { useState, useEffect, useRef } from "react";
import { Sparkles, AlignLeft, Search, Plus, X, Loader2, Check } from "lucide-react";
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

// ── Options ───────────────────────────────────────────────────────────────────

const ROLE_TYPES         = ["Full-time", "Part-time", "Contract", "Internship", "Freelance"];
const EXPERIENCE_RANGES  = ["0–1 years", "1–3 years", "3–5 years", "5–8 years", "8+ years"];
const QUESTION_SET_TYPES = ["Multiple Choice", "Short Answer", "Mixed", "Coding Challenge", "Essay"];
const DIFFICULTIES       = ["Easy", "Medium", "Hard", "Expert"];
const CUSTOM_TYPES       = ["Technical Screen", "Behavioral Interview", "Cognitive Test", "Domain Knowledge", "Custom"];

// ── Public result type ────────────────────────────────────────────────────────

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
  onCreate: (data: CreateAssessmentResult) => Promise<void>;
};

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
  open,
  selectedSkills,
  onClose,
  onToggle,
}: {
  open:           boolean;
  selectedSkills: WorkflowSkill[];
  onClose:        () => void;
  onToggle:       (skill: WorkflowSkill) => void;
}) {
  const [query, setQuery]         = useState("");
  const [results, setResults]     = useState<WorkflowSkill[]>([]);
  const [searching, setSearching] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!open) { setQuery(""); setResults([]); }
  }, [open]);

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

  const isSelected = (skill: WorkflowSkill) =>
    selectedSkills.some((s) => s.skillId === skill.skillId);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[500px] p-0" showCloseButton>
        <DialogHeader className="border-b border-neutral-200 px-5 py-4">
          <DialogTitle className="text-[16px] font-semibold">Add Skills</DialogTitle>
          <p className="text-[12px] text-[#7a7a7a]">
            Search and select up to 5 skills for this assessment.
          </p>
        </DialogHeader>

        <div className="space-y-4 px-5 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              autoFocus
              placeholder="Search skills…"
              className="pl-9 text-[13px]"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="min-h-44 overflow-hidden rounded-md border border-neutral-200">
            {query.trim().length < 2 ? (
              <p className="px-4 py-8 text-center text-[13px] text-[#8a8a8a]">
                Type at least 2 characters to search skills.
              </p>
            ) : searching ? (
              <p className="px-4 py-8 text-center text-[13px] text-[#8a8a8a]">Searching…</p>
            ) : results.length === 0 ? (
              <p className="px-4 py-8 text-center text-[13px] text-[#8a8a8a]">No skills found.</p>
            ) : (
              <div className="max-h-64 overflow-y-auto">
                {results.map((skill) => (
                  <label
                    key={skill.skillId}
                    className="flex cursor-pointer items-center gap-3 border-b border-neutral-100 px-4 py-3 last:border-b-0 hover:bg-neutral-50"
                  >
                    <Checkbox
                      checked={isSelected(skill)}
                      onCheckedChange={() => {
                        if (!isSelected(skill) && selectedSkills.length >= 5) return;
                        onToggle(skill);
                      }}
                    />
                    <span className="flex-1 text-[13px] font-medium text-[#1f1f1f]">
                      {skill.name}
                    </span>
                    <span className="text-[11px] text-[#9a9a9a]">{skill.skillId}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-[12px] text-[#8a8a8a]">
            <span>{selectedSkills.length} of 5 selected</span>
            <Button className="bg-[#ff5723] text-white hover:bg-[#f04d1d]" onClick={onClose}>
              Done
            </Button>
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

// ── Step 0 — Assessment Options ───────────────────────────────────────────────

function AssessmentOptionsStep({
  selected,
  onSelect,
  onCancel,
  onContinue,
}: {
  selected:   "ai" | "custom";
  onSelect:   (m: "ai" | "custom") => void;
  onCancel:   () => void;
  onContinue: () => void;
}) {
  return (
    <>
      <DialogHeader className="border-b border-neutral-200 px-6 py-4">
        <DialogTitle className="text-[16px] font-semibold">Assessment options</DialogTitle>
        <p className="text-[12px] text-[#8a8a8a]">
          Select how you'd like to create your assessment, automatically generated or fully customized.
        </p>
      </DialogHeader>

      <div className="space-y-3 px-6 py-5">
        {/* AI Powered */}
        <button
          type="button"
          onClick={() => onSelect("ai")}
          className={cn(
            "flex w-full items-start gap-4 rounded-xl border-2 p-4 text-left transition-all",
            selected === "ai"
              ? "border-[#ff5723] bg-orange-50"
              : "border-neutral-200 bg-white hover:border-neutral-300",
          )}
        >
          <span
            className={cn(
              "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
              selected === "ai" ? "bg-orange-100" : "bg-neutral-100",
            )}
          >
            <Sparkles
              className={cn("h-5 w-5", selected === "ai" ? "text-[#ff5723]" : "text-neutral-400")}
            />
          </span>
          <div>
            <p
              className={cn(
                "text-[14px] font-semibold",
                selected === "ai" ? "text-[#ff5723]" : "text-[#1f1f1f]",
              )}
            >
              AI Powered Assessment
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-[#8a8a8a]">
              Enter job details, role, experience, and skills. The system generates tailored Q&A sets,
              same for all or unique per candidate.
            </p>
          </div>
        </button>

        {/* Customized */}
        <button
          type="button"
          onClick={() => onSelect("custom")}
          className={cn(
            "flex w-full items-start gap-4 rounded-xl border-2 p-4 text-left transition-all",
            selected === "custom"
              ? "border-[#ff5723] bg-orange-50"
              : "border-neutral-200 bg-white hover:border-neutral-300",
          )}
        >
          <span
            className={cn(
              "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
              selected === "custom" ? "bg-orange-100" : "bg-neutral-100",
            )}
          >
            {/* Document icon */}
            <svg
              className={cn("h-5 w-5", selected === "custom" ? "text-[#ff5723]" : "text-neutral-400")}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </span>
          <div>
            <p
              className={cn(
                "text-[14px] font-semibold",
                selected === "custom" ? "text-[#ff5723]" : "text-[#1f1f1f]",
              )}
            >
              Customized Assessment
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-[#8a8a8a]">
              Manually create your own questions and scenarios to match specific job needs or unique
              evaluation criteria.
            </p>
          </div>
        </button>
      </div>

      <div className="flex items-center justify-between border-t border-neutral-200 px-6 py-4">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button className="bg-[#ff5723] text-white hover:bg-[#f04d1d]" onClick={onContinue}>
          Continue
        </Button>
      </div>
    </>
  );
}

// ── Step 1 — AI: Assessment Details ──────────────────────────────────────────

type AiStep1Form = {
  name:            string;
  jobTitle:        string;
  jobDescription:  string;
  roleType:        string;
  experienceRange: string;
  selectedSkills:  WorkflowSkill[];
};
type AiStep1Errors = Partial<Record<"name" | "jobTitle", string>>;

function AiStep1Content({
  form,
  errors,
  onOpenSkillPicker,
  onChange,
  onRemoveSkill,
}: {
  form:             AiStep1Form;
  errors:           AiStep1Errors;
  onOpenSkillPicker: () => void;
  onChange:         <K extends keyof AiStep1Form>(k: K, v: AiStep1Form[K]) => void;
  onRemoveSkill:    (id: string) => void;
}) {
  return (
    <div className="space-y-5 px-6 pb-2">
      {/* Assessment Name + Job Title */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-[13px] font-medium text-[#3a3a3a]">
            Assessment Name <span className="text-red-500">*</span>
          </Label>
          <Input
            placeholder="eg: Frontend Developer Assess…"
            value={form.name}
            onChange={(e) => onChange("name", e.target.value)}
            className={cn("text-[13px]", errors.name && "border-red-400 focus-visible:border-red-400")}
          />
          {errors.name && <p className="text-[11px] text-red-500">{errors.name}</p>}
        </div>

        <div className="space-y-1.5">
          <Label className="text-[13px] font-medium text-[#3a3a3a]">
            Job Title <span className="text-red-500">*</span>
          </Label>
          <Input
            placeholder="eg: Frontend Developer"
            value={form.jobTitle}
            onChange={(e) => onChange("jobTitle", e.target.value)}
            className={cn("text-[13px]", errors.jobTitle && "border-red-400 focus-visible:border-red-400")}
          />
          {errors.jobTitle && <p className="text-[11px] text-red-500">{errors.jobTitle}</p>}
        </div>
      </div>

      {/* Job Description */}
      <div className="space-y-1.5">
        <Label className="text-[13px] font-medium text-[#3a3a3a]">Job Description</Label>
        <div className="relative">
          <AlignLeft className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
          <Textarea
            placeholder="eg: Hiring candidates with strong role fundamentals practical thinking and execution ability."
            className="min-h-[120px] resize-none pl-9 text-[13px]"
            maxLength={1500}
            value={form.jobDescription}
            onChange={(e) => onChange("jobDescription", e.target.value)}
          />
        </div>
        <div className="flex justify-end text-[11px] text-[#9a9a9a]">
          {form.jobDescription.length}/1500
        </div>
      </div>

      {/* Role Type + Experience Range */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-[13px] font-medium text-[#3a3a3a]">Role Type</Label>
          <div className="w-full">
            <Select value={form.roleType} onValueChange={(v) => onChange("roleType", v)}>
              <SelectTrigger className="h-10 w-full rounded-xl border-0 bg-neutral-100 text-[13px] text-[#9a9a9a] shadow-none focus:ring-0 focus:ring-offset-0 data-[placeholder]:text-[#9a9a9a]">
                <SelectValue placeholder="Select role type" />
              </SelectTrigger>
              <SelectContent position="popper" className="w-[--radix-select-trigger-width]">
                {ROLE_TYPES.map((r) => (
                  <SelectItem key={r} value={r} className="text-[13px]">{r}</SelectItem>
                ))}
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
                {EXPERIENCE_RANGES.map((r) => (
                  <SelectItem key={r} value={r} className="text-[13px]">{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Skills */}
      <div className="space-y-2">
        <Label className="text-[13px] font-medium text-[#3a3a3a]">Skills</Label>

        {form.selectedSkills.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {form.selectedSkills.map((skill) => (
              <span
                key={skill.skillId}
                className="flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-[12px] font-medium text-[#3a3a3a]"
              >
                {skill.name}
                <button
                  type="button"
                  onClick={() => onRemoveSkill(skill.skillId)}
                  className="ml-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full text-neutral-400 hover:text-neutral-700"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        <Button
          type="button"
          size="sm"
          disabled={form.selectedSkills.length >= 5}
          onClick={onOpenSkillPicker}
          className="h-9 gap-1.5 rounded-full bg-[#ff5723] px-4 text-[13px] font-semibold text-white hover:bg-[#f04d1d] disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" />
          Add skills
        </Button>

        <p className="text-[11px] text-[#9a9a9a]">You can add up to 5 skills per workflow.</p>
      </div>
    </div>
  );
}

// ── Step 2 — AI: Question Preferences ────────────────────────────────────────

type AiStep2Form = {
  questionSetType: string;
  totalMarks:      string;
  duration:        string;
  passMarks:       string;
  difficulty:      string;
};
type AiStep2Errors = Partial<Record<keyof AiStep2Form, string>>;

function AiStep2Content({
  form,
  errors,
  onChange,
}: {
  form:    AiStep2Form;
  errors:  AiStep2Errors;
  onChange: <K extends keyof AiStep2Form>(k: K, v: AiStep2Form[K]) => void;
}) {
  return (
    <div className="space-y-5 px-6 pb-2">
      {/* Question Set Type */}
      <div className="space-y-1.5">
        <Label className="text-[13px] font-medium text-[#3a3a3a]">
          Question Set Type <span className="text-red-500">*</span>
        </Label>
        <Select value={form.questionSetType} onValueChange={(v) => onChange("questionSetType", v)}>
          <SelectTrigger className={cn("h-10 w-full rounded-xl border-0 bg-neutral-100 text-[13px] text-[#9a9a9a] shadow-none focus:ring-0 focus:ring-offset-0 data-[placeholder]:text-[#9a9a9a]", errors.questionSetType && "ring-1 ring-red-400")}>
            <SelectValue placeholder="Select Question Set Type" />
          </SelectTrigger>
          <SelectContent>
            {QUESTION_SET_TYPES.map((t) => (
              <SelectItem key={t} value={t} className="text-[13px]">{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.questionSetType && <p className="text-[11px] text-red-500">{errors.questionSetType}</p>}
      </div>

      {/* Total Marks + Duration */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-[13px] font-medium text-[#3a3a3a]">Total Marks</Label>
          <Input
            type="number"
            placeholder="eg: 100"
            value={form.totalMarks}
            className="text-[13px]"
            onChange={(e) => onChange("totalMarks", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[13px] font-medium text-[#3a3a3a]">Duration</Label>
          <Input
            placeholder="eg: 75 mins"
            value={form.duration}
            className="text-[13px]"
            onChange={(e) => onChange("duration", e.target.value)}
          />
        </div>
      </div>

      {/* Pass Marks + Difficulty */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-[13px] font-medium text-[#3a3a3a]">Pass Marks</Label>
          <Input
            placeholder="eg: 65/100"
            value={form.passMarks}
            className="text-[13px]"
            onChange={(e) => onChange("passMarks", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[13px] font-medium text-[#3a3a3a]">Difficulty</Label>
          <Select value={form.difficulty} onValueChange={(v) => onChange("difficulty", v)}>
            <SelectTrigger className="h-10 w-full rounded-xl border-0 bg-neutral-100 text-[13px] text-[#9a9a9a] shadow-none focus:ring-0 focus:ring-offset-0 data-[placeholder]:text-[#9a9a9a]">
              <SelectValue placeholder="Select Difficulty level" />
            </SelectTrigger>
            <SelectContent position="popper" className="w-[--radix-select-trigger-width]">
              {DIFFICULTIES.map((d) => (
                <SelectItem key={d} value={d} className="text-[13px]">{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

// ── Custom step ───────────────────────────────────────────────────────────────

type CustomForm   = { name: string; assessmentType: string; description: string };
type CustomErrors = Partial<CustomForm>;

function CustomStepContent({
  form,
  errors,
  onChange,
}: {
  form:    CustomForm;
  errors:  CustomErrors;
  onChange: <K extends keyof CustomForm>(k: K, v: CustomForm[K]) => void;
}) {
  return (
    <div className="space-y-5 px-6 pb-2">
      <div className="space-y-1.5">
        <Label className="text-[13px] font-medium text-[#3a3a3a]">
          Assessment Name <span className="text-red-500">*</span>
        </Label>
        <Input
          placeholder="eg: Senior Software Engineer Screen"
          value={form.name}
          onChange={(e) => onChange("name", e.target.value)}
          className={cn("text-[13px]", errors.name && "border-red-400 focus-visible:border-red-400")}
        />
        {errors.name && <p className="text-[11px] text-red-500">{errors.name}</p>}
      </div>

      <div className="space-y-1.5">
        <Label className="text-[13px] font-medium text-[#3a3a3a]">
          Assessment Type <span className="text-red-500">*</span>
        </Label>
        <Select value={form.assessmentType} onValueChange={(v) => onChange("assessmentType", v)}>
          <SelectTrigger className={cn("h-10 w-full rounded-xl border-0 bg-neutral-100 text-[13px] text-[#9a9a9a] shadow-none focus:ring-0 focus:ring-offset-0 data-[placeholder]:text-[#9a9a9a]", errors.assessmentType && "ring-1 ring-red-400 bg-red-50")}>
            <SelectValue placeholder="Select a type" />
          </SelectTrigger>
          <SelectContent>
            {CUSTOM_TYPES.map((t) => (
              <SelectItem key={t} value={t} className="text-[13px]">{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.assessmentType && <p className="text-[11px] text-red-500">{errors.assessmentType}</p>}
      </div>

      <div className="space-y-1.5">
        <Label className="text-[13px] font-medium text-[#3a3a3a]">
          Description{" "}
          <span className="text-[12px] font-normal text-[#9a9a9a]">(optional)</span>
        </Label>
        <Textarea
          placeholder="Describe the purpose and scope of this assessment…"
          className="min-h-[100px] resize-none text-[13px]"
          maxLength={500}
          value={form.description}
          onChange={(e) => onChange("description", e.target.value)}
        />
        <div className="flex justify-end text-[11px] text-[#9a9a9a]">
          {form.description.length}/500
        </div>
      </div>
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────

type FlowStep = "options" | "ai-1" | "ai-2" | "custom" | "success";

export default function CreateAssessmentModal({ open, saving, onClose, onCreate }: Props) {
  const [step, setStep]               = useState<FlowStep>("options");
  const [methodChoice, setMethodChoice] = useState<"ai" | "custom">("ai");
  const [skillPickerOpen, setSkillPickerOpen] = useState(false);

  // AI form
  const [aiStep1, setAiStep1] = useState<AiStep1Form>({
    name: "", jobTitle: "", jobDescription: "",
    roleType: "", experienceRange: "", selectedSkills: [],
  });
  const [aiStep1Errors, setAiStep1Errors] = useState<AiStep1Errors>({});

  const [aiStep2, setAiStep2] = useState<AiStep2Form>({
    questionSetType: "", totalMarks: "", duration: "", passMarks: "", difficulty: "",
  });
  const [aiStep2Errors, setAiStep2Errors] = useState<AiStep2Errors>({});

  // Custom form
  const [customForm, setCustomForm]   = useState<CustomForm>({ name: "", assessmentType: "", description: "" });
  const [customErrors, setCustomErrors] = useState<CustomErrors>({});

  // ── Reset ─────────────────────────────────────────────────────────────────
  const resetAll = () => {
    setStep("options"); setMethodChoice("ai"); setSkillPickerOpen(false);
    setAiStep1({ name: "", jobTitle: "", jobDescription: "", roleType: "", experienceRange: "", selectedSkills: [] });
    setAiStep1Errors({});
    setAiStep2({ questionSetType: "", totalMarks: "", duration: "", passMarks: "", difficulty: "" });
    setAiStep2Errors({});
    setCustomForm({ name: "", assessmentType: "", description: "" }); setCustomErrors({});
  };
  const handleClose = () => { resetAll(); onClose(); };

  // ── Skill helpers ─────────────────────────────────────────────────────────
  const toggleSkill = (skill: WorkflowSkill) => {
    setAiStep1((prev) => {
      const exists = prev.selectedSkills.some((s) => s.skillId === skill.skillId);
      if (!exists && prev.selectedSkills.length >= 5) return prev;
      return {
        ...prev,
        selectedSkills: exists
          ? prev.selectedSkills.filter((s) => s.skillId !== skill.skillId)
          : [...prev.selectedSkills, skill],
      };
    });
  };
  const removeSkill = (id: string) =>
    setAiStep1((p) => ({ ...p, selectedSkills: p.selectedSkills.filter((s) => s.skillId !== id) }));

  // ── Validation ────────────────────────────────────────────────────────────
  const validateAi1 = () => {
    const e: AiStep1Errors = {};
    if (!aiStep1.name.trim())     e.name     = "Assessment name is required";
    if (!aiStep1.jobTitle.trim()) e.jobTitle = "Job title is required";
    setAiStep1Errors(e);
    return Object.keys(e).length === 0;
  };
  const validateAi2 = () => {
    const e: AiStep2Errors = {};
    if (!aiStep2.questionSetType) e.questionSetType = "Please select a question set type";
    setAiStep2Errors(e);
    return Object.keys(e).length === 0;
  };
  const validateCustom = () => {
    const e: CustomErrors = {};
    if (!customForm.name.trim())    e.name           = "Assessment name is required";
    if (!customForm.assessmentType) e.assessmentType = "Please select a type";
    setCustomErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Navigation ────────────────────────────────────────────────────────────
  const handleOptionsContinue = () => {
    setStep(methodChoice === "ai" ? "ai-1" : "custom");
  };

  const handleAiCreate = async () => {
    if (!validateAi2()) return;
    await onCreate({
      name: aiStep1.name.trim(), assessmentType: "AI Powered Assessment", description: "",
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

  const handleCustomCreate = async () => {
    if (!validateCustom()) return;
    await onCreate({
      name: customForm.name.trim(), assessmentType: "Customized Assessment",
      description: customForm.description.trim(), creationMethod: "custom",
    });
    setStep("success");
  };

  // ── Header for ai steps ───────────────────────────────────────────────────
  const aiStepNum  = step === "ai-1" ? 1 : 2;
  const aiSubtitle = step === "ai-1" ? "Assessment details" : "Set question preferences";

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
        <DialogContent className="max-h-[90vh] max-w-[560px] overflow-y-auto p-0" showCloseButton>

          {/* ── Success ── */}
          {step === "success" && (
            <SuccessScreen onClose={handleClose} onAssign={handleClose} />
          )}

          {/* ── Options ── */}
          {step === "options" && (
            <AssessmentOptionsStep
              selected={methodChoice}
              onSelect={setMethodChoice}
              onCancel={handleClose}
              onContinue={handleOptionsContinue}
            />
          )}

          {/* ── AI Step 1 ── */}
          {step === "ai-1" && (
            <>
              <DialogHeader className="border-b border-neutral-200 px-6 py-4">
                <DialogTitle className="text-[16px] font-semibold">AI Powered Assessment</DialogTitle>
                <p className="text-[12px] text-[#9a9a9a]">
                  Step {aiStepNum} of 2 · {aiSubtitle}
                </p>
                <ProgressBar step={aiStepNum} total={2} />
              </DialogHeader>

              <div className="py-5">
                <AiStep1Content
                  form={aiStep1}
                  errors={aiStep1Errors}
                  onOpenSkillPicker={() => setSkillPickerOpen(true)}
                  onChange={(k, v) => {
                    setAiStep1((p) => ({ ...p, [k]: v }));
                    const errKey = k as "name" | "jobTitle";
                    if (errKey === "name" || errKey === "jobTitle") {
                      setAiStep1Errors((p) => { const n = { ...p }; delete n[errKey]; return n; });
                    }
                  }}
                  onRemoveSkill={removeSkill}
                />
              </div>

              <div className="flex items-center justify-between border-t border-neutral-200 px-6 py-4">
                <Button variant="outline" onClick={() => setStep("options")} disabled={saving}>Back</Button>
                <Button
                  className="bg-[#ff5723] text-white hover:bg-[#f04d1d]"
                  onClick={() => { if (validateAi1()) setStep("ai-2"); }}
                  disabled={saving}
                >
                  Continue
                </Button>
              </div>
            </>
          )}

          {/* ── AI Step 2 ── */}
          {step === "ai-2" && (
            <>
              <DialogHeader className="border-b border-neutral-200 px-6 py-4">
                <DialogTitle className="text-[16px] font-semibold">AI Powered Assessment</DialogTitle>
                <p className="text-[12px] text-[#9a9a9a]">
                  Step {aiStepNum} of 2 · {aiSubtitle}
                </p>
                <ProgressBar step={aiStepNum} total={2} />
              </DialogHeader>

              <div className="py-5">
                <AiStep2Content
                  form={aiStep2}
                  errors={aiStep2Errors}
                  onChange={(k, v) => {
                    setAiStep2((p) => ({ ...p, [k]: v }));
                    setAiStep2Errors((p) => { const n = { ...p }; delete n[k]; return n; });
                  }}
                />
              </div>

              <div className="flex items-center justify-between border-t border-neutral-200 px-6 py-4">
                <Button variant="outline" onClick={() => setStep("ai-1")} disabled={saving}>Back</Button>
                <Button
                  className="bg-[#ff5723] text-white hover:bg-[#f04d1d]"
                  onClick={handleAiCreate}
                  disabled={saving}
                >
                  {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating…</> : "Create Assessment"}
                </Button>
              </div>
            </>
          )}

          {/* ── Custom ── */}
          {step === "custom" && (
            <>
              <DialogHeader className="border-b border-neutral-200 px-6 py-4">
                <DialogTitle className="text-[16px] font-semibold">Customized Assessment</DialogTitle>
                <p className="text-[12px] text-[#9a9a9a]">Fill in the details to create your assessment.</p>
              </DialogHeader>

              <div className="py-5">
                <CustomStepContent
                  form={customForm}
                  errors={customErrors}
                  onChange={(k, v) => {
                    setCustomForm((p) => ({ ...p, [k]: v }));
                    setCustomErrors((p) => { const n = { ...p }; delete n[k]; return n; });
                  }}
                />
              </div>

              <div className="flex items-center justify-between border-t border-neutral-200 px-6 py-4">
                <Button variant="outline" onClick={() => setStep("options")} disabled={saving}>Back</Button>
                <Button
                  className="bg-[#ff5723] text-white hover:bg-[#f04d1d]"
                  onClick={handleCustomCreate}
                  disabled={saving}
                >
                  {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating…</> : "Create Assessment"}
                </Button>
              </div>
            </>
          )}

        </DialogContent>
      </Dialog>

      {/* Skill picker — separate dialog so it layers above the main one */}
      <SkillPickerDialog
        open={skillPickerOpen}
        selectedSkills={aiStep1.selectedSkills}
        onClose={() => setSkillPickerOpen(false)}
        onToggle={toggleSkill}
      />
    </>
  );
}
