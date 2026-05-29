"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft, Plus, Trash2, Check, Pencil,
} from "lucide-react";
import { toast } from "sonner";

import { useOrg }   from "@/components/layout/orgContext";
import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Label }    from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import {
  getAssessmentById,
  updateAssessment,
  type AssessmentItem,
  type AssessmentSection,
  type SectionType,
  type SectionQuestion,
  type SectionAnswer,
  type CodingProblem,
  type TestCase,
} from "@/api/assessment.api";

function getToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("auth_access_token") ?? "";
}

// ── Constants ─────────────────────────────────────────────────────────────────

const SECTION_LABELS: Record<SectionType, string> = {
  single_choice: "Single Choice",
  short_answer:  "Short Answer",
  long_answer:   "Long Answer",
  true_false:    "True / False",
};

const POINT_OPTIONS  = [1, 2, 3, 4, 5, 10, 15, 20, 25, 50];
const LANGUAGES      = ["Python", "JavaScript", "Java", "C++", "C#", "Go", "Ruby", "PHP", "Swift"];
const MARKS_OPTIONS  = [1, 2, 3, 4, 5, 10, 15, 20, 25, 50, 100];

// ── Local types ───────────────────────────────────────────────────────────────

type LocalAnswer   = { id: string; text: string; isCorrect: boolean };
type LocalQuestion = { id: string; text: string; marks: number; answers: LocalAnswer[] };
type LocalSection  = {
  id: string; sectionType: SectionType; pointsPerQuestion: number; questions: LocalQuestion[];
};
type LocalTestCase = { id: string; input: string; expectedOutput: string; explanation: string };
type LocalProblem  = {
  id: string; title: string; marks: number; allowedLanguages: string[];
  problemStatement: string; sampleInput: string; sampleOutput: string;
  solutionLanguage: string; solutionCode: string; solutionExplanation: string;
  testCases: LocalTestCase[];
};

function uid() { return Math.random().toString(36).slice(2, 10); }

function defaultAnswers(type: SectionType): LocalAnswer[] {
  if (type === "true_false")  return [{ id: uid(), text: "True", isCorrect: false }, { id: uid(), text: "False", isCorrect: false }];
  if (type === "single_choice") return [{ id: uid(), text: "", isCorrect: false }, { id: uid(), text: "", isCorrect: false }];
  return [{ id: uid(), text: "", isCorrect: false }];
}

function newQuestion(type: SectionType, pts: number): LocalQuestion {
  return { id: uid(), text: "", marks: pts, answers: defaultAnswers(type) };
}

function newSection(): LocalSection {
  return { id: uid(), sectionType: "single_choice", pointsPerQuestion: 1, questions: [newQuestion("single_choice", 1)] };
}

function newProblem(): LocalProblem {
  return {
    id: uid(), title: "", marks: 1, allowedLanguages: ["Python"],
    problemStatement: "", sampleInput: "", sampleOutput: "",
    solutionLanguage: "Python", solutionCode: "", solutionExplanation: "",
    testCases: [],
  };
}

// serialise
function toApiSection(s: LocalSection): AssessmentSection {
  return {
    sectionId: s.id, sectionType: s.sectionType, pointsPerQuestion: s.pointsPerQuestion,
    questions: s.questions.map((q): SectionQuestion => ({
      questionId: q.id, questionText: q.text, marks: q.marks,
      answers: q.answers.map((a): SectionAnswer => ({ answerId: a.id, answerText: a.text, isCorrect: a.isCorrect })),
    })),
  };
}

function toApiProblem(p: LocalProblem): CodingProblem {
  return {
    problemId: p.id, title: p.title, marks: p.marks,
    allowedLanguages: p.allowedLanguages, problemStatement: p.problemStatement,
    sampleInput: p.sampleInput, sampleOutput: p.sampleOutput,
    solutionLanguage: p.solutionLanguage, solutionCode: p.solutionCode,
    solutionExplanation: p.solutionExplanation,
    testCases: p.testCases.map((t): TestCase => ({ input: t.input, expectedOutput: t.expectedOutput, explanation: t.explanation })),
  };
}

function fromApiSection(s: AssessmentSection): LocalSection {
  return {
    id: s.sectionId, sectionType: s.sectionType, pointsPerQuestion: s.pointsPerQuestion,
    questions: s.questions.map((q) => ({
      id: q.questionId, text: q.questionText, marks: q.marks ?? s.pointsPerQuestion,
      answers: q.answers.map((a) => ({ id: a.answerId, text: a.answerText, isCorrect: a.isCorrect })),
    })),
  };
}

function fromApiProblem(p: CodingProblem): LocalProblem {
  return {
    id: p.problemId, title: p.title, marks: p.marks,
    allowedLanguages: p.allowedLanguages,
    problemStatement: p.problemStatement, sampleInput: p.sampleInput, sampleOutput: p.sampleOutput,
    solutionLanguage: p.solutionLanguage, solutionCode: p.solutionCode,
    solutionExplanation: p.solutionExplanation,
    testCases: p.testCases.map((t) => ({ id: uid(), ...t })),
  };
}

// ── Stepper ───────────────────────────────────────────────────────────────────

const STEPS = [
  { n: 1, label: "Assessment Details" },
  { n: 2, label: "Knowledge Assessment" },
  { n: 3, label: "Skill Assessment" },
  { n: 4, label: "Review & Publish" },
];

function BuildStepper({ current }: { current: number }) {
  return (
    <div className="flex items-start justify-center">
      {STEPS.map((s, i) => {
        const done   = s.n < current;
        const active = s.n === current;
        return (
          <div key={s.n} className="flex items-start">
            {/* Step column: circle + label */}
            <div className="flex flex-col items-center gap-2" style={{ width: 148 }}>
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full border-2 text-[13px] font-bold transition-all"
                style={
                  done   ? { background: "#111", borderColor: "#111", color: "#fff" } :
                  active ? { background: "#fff", borderColor: "#ff5723", color: "#ff5723" } :
                           { background: "#fff", borderColor: "#d4d4d4", color: "#aaa" }
                }
              >
                {done ? <Check className="h-5 w-5" strokeWidth={3} /> : s.n}
              </div>
              <p className={cn(
                "text-center text-[12px] leading-tight",
                active ? "font-semibold text-[#1a1a1a]" :
                done   ? "font-medium text-[#3a3a3a]" :
                         "text-[#aaa]",
              )}>
                {s.label}
              </p>
            </div>

            {/* Connector — marginTop 20px = circle center (circle h=40px / 2) */}
            {i < STEPS.length - 1 && (
              <div
                style={{
                  marginTop: 20,
                  width: 72,
                  height: 1,
                  flexShrink: 0,
                  background: s.n < current ? "#ff5723" : "#e2e2e2",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Editor toolbar (visual match to screenshot) ───────────────────────────────

function EditorToolbar({ compact = false }: { compact?: boolean }) {
  const items = compact
    ? ["↩", "↪", "Paragraph", "🖼", "⊞", "🔗", "√", "{}", "B", "I", "X₂", "X²", "Ω", "☺", "A▾", "■▾", "⇥", "⇤", "≡▾", "⋮≡▾", "•••"]
    : ["↩", "↪", "Paragraph", "🖼", "⊞", "🔗", "√", "{}", "B", "I", "X₂", "X²", "Ω", "☺", "A▾", "■▾", "⇥", "⇤", "≡▾", "⋮≡▾", "•••"];

  return (
    <div className="flex flex-wrap items-center gap-px border-b border-neutral-200 bg-[#fafafa] px-2 py-1">
      {items.map((t, i) => {
        const isDivider = t === "|";
        if (isDivider) return <span key={i} className="mx-1 h-4 border-r border-neutral-300" />;
        const isLabel = t === "Paragraph";
        return (
          <button key={i} type="button"
            className={cn(
              "rounded px-1.5 py-0.5 text-[11px] font-medium text-neutral-600 hover:bg-neutral-200 select-none",
              isLabel && "flex items-center gap-0.5 pr-2 text-[11px]",
            )}>
            {isLabel ? <><span>{t}</span><span className="text-[9px]">▾</span></> : t}
          </button>
        );
      })}
    </div>
  );
}

// ── Answer row (matches screenshot exactly) ───────────────────────────────────

function AnswerRow({
  answer, sectionType, onToggleCorrect, onTextChange, onDelete,
}: {
  answer: LocalAnswer; sectionType: SectionType;
  onToggleCorrect: () => void; onTextChange: (v: string) => void; onDelete: () => void;
}) {
  const isTrueFalse = sectionType === "true_false";
  const isChoice    = sectionType === "single_choice" || isTrueFalse;

  if (isTrueFalse) {
    return (
      <div className="flex items-center gap-3">
        <button type="button" onClick={onToggleCorrect}
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all",
            answer.isCorrect
              ? "border-emerald-500 bg-emerald-500"
              : "border-neutral-400 bg-white",
          )}>
          {answer.isCorrect && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
        </button>
        <div className={cn(
          "flex-1 rounded-lg border px-4 py-2.5 text-[13px] font-medium transition-colors",
          answer.isCorrect
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : "border-neutral-200 bg-white text-[#3a3a3a]",
        )}>
          {answer.text}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      {/* Radio circle */}
      <button type="button" onClick={onToggleCorrect}
        className={cn(
          "mt-[14px] flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all",
          answer.isCorrect
            ? "border-emerald-500 bg-emerald-500"
            : "border-neutral-400 bg-white hover:border-neutral-500",
        )}>
        {answer.isCorrect && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
      </button>

      {/* Answer editor */}
      <div className={cn(
        "flex-1 overflow-hidden rounded-lg border transition-all",
        answer.isCorrect ? "border-emerald-200 bg-emerald-50" : "border-neutral-200 bg-white",
      )}>
        <EditorToolbar compact />
        <Textarea
          className={cn(
            "resize-none rounded-none border-0 text-[13px] shadow-none focus-visible:ring-0",
            answer.isCorrect ? "bg-emerald-50" : "bg-white",
          )}
          style={{ minHeight: 120 }}
          placeholder="Enter answer option…"
          maxLength={2500}
          value={answer.text}
          onChange={(e) => onTextChange(e.target.value)}
        />
        <div className="px-3 pb-1 text-right text-[11px] text-[#aaa]">
          {answer.text.length}/2500
        </div>
      </div>

      {/* Trash */}
      <button type="button" onClick={onDelete}
        className="mt-[14px] flex h-8 w-8 shrink-0 items-center justify-center rounded text-neutral-400 hover:bg-red-50 hover:text-red-500 transition-colors">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

// ── Question card ─────────────────────────────────────────────────────────────

function QuestionCard({
  question, index, sectionType, onUpdate, onDelete,
}: {
  question: LocalQuestion; index: number; sectionType: SectionType;
  onUpdate: (q: LocalQuestion) => void; onDelete: () => void;
}) {
  const isOpenAnswer = sectionType === "short_answer" || sectionType === "long_answer";
  const isTrueFalse  = sectionType === "true_false";

  const toggleCorrect = (answerId: string) => {
    onUpdate({
      ...question,
      answers: question.answers.map((a) => ({ ...a, isCorrect: a.id === answerId })),
    });
  };

  const updateText = (answerId: string, text: string) => {
    onUpdate({ ...question, answers: question.answers.map((a) => a.id === answerId ? { ...a, text } : a) });
  };

  const deleteAnswer = (answerId: string) => {
    if (question.answers.length <= 2) return;
    onUpdate({ ...question, answers: question.answers.filter((a) => a.id !== answerId) });
  };

  const addOption = () => {
    if (question.answers.length >= 6) return;
    onUpdate({ ...question, answers: [...question.answers, { id: uid(), text: "", isCorrect: false }] });
  };

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      {/* Question header */}
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[13px] font-semibold text-[#1f1f1f]">
          Question {index + 1} <span className="text-red-500">*</span>
        </p>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-[#7a7a7a]">Marks:</span>
            <Select value={String(question.marks)} onValueChange={(v) => onUpdate({ ...question, marks: Number(v) })}>
              <SelectTrigger className="h-7 w-16 rounded-md border border-neutral-200 text-[12px] shadow-none focus:ring-0 focus:ring-offset-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {POINT_OPTIONS.map((n) => <SelectItem key={n} value={String(n)} className="text-[13px]">{n}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {index > 0 && (
            <button type="button" onClick={onDelete}
              className="flex h-7 w-7 items-center justify-center rounded text-neutral-400 hover:bg-red-50 hover:text-red-500">
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Question editor */}
      <div className="mb-4 overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <EditorToolbar />
        <Textarea
          className="resize-none rounded-none border-0 bg-white text-[13px] shadow-none focus-visible:ring-0"
          style={{ minHeight: 160 }}
          placeholder="Type your question here…"
          maxLength={2500}
          value={question.text}
          onChange={(e) => onUpdate({ ...question, text: e.target.value })}
        />
        <div className="px-3 pb-1 text-right text-[11px] text-[#aaa]">
          {question.text.length}/2500
        </div>
      </div>

      {/* Answers section */}
      <div>
        <div className="mb-2">
          <p className="text-[13px] font-semibold text-[#1f1f1f]">
            Answers <span className="text-red-500">*</span>
          </p>
          <p className="text-[11px] text-[#8a8a8a]">
            {isTrueFalse
              ? "After providing possible answers, select the correct one."
              : isOpenAnswer
              ? "Tell AI what is correct answers to this question. Respondents will earn marks only if their answers atleast match the ones you set."
              : "After providing possible answers, select the correct one."}
          </p>
        </div>

        <div className="space-y-4">
          {question.answers.map((ans) => (
            <AnswerRow
              key={ans.id}
              answer={ans}
              sectionType={sectionType}
              onToggleCorrect={() => toggleCorrect(ans.id)}
              onTextChange={(v) => updateText(ans.id, v)}
              onDelete={() => deleteAnswer(ans.id)}
            />
          ))}
        </div>

        {/* Add Option — only for choice types, not true/false */}
        {sectionType === "single_choice" && question.answers.length < 6 && (
          <button type="button" onClick={addOption}
            className="mt-3 flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-[13px] text-[#3a3a3a] hover:bg-neutral-50 transition-colors">
            <Plus className="h-4 w-4" />
            Add Option
          </button>
        )}
      </div>
    </div>
  );
}

// ── Section editor ────────────────────────────────────────────────────────────

function SectionEditor({
  section, index, onUpdate, onDelete, onAddNewSection,
}: {
  section: LocalSection; index: number;
  onUpdate: (s: LocalSection) => void;
  onDelete: () => void;
  onAddNewSection: () => void;
}) {
  const totalMarks  = section.questions.reduce((s, q) => s + q.marks, 0);
  const label       = SECTION_LABELS[section.sectionType];

  const changeType = (type: SectionType) => {
    onUpdate({
      ...section,
      sectionType: type,
      questions: section.questions.map((q) => ({
        ...q,
        answers: defaultAnswers(type),
      })),
    });
  };

  const changePoints = (pts: number) => {
    onUpdate({
      ...section,
      pointsPerQuestion: pts,
      questions: section.questions.map((q) => ({ ...q, marks: pts })),
    });
  };

  const addQuestion = () => {
    onUpdate({ ...section, questions: [...section.questions, newQuestion(section.sectionType, section.pointsPerQuestion)] });
  };

  const updateQ = (qi: number, q: LocalQuestion) => {
    const qs = [...section.questions]; qs[qi] = q;
    onUpdate({ ...section, questions: qs });
  };

  const deleteQ = (qi: number) => {
    if (section.questions.length <= 1) return;
    onUpdate({ ...section, questions: section.questions.filter((_, i) => i !== qi) });
  };

  return (
    <div className="!mb-20">
      {/* Section header */}
      <div className="mb-6 flex flex-wrap items-center gap-3" style={{ paddingTop: index > 0 ? 0 : 0 }}>
        <Label className="text-[13px] font-bold text-[#1f1f1f] whitespace-nowrap">
          Section {index + 1} <span className="text-red-500">*</span>
        </Label>

        {/* Type dropdown — wide */}
        <Select value={section.sectionType} onValueChange={(v) => changeType(v as SectionType)}>
          <SelectTrigger className="h-11 w-80 rounded-lg border border-neutral-300 bg-white text-[13px] text-[#3a3a3a] shadow-none focus:ring-0 focus:ring-offset-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(SECTION_LABELS) as SectionType[]).map((t) => (
              <SelectItem key={t} value={t} className="text-[13px]">{SECTION_LABELS[t]}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Points */}
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-[#3a3a3a] whitespace-nowrap">Point for Correct Answer:</span>
          <Select value={String(section.pointsPerQuestion)} onValueChange={(v) => changePoints(Number(v))}>
            <SelectTrigger className="h-11 w-20 rounded-lg border border-neutral-300 bg-white text-[13px] shadow-none focus:ring-0 focus:ring-offset-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {POINT_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)} className="text-[13px]">{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Total marks display */}
        <div className="flex h-11 min-w-[140px] items-center rounded-lg border border-neutral-200 bg-neutral-50 px-4 text-[13px] text-[#6a6a6a]">
          Total Marks: <span className="ml-1.5 font-bold text-[#1f1f1f]">{totalMarks}</span>
        </div>

        {index > 0 && (
          <button type="button" onClick={onDelete}
            className="ml-auto flex h-9 w-9 items-center justify-center rounded-lg text-neutral-400 hover:bg-red-50 hover:text-red-500">
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Questions */}
      <div className="space-y-6 pb-2">
        {section.questions.map((q, qi) => (
          <QuestionCard
            key={q.id} question={q} index={qi} sectionType={section.sectionType}
            onUpdate={(updated) => updateQ(qi, updated)}
            onDelete={() => deleteQ(qi)}
          />
        ))}
      </div>

      {/* Bottom action bar — centered */}
      <div className="flex items-center justify-center gap-3" style={{ marginTop: 48, paddingBottom: 8 }}>
        <Button type="button" onClick={addQuestion}
          className="h-9 gap-2 rounded-full bg-[#ff5723] px-5 text-[13px] font-semibold text-white hover:bg-[#f04d1d]">
          <Plus className="h-4 w-4" />
          Add {label}
        </Button>
        <Button type="button" variant="outline" onClick={onAddNewSection}
          className="h-9 gap-2 rounded-full px-5 text-[13px] font-semibold">
          <Plus className="h-4 w-4" />
          Add New Section
        </Button>
      </div>

    </div>
  );
}

// ── Knowledge Assessment (Step 2) ─────────────────────────────────────────────

function KnowledgeBuilder({
  sections, saving, onChange, onSaveAndContinue,
}: {
  sections: LocalSection[]; saving: boolean;
  onChange: (ss: LocalSection[]) => void;
  onSaveAndContinue: () => void;
}) {
  const addSection = () => onChange([...sections, newSection()]);
  const totalMarks = sections.reduce((sum, s) => sum + s.questions.reduce((sq, q) => sq + q.marks, 0), 0);

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-[20px] font-bold text-[#1f1f1f]">Assessment Question</h2>
          <p className="mt-0.5 text-[13px] text-[#7a7a7a]">Build the questions and answers for your students.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex h-9 items-center rounded-lg border border-neutral-200 bg-neutral-50 px-4 text-[12px] text-[#6a6a6a]">
            Grand Total: <span className="ml-1.5 font-bold text-[#1f1f1f]">{totalMarks} marks</span>
          </div>
          <Button variant="outline" onClick={addSection} className="h-9 gap-2 text-[13px]">
            <Plus className="h-4 w-4" />
            Add New Section
          </Button>
          <Button onClick={onSaveAndContinue} disabled={saving}
            className="h-9 bg-[#ff5723] text-[13px] font-semibold text-white hover:bg-[#f04d1d]">
            {saving ? "Saving…" : "Save & Continue"}
          </Button>
        </div>
      </div>

      {/* Sections */}
      {sections.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <p className="text-[14px] font-medium text-[#1f1f1f]">No sections yet</p>
          <p className="text-[13px] text-[#9a9a9a]">Click &quot;Add New Section&quot; to start building.</p>
          <Button onClick={addSection} className="h-9 gap-2 bg-[#ff5723] text-[13px] font-semibold text-white hover:bg-[#f04d1d]">
            <Plus className="h-4 w-4" />
            Add New Section
          </Button>
        </div>
      ) : (
        sections.map((sec, si) => (
          <SectionEditor
            key={sec.id} section={sec} index={si}
            onUpdate={(updated) => {
              const ss = [...sections]; ss[si] = updated; onChange(ss);
            }}
            onDelete={() => onChange(sections.filter((_, i) => i !== si))}
            onAddNewSection={addSection}
          />
        ))
      )}
    </div>
  );
}

// ── Coding problem editor (Step 3) ────────────────────────────────────────────

function ProblemEditor({
  problem, index, allProblems, onUpdate, onDelete,
}: {
  problem: LocalProblem; index: number; allProblems: LocalProblem[];
  onUpdate: (p: LocalProblem) => void; onDelete: () => void;
}) {
  const totalMarks = allProblems.reduce((s, p) => s + p.marks, 0) || 1;
  const weightage  = Math.round((problem.marks / totalMarks) * 100);

  // draft row for adding a new test case
  const [draft, setDraft] = useState({ input: "", expectedOutput: "", explanation: "" });
  const [showDraft, setShowDraft] = useState(false);

  const confirmDraft = () => {
    onUpdate({ ...problem, testCases: [...problem.testCases, { id: uid(), ...draft }] });
    setDraft({ input: "", expectedOutput: "", explanation: "" });
    setShowDraft(false);
  };

  const deleteTC = (id: string) =>
    onUpdate({ ...problem, testCases: problem.testCases.filter((t) => t.id !== id) });

  const toggleLang = (lang: string) => {
    const has = problem.allowedLanguages.includes(lang);
    if (has && problem.allowedLanguages.length <= 1) return;
    onUpdate({
      ...problem,
      allowedLanguages: has
        ? problem.allowedLanguages.filter((l) => l !== lang)
        : [...problem.allowedLanguages, lang],
    });
  };

  return (
    <div className="mb-6 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
      {/* Problem header */}
      <div className="flex flex-wrap items-center gap-3 border-b border-neutral-100 bg-white p-6">
        <Label className="shrink-0 text-[13px] font-bold text-[#1f1f1f]">
          Problem {index + 1} Title <span className="text-red-500">*</span>
        </Label>
        <Input placeholder="eg: Find the shortest path in a weighted graph"
          value={problem.title} className="flex-1 text-[13px]"
          onChange={(e) => onUpdate({ ...problem, title: e.target.value })} />

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[12px] text-[#7a7a7a] whitespace-nowrap">Marks for this problem</span>
          <Select value={String(problem.marks)} onValueChange={(v) => onUpdate({ ...problem, marks: Number(v) })}>
            <SelectTrigger className="h-9 w-20 text-[13px] border-neutral-200 shadow-none focus:ring-0 focus:ring-offset-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MARKS_OPTIONS.map((n) => <SelectItem key={n} value={String(n)} className="text-[13px]">{n}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="flex h-9 min-w-[150px] shrink-0 items-center rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-[12px] text-[#6a6a6a]">
          Total Weightage: <span className="ml-1 font-bold text-[#1f1f1f]">{weightage}%</span>
        </div>

        {index > 0 && (
          <button type="button" onClick={onDelete}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-neutral-400 hover:bg-red-50 hover:text-red-500">
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="space-y-6 p-8">
        {/* Allowed languages */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <div>
              <p className="text-[13px] font-semibold text-[#1f1f1f]">
                Allowed Programming Languages <span className="text-red-500">*</span>
              </p>
              <p className="text-[11px] text-[#8a8a8a]">
                Candidates must submit executable code only using the selected languages.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-[#7a7a7a]">Choose Language</span>
              <Select value={problem.solutionLanguage}
                onValueChange={(v) => {
                  onUpdate({ ...problem, solutionLanguage: v });
                  if (!problem.allowedLanguages.includes(v)) toggleLang(v);
                }}>
                <SelectTrigger className="h-9 w-36 text-[13px] border-neutral-200 shadow-none focus:ring-0 focus:ring-offset-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((l) => <SelectItem key={l} value={l} className="text-[13px]">{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((lang) => (
              <button key={lang} type="button" onClick={() => toggleLang(lang)}
                className={cn(
                  "rounded-full border px-3 py-1 text-[12px] font-medium transition-colors",
                  problem.allowedLanguages.includes(lang)
                    ? "border-[#ff5723] bg-orange-50 text-[#ff5723]"
                    : "border-neutral-200 bg-white text-[#7a7a7a] hover:border-neutral-300",
                )}>
                {lang}
              </button>
            ))}
          </div>
        </div>

        {/* Problem statement */}
        <div>
          <Label className="mb-1.5 text-[13px] font-semibold text-[#1f1f1f]">
            Problem Statement <span className="text-red-500">*</span>
          </Label>
          <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
            <EditorToolbar />
            <Textarea className="resize-none rounded-none border-0 bg-white text-[13px] shadow-none focus-visible:ring-0"
              style={{ minHeight: 180 }}
              placeholder="Describe the problem clearly…"
              value={problem.problemStatement}
              onChange={(e) => onUpdate({ ...problem, problemStatement: e.target.value })} />
            <div className="px-3 pb-1 text-right text-[11px] text-[#aaa]">{problem.problemStatement.length}/10000</div>
          </div>
        </div>

        {/* Sample I/O */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="mb-1 text-[13px] font-semibold text-[#1f1f1f]">Sample Input <span className="text-red-500">*</span></Label>
            <p className="mb-1.5 text-[11px] text-[#8a8a8a]">Example input visible to candidates.</p>
            <Textarea className="resize-y font-mono text-[13px]" style={{ minHeight: 160 }}
              placeholder="[3, 1, 4, 4, 5, 2]" value={problem.sampleInput}
              onChange={(e) => onUpdate({ ...problem, sampleInput: e.target.value })} />
          </div>
          <div>
            <Label className="mb-1 text-[13px] font-semibold text-[#1f1f1f]">Sample Output <span className="text-red-500">*</span></Label>
            <p className="mb-1.5 text-[11px] text-[#8a8a8a]">Expected output for the sample input.</p>
            <Textarea className="resize-y font-mono text-[13px]" style={{ minHeight: 160 }}
              placeholder="4" value={problem.sampleOutput}
              onChange={(e) => onUpdate({ ...problem, sampleOutput: e.target.value })} />
          </div>
        </div>

        {/* Reference solution */}
        <div>
          <p className="mb-1 text-[13px] font-semibold text-[#1f1f1f]">Reference Solution <span className="text-red-500">*</span></p>
          <p className="mb-3 text-[11px] text-[#8a8a8a]">Provide a correct and efficient solution used for validation and AI evaluation.</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="mb-1 text-[12px] text-[#7a7a7a]">Solution <span className="text-red-500">*</span></Label>
              <div className="overflow-hidden rounded-lg border border-neutral-200">
                <div className="flex items-center gap-2 bg-neutral-900 px-3 py-2">
                  <Select value={problem.solutionLanguage}
                    onValueChange={(v) => onUpdate({ ...problem, solutionLanguage: v })}>
                    <SelectTrigger className="h-7 w-28 border-0 bg-transparent text-[12px] text-white shadow-none focus:ring-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((l) => <SelectItem key={l} value={l} className="text-[13px]">{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Textarea className="resize-y rounded-none border-0 bg-neutral-900 font-mono text-[12px] text-green-400 shadow-none focus-visible:ring-0" style={{ minHeight: 220 }}
                  placeholder="# Write your solution here…"
                  value={problem.solutionCode}
                  onChange={(e) => onUpdate({ ...problem, solutionCode: e.target.value })} />
              </div>
            </div>
            <div>
              <Label className="mb-1 text-[12px] text-[#7a7a7a]">Solution Explanation (Optional)</Label>
              <Textarea className="resize-y text-[13px]" style={{ minHeight: 260 }}
                placeholder="Explain the approach and time complexity…"
                value={problem.solutionExplanation}
                onChange={(e) => onUpdate({ ...problem, solutionExplanation: e.target.value })} />
            </div>
          </div>
        </div>

        {/* Test cases */}
        <div>
          <p className="mb-3 text-[13px] font-semibold text-[#1f1f1f]">Test Cases (Optional)</p>
          <div className="overflow-hidden rounded-lg border border-neutral-200">
            {/* Header */}
            <div className="grid grid-cols-[1fr_1fr_1.5fr_48px] border-b border-neutral-200 bg-neutral-50 px-5 py-3 text-[12px] font-semibold text-[#5a5a5a]">
              <span>Input</span>
              <span>Expected Output</span>
              <span>Explanation</span>
              <span>Action</span>
            </div>

            {/* Saved rows — read-only */}
            {problem.testCases.map((tc) => (
              <div key={tc.id}
                className="grid grid-cols-[1fr_1fr_1.5fr_48px] items-center border-b border-neutral-100 px-5 py-4 last:border-0">
                <span className="text-[13px] text-[#2a2a2a]">{tc.input || "—"}</span>
                <span className="text-[13px] text-[#2a2a2a]">{tc.expectedOutput || "—"}</span>
                <span className="text-[13px] text-[#2a2a2a]">{tc.explanation || "—"}</span>
                <button type="button" onClick={() => deleteTC(tc.id)}
                  className="flex h-8 w-8 items-center justify-center rounded text-neutral-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}

            {/* Draft / add row */}
            {showDraft && (
              <div className="grid grid-cols-[1fr_1fr_1.5fr_48px] items-center gap-3 border-t border-neutral-100 bg-neutral-50/50 px-5 py-3">
                <Input
                  className="h-9 text-[13px]" placeholder="Enter Input"
                  value={draft.input} onChange={(e) => setDraft((d) => ({ ...d, input: e.target.value }))} />
                <Input
                  className="h-9 text-[13px]" placeholder="Enter Output"
                  value={draft.expectedOutput} onChange={(e) => setDraft((d) => ({ ...d, expectedOutput: e.target.value }))} />
                <Input
                  className="h-9 text-[13px]" placeholder="Give Explanation"
                  value={draft.explanation} onChange={(e) => setDraft((d) => ({ ...d, explanation: e.target.value }))} />
                <button type="button" onClick={confirmDraft}
                  className="flex h-8 w-8 items-center justify-center rounded border border-neutral-200 bg-white text-neutral-500 hover:bg-emerald-50 hover:text-emerald-600 transition-colors">
                  <Check className="h-4 w-4" strokeWidth={2.5} />
                </button>
              </div>
            )}
          </div>

          {/* Add Test Case button — centered */}
          <div className="mt-4 flex justify-center">
            <Button type="button" variant="outline"
              onClick={() => setShowDraft(true)}
              className="h-9 gap-2 rounded-full px-5 text-[13px] font-medium">
              <Plus className="h-4 w-4" />
              Add Test Case
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SkillBuilder({
  problems, saving, onChange, onSaveAndContinue,
}: {
  problems: LocalProblem[]; saving: boolean;
  onChange: (ps: LocalProblem[]) => void;
  onSaveAndContinue: () => void;
}) {
  const addProblem  = () => onChange([...problems, newProblem()]);
  const totalMarks  = problems.reduce((s, p) => s + p.marks, 0);

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-[20px] font-bold text-[#1f1f1f]">Programming Challenge</h2>
          <p className="mt-0.5 text-[13px] text-[#7a7a7a]">Create an execution-based coding problem to evaluate real-world skills.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex h-9 items-center rounded-lg border border-neutral-200 bg-neutral-50 px-4 text-[12px] text-[#6a6a6a]">
            Total Marks: <span className="ml-1.5 font-bold text-[#1f1f1f]">{totalMarks}</span>
          </div>
          <Button variant="outline" onClick={addProblem} className="h-9 gap-2 text-[13px]">
            <Plus className="h-4 w-4" />
            Add New Problem
          </Button>
          <Button onClick={onSaveAndContinue} disabled={saving}
            className="h-9 bg-[#ff5723] text-[13px] font-semibold text-white hover:bg-[#f04d1d]">
            {saving ? "Saving…" : "Save & Continue"}
          </Button>
        </div>
      </div>

      {problems.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <p className="text-[14px] font-medium text-[#1f1f1f]">No problems yet</p>
          <Button onClick={addProblem} className="h-9 gap-2 bg-[#ff5723] text-[13px] font-semibold text-white hover:bg-[#f04d1d]">
            <Plus className="h-4 w-4" /> Add New Problem
          </Button>
        </div>
      ) : (
        <>
          {problems.map((p, i) => (
            <ProblemEditor key={p.id} problem={p} index={i} allProblems={problems}
              onUpdate={(updated) => { const ps = [...problems]; ps[i] = updated; onChange(ps); }}
              onDelete={() => onChange(problems.filter((_, idx) => idx !== i))}
            />
          ))}
          <div className="mt-2 flex items-center justify-center gap-3">
            <Button variant="outline" onClick={addProblem} className="h-9 gap-2 text-[13px]">
              <Plus className="h-4 w-4" /> Add New Problem
            </Button>
            <Button onClick={onSaveAndContinue} disabled={saving}
              className="h-9 bg-[#ff5723] text-[13px] font-semibold text-white hover:bg-[#f04d1d]">
              {saving ? "Saving…" : "Save & Continue"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Review & Publish (Step 4) ─────────────────────────────────────────────────

function ReviewPublish({
  assessment, sections, problems, saving, onEdit, onFinish,
}: {
  assessment: AssessmentItem; sections: LocalSection[]; problems: LocalProblem[];
  saving: boolean; onEdit: (step: number) => void; onFinish: () => void;
}) {
  const knowledgeTotal = sections.reduce((sum, s) => sum + s.questions.reduce((sq, q) => sq + q.marks, 0), 0);
  const codingTotal    = problems.reduce((s, p) => s + p.marks, 0);
  const grandTotal     = knowledgeTotal + codingTotal;

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-[20px] font-bold text-[#1f1f1f]">Review &amp; Publish</h2>
          <p className="mt-0.5 text-[13px] text-[#7a7a7a]">
            You&apos;re almost done. Review the assessment configuration before publishing.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex h-9 items-center rounded-lg border border-neutral-200 bg-neutral-50 px-4 text-[12px] text-[#6a6a6a]">
            Total Marks: <span className="ml-1.5 font-bold text-[#1f1f1f]">{grandTotal}</span>
          </div>
          <Button variant="outline" className="h-9 gap-2 text-[13px]" onClick={() => onEdit(2)}>
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
          <Button onClick={onFinish} disabled={saving}
            className="h-9 bg-[#ff5723] text-[13px] font-semibold text-white hover:bg-[#f04d1d]">
            {saving ? "Publishing…" : "Finish"}
          </Button>
        </div>
      </div>

      {/* Basic details */}
      <div className="mb-5 rounded-xl border border-neutral-200 bg-white p-5">
        <h3 className="mb-1 text-[14px] font-bold text-[#1f1f1f]">Basic Details</h3>
        <p className="mb-4 text-[12px] text-[#8a8a8a]">Enter the details about this assessment for your identification.</p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          {[
            ["Assessment Name", assessment.name],
            assessment.jobTitle        && ["Job Title",       assessment.jobTitle],
            assessment.roleType        && ["Role Type",        assessment.roleType],
            assessment.experienceRange && ["Experience Range", assessment.experienceRange],
            assessment.totalMarks      && ["Total Marks",      String(assessment.totalMarks)],
            assessment.passMarks       && ["Pass Marks",       String(assessment.passMarks)],
            assessment.duration        && ["Duration",         String(assessment.duration) + " mins"],
            assessment.difficulty      && ["Difficulty",       assessment.difficulty],
          ].filter(Boolean).map((row) => {
            const [label, value] = row as [string, string];
            return (
              <div key={label}>
                <Label className="text-[11px] text-[#9a9a9a]">{label}</Label>
                <div className="mt-0.5 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-[13px] text-[#1f1f1f]">
                  {value}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Knowledge Assessment */}
      {sections.length > 0 && (
        <div className="mb-5 rounded-xl border border-neutral-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-[14px] font-bold text-[#1f1f1f]">Knowledge Assessment</h3>
              <p className="text-[12px] text-[#8a8a8a]">Build the questions and answers for your students.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-[#7a7a7a]">Total: <b className="text-[#1f1f1f]">{knowledgeTotal} marks</b></span>
              <Button variant="ghost" size="sm" className="gap-1.5 text-[13px]" onClick={() => onEdit(2)}>
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Button>
            </div>
          </div>
          {sections.map((sec, si) => {
            const secTotal = sec.questions.reduce((s, q) => s + q.marks, 0);
            return (
              <div key={sec.id} className="mb-4">
                <div className="mb-2 flex items-center gap-4 rounded-lg bg-neutral-50 px-4 py-2.5 text-[12px]">
                  <span className="font-semibold text-[#3a3a3a]">Section {si + 1}</span>
                  <span className="text-[#7a7a7a]">{SECTION_LABELS[sec.sectionType]}</span>
                  <span className="text-[#7a7a7a]">Point for Correct Answer: {sec.pointsPerQuestion}</span>
                  <span className="ml-auto font-semibold text-[#1f1f1f]">Total Marks: {secTotal}</span>
                </div>
                <div className="space-y-3 pl-4">
                  {sec.questions.map((q, qi) => (
                    <div key={q.id}>
                      <p className="text-[13px] font-medium text-[#1f1f1f]">
                        {qi + 1}. {q.text || "(No question text)"}
                        <span className="ml-2 text-[11px] text-[#9a9a9a]">({q.marks} mark{q.marks !== 1 ? "s" : ""})</span>
                      </p>
                      {(sec.sectionType === "single_choice" || sec.sectionType === "true_false") && (
                        <div className="mt-2 space-y-1.5 pl-4">
                          {q.answers.map((a) => (
                            <div key={a.id} className="flex items-center gap-2">
                              <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                                a.isCorrect ? "border-emerald-500 bg-emerald-500" : "border-neutral-300")}>
                                {a.isCorrect && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                              </span>
                              <span className={cn("rounded-md border px-3 py-1 text-[12px] flex-1",
                                a.isCorrect ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-neutral-200 bg-white text-[#3a3a3a]")}>
                                {a.text || "(Empty option)"}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Skill Assessment */}
      {problems.length > 0 && (
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-[14px] font-bold text-[#1f1f1f]">Skill Assessment</h3>
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-[#7a7a7a]">Total: <b className="text-[#1f1f1f]">{codingTotal} marks</b></span>
              <Button variant="ghost" size="sm" className="gap-1.5 text-[13px]" onClick={() => onEdit(3)}>
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Button>
            </div>
          </div>
          {problems.map((p, i) => (
            <div key={p.id} className="mb-3 rounded-lg border border-neutral-100 bg-neutral-50 p-4">
              <p className="text-[13px] font-semibold text-[#1f1f1f]">
                {i + 1}. {p.title || "(No title)"}
                <span className="ml-2 text-[11px] font-normal text-[#9a9a9a]">({p.marks} mark{p.marks !== 1 ? "s" : ""})</span>
              </p>
              <p className="mt-1 text-[12px] text-[#7a7a7a]">
                Languages: {p.allowedLanguages.join(", ")}
                {p.testCases.length > 0 && ` · ${p.testCases.length} test case${p.testCases.length !== 1 ? "s" : ""}`}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AssessmentBuildPage() {
  const params        = useParams<{ assessmentId: string }>();
  const router        = useRouter();
  const { activeOrg } = useOrg();

  const assessmentId = params.assessmentId;
  const orgId        = activeOrg?.orgId ?? "";

  const [step,       setStep]       = useState(2);
  const [assessment, setAssessment] = useState<AssessmentItem | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);

  const [sections, setSections] = useState<LocalSection[]>([newSection()]);
  const [problems, setProblems] = useState<LocalProblem[]>([newProblem()]);

  const fetchAssessment = useCallback(async () => {
    if (!orgId || !assessmentId) return;
    setLoading(true);
    try {
      const res = await getAssessmentById(assessmentId, orgId, getToken());
      const a   = res.data?.assessment;
      if (a) {
        setAssessment(a);
        if (a.sections?.length)       setSections(a.sections.map(fromApiSection));
        if (a.codingProblems?.length) setProblems(a.codingProblems.map(fromApiProblem));
      }
    } catch { toast.error("Failed to load assessment"); }
    finally  { setLoading(false); }
  }, [orgId, assessmentId]);

  useEffect(() => { fetchAssessment(); }, [fetchAssessment]);

  // ── Validation ──────────────────────────────────────────────────────────────

  const validateKnowledge = (): boolean => {
    if (sections.length === 0) {
      toast.error("Add at least one section before continuing");
      return false;
    }
    for (let si = 0; si < sections.length; si++) {
      const sec = sections[si];
      if (sec.questions.length === 0) {
        toast.error(`Section ${si + 1} must have at least one question`);
        return false;
      }
      for (let qi = 0; qi < sec.questions.length; qi++) {
        const q = sec.questions[qi];
        if (!q.text.trim()) {
          toast.error(`Section ${si + 1}, Question ${qi + 1}: Question text is required`);
          return false;
        }
        if (sec.sectionType === "single_choice" || sec.sectionType === "true_false") {
          const hasCorrect = q.answers.some((a) => a.isCorrect);
          if (!hasCorrect) {
            toast.error(`Section ${si + 1}, Question ${qi + 1}: Select the correct answer`);
            return false;
          }
          if (sec.sectionType === "single_choice") {
            const emptyOption = q.answers.find((a) => !a.text.trim());
            if (emptyOption) {
              toast.error(`Section ${si + 1}, Question ${qi + 1}: All answer options must have text`);
              return false;
            }
          }
        }
        if (sec.sectionType === "short_answer" || sec.sectionType === "long_answer") {
          if (!q.answers[0]?.text.trim()) {
            toast.error(`Section ${si + 1}, Question ${qi + 1}: Model answer is required`);
            return false;
          }
        }
      }
    }
    return true;
  };

  const validateCoding = (): boolean => {
    if (problems.length === 0) {
      toast.error("Add at least one problem before continuing");
      return false;
    }
    for (let i = 0; i < problems.length; i++) {
      const p = problems[i];
      if (!p.title.trim()) {
        toast.error(`Problem ${i + 1}: Title is required`);
        return false;
      }
      if (!p.problemStatement.trim()) {
        toast.error(`Problem ${i + 1}: Problem statement is required`);
        return false;
      }
      if (!p.sampleInput.trim()) {
        toast.error(`Problem ${i + 1}: Sample input is required`);
        return false;
      }
      if (!p.sampleOutput.trim()) {
        toast.error(`Problem ${i + 1}: Sample output is required`);
        return false;
      }
      if (!p.solutionCode.trim()) {
        toast.error(`Problem ${i + 1}: Solution code is required`);
        return false;
      }
    }
    return true;
  };

  // ── Save handlers ────────────────────────────────────────────────────────────

  const handleSaveKnowledge = async () => {
    if (!validateKnowledge()) return;
    setSaving(true);
    try {
      await updateAssessment(assessmentId, { orgId, sections: sections.map(toApiSection) }, getToken());
      toast.success("Knowledge assessment saved");
      setStep(3);
    } catch { toast.error("Failed to save"); }
    finally  { setSaving(false); }
  };

  const handleSaveCoding = async () => {
    if (!validateCoding()) return;
    setSaving(true);
    try {
      await updateAssessment(assessmentId, { orgId, codingProblems: problems.map(toApiProblem) }, getToken());
      toast.success("Skill assessment saved");
      setStep(4);
    } catch { toast.error("Failed to save"); }
    finally  { setSaving(false); }
  };

  const handlePublish = async () => {
    setSaving(true);
    try {
      await updateAssessment(
        assessmentId,
        { orgId, sections: sections.map(toApiSection), codingProblems: problems.map(toApiProblem), isPublished: true },
        getToken(),
      );
      toast.success("Assessment published!");
      router.push("/whitecollar/assessments");
    } catch { toast.error("Failed to publish"); }
    finally  { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#ff5723] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9f9f9]">
      {/* Top bar */}
      <div className="sticky top-0 z-10 border-b border-neutral-200 bg-white px-6 py-3">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => router.push("/whitecollar/assessments")}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-[13px] font-medium text-[#3a3a3a] hover:bg-neutral-50">
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>
          <span className="text-[12px] text-[#9a9a9a]">
            Dashboard &rsaquo;{" "}
            <span className="font-medium text-[#3a3a3a]">
              {assessment?.name ?? assessmentId}
            </span>
          </span>
        </div>
      </div>

      {/* Stepper */}
      <div className="bg-white px-6 py-6">
        <BuildStepper current={step} />
      </div>

      {/* Content */}
      <div className="mx-auto max-w-6xl px-8 py-8">
        {step === 2 && (
          <KnowledgeBuilder
            sections={sections} saving={saving}
            onChange={setSections}
            onSaveAndContinue={handleSaveKnowledge}
          />
        )}
        {step === 3 && (
          <SkillBuilder
            problems={problems} saving={saving}
            onChange={setProblems}
            onSaveAndContinue={handleSaveCoding}
          />
        )}
        {step === 4 && assessment && (
          <ReviewPublish
            assessment={assessment} sections={sections} problems={problems}
            saving={saving} onEdit={setStep} onFinish={handlePublish}
          />
        )}
      </div>
    </div>
  );
}
