'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter }                     from 'next/navigation';
import { ArrowLeft, ChevronDown, Loader2, Plus, Trash2 } from 'lucide-react';
import { toast }    from 'sonner';
import { Button }   from '@/components/ui/button';
import { Input }    from '@/components/ui/input';
import { Label }    from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useOrg } from '@/components/layout/orgContext';
import { getAssessmentById } from '@/api/assessment.api';
import { listQuestions, bulkReplaceQuestions, type QuestionItem } from '@/api/question.api';

// ── Constants ─────────────────────────────────────────────────────────────────

function getAccessToken() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('auth_access_token') ?? '';
}

const LANGUAGE_OPTIONS = [
  'Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'C', 'C#', 'Go', 'Rust', 'PHP', 'Ruby', 'Kotlin', 'Swift',
];

const MARKS_OPTIONS = [1, 2, 5, 10, 12, 15, 20, 25, 30, 35, 40, 45, 50];

// ── Local UI types ────────────────────────────────────────────────────────────

type UiTestCase = {
  id:             string;
  input:          string;
  expectedOutput: string;
  explanation:    string;
  isHidden:       boolean;
};

type UiCodingProblem = {
  id:                  string;
  title:               string;
  marks:               number;
  allowedLanguages:    string[];
  problemStatement:    string;
  sampleInput:         string;
  sampleOutput:        string;
  solutionLanguage:    string;
  solutionCode:        string;
  solutionExplanation: string;
  testCases:           UiTestCase[];
};

let _uid = 0;
const uid = () => `cp_${(_uid++).toString()}`;

const emptyTestCase = (): UiTestCase => ({
  id: uid(), input: '', expectedOutput: '', explanation: '', isHidden: true,
});

const emptyProblem = (index: number): UiCodingProblem => ({
  id:                  uid(),
  title:               `Problem ${index + 1}`,
  marks:               10,
  allowedLanguages:    ['Python'],
  problemStatement:    '',
  sampleInput:         '',
  sampleOutput:        '',
  solutionLanguage:    'Python',
  solutionCode:        '',
  solutionExplanation: '',
  testCases:           [emptyTestCase()],
});

// ── Transform: QuestionItem → UiCodingProblem ─────────────────────────────────

function fromQuestion(q: QuestionItem, idx: number): UiCodingProblem {
  // First non-hidden test case is the sample I/O; rest are actual test cases
  const sampleTc  = q.codingTestCases.find(tc => !tc.isHidden);
  const actualTcs = q.codingTestCases.filter(tc => tc.isHidden);

  return {
    id:                  uid(),
    title:               q.title || `Problem ${idx + 1}`,
    marks:               q.marks ?? 10,
    allowedLanguages:    q.options.length > 0 ? q.options : ['Python'],
    problemStatement:    q.question,
    sampleInput:         sampleTc?.input          ?? '',
    sampleOutput:        sampleTc?.expectedOutput  ?? '',
    solutionLanguage:    q.programmingLanguage || 'Python',
    solutionCode:        q.sampleSolution      || '',
    solutionExplanation: q.correctAnswer        || '',
    testCases:           actualTcs.length > 0
      ? actualTcs.map(tc => ({ id: uid(), input: tc.input, expectedOutput: tc.expectedOutput, explanation: tc.explanation, isHidden: true }))
      : [emptyTestCase()],
  };
}

// ── Transform: UiCodingProblem → QuestionPayload ──────────────────────────────

function toQuestion(p: UiCodingProblem, index: number) {
  return {
    title:               p.title,
    type:                'Coding' as const,
    question:            p.problemStatement,
    options:             p.allowedLanguages,        // reuse options[] for allowed languages
    correctAnswer:       p.solutionExplanation,     // reuse correctAnswer for explanation
    sampleSolution:      p.solutionCode,
    programmingLanguage: p.solutionLanguage,
    codingTestCases: [
      // sample I/O stored as first non-hidden test case
      { input: p.sampleInput, expectedOutput: p.sampleOutput, explanation: '', isHidden: false },
      // actual hidden test cases
      ...p.testCases.map(tc => ({
        input:          tc.input,
        expectedOutput: tc.expectedOutput,
        explanation:    tc.explanation,
        isHidden:       tc.isHidden,
      })),
    ],
    marks:            p.marks,
    order:            0,
    questionSetIndex: index,
  };
}

// ── Test Case Row ─────────────────────────────────────────────────────────────

function TestCaseRow({ tc, onChange, onDelete, canDelete }: {
  tc:       UiTestCase;
  onChange: (patch: Partial<UiTestCase>) => void;
  onDelete: () => void;
  canDelete: boolean;
}) {
  return (
    <div className="rounded border border-neutral-200 bg-neutral-50 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-semibold text-[#6a6a6a]">Test Case</span>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 cursor-pointer select-none text-[12px] text-[#6a6a6a]">
            <input
              type="checkbox"
              checked={tc.isHidden}
              onChange={e => onChange({ isHidden: e.target.checked })}
              className="h-3.5 w-3.5 accent-[#ff5723]"
            />
            Hidden
          </label>
          {canDelete && (
            <button type="button" onClick={onDelete}
              className="text-gray-400 hover:text-red-500 transition-colors">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-[12px] text-[#6a6a6a]">Input</Label>
          <Textarea placeholder="Input value…" value={tc.input}
            onChange={e => onChange({ input: e.target.value })}
            className="min-h-[60px] resize-none text-[12px]" />
        </div>
        <div className="space-y-1">
          <Label className="text-[12px] text-[#6a6a6a]">Expected Output</Label>
          <Textarea placeholder="Expected output…" value={tc.expectedOutput}
            onChange={e => onChange({ expectedOutput: e.target.value })}
            className="min-h-[60px] resize-none text-[12px]" />
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-[12px] text-[#6a6a6a]">Explanation (optional)</Label>
        <Input placeholder="Explanation…" value={tc.explanation}
          onChange={e => onChange({ explanation: e.target.value })}
          className="text-[12px]" />
      </div>
    </div>
  );
}

// ── Coding Problem Card ───────────────────────────────────────────────────────

function CodingProblemCard({ problem, index, onChange, onDelete }: {
  problem:  UiCodingProblem;
  index:    number;
  onChange: (patch: Partial<UiCodingProblem>) => void;
  onDelete: () => void;
}) {
  const toggleLang = (lang: string) => {
    const next = problem.allowedLanguages.includes(lang)
      ? problem.allowedLanguages.filter(l => l !== lang)
      : [...problem.allowedLanguages, lang];
    if (next.length === 0) { toast.error('At least one language must be selected.'); return; }
    onChange({ allowedLanguages: next });
  };

  const updateTestCase = (tcId: string, patch: Partial<UiTestCase>) =>
    onChange({ testCases: problem.testCases.map(tc => tc.id === tcId ? { ...tc, ...patch } : tc) });

  const deleteTestCase = (tcId: string) => {
    if (problem.testCases.length <= 1) { toast.error('At least one test case is required.'); return; }
    onChange({ testCases: problem.testCases.filter(tc => tc.id !== tcId) });
  };

  return (
    <div className="mb-8 p-5 bg-white rounded border border-neutral-200">

      {/* Problem header */}
      <div className="flex items-center justify-between mb-5 border-b border-neutral-200 pb-4">
        <h3 className="font-bold text-[#1f1f1f]">Problem {index + 1}</h3>
        <button type="button" onClick={onDelete}
          className="text-gray-400 hover:text-red-500 transition-colors" title="Delete problem">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4">

        {/* Title + Marks */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-[13px] font-medium text-[#3a3a3a]">
              Problem Title <span className="text-red-500">*</span>
            </Label>
            <Input placeholder="eg: Two Sum" value={problem.title}
              onChange={e => onChange({ title: e.target.value })} className="text-[13px]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px] font-medium text-[#3a3a3a]">Marks</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" className="w-full justify-between text-[13px]">
                  {problem.marks}
                  <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {MARKS_OPTIONS.map(m => (
                  <DropdownMenuItem key={m} className="text-[13px]" onClick={() => onChange({ marks: m })}>
                    {m}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Allowed Languages */}
        <div className="space-y-1.5">
          <Label className="text-[13px] font-medium text-[#3a3a3a]">Allowed Languages</Label>
          <div className="flex flex-wrap gap-2">
            {LANGUAGE_OPTIONS.map(lang => (
              <button key={lang} type="button" onClick={() => toggleLang(lang)}
                className={`rounded-full border px-3 py-1 text-[12px] font-medium transition-colors ${
                  problem.allowedLanguages.includes(lang)
                    ? 'border-[#ff5723] bg-orange-50 text-[#ff5723]'
                    : 'border-neutral-200 text-[#6a6a6a] hover:border-neutral-300'
                }`}>
                {lang}
              </button>
            ))}
          </div>
        </div>

        {/* Problem Statement */}
        <div className="space-y-1.5">
          <Label className="text-[13px] font-medium text-[#3a3a3a]">
            Problem Statement <span className="text-red-500">*</span>
          </Label>
          <Textarea placeholder="Describe the problem clearly…" value={problem.problemStatement}
            onChange={e => onChange({ problemStatement: e.target.value })}
            className="min-h-[120px] resize-none text-[13px]" />
        </div>

        {/* Sample I/O */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-[13px] font-medium text-[#3a3a3a]">Sample Input</Label>
            <Textarea placeholder="eg: [2,7,11,15], 9" value={problem.sampleInput}
              onChange={e => onChange({ sampleInput: e.target.value })}
              className="min-h-[80px] resize-none font-mono text-[12px]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px] font-medium text-[#3a3a3a]">Sample Output</Label>
            <Textarea placeholder="eg: [0, 1]" value={problem.sampleOutput}
              onChange={e => onChange({ sampleOutput: e.target.value })}
              className="min-h-[80px] resize-none font-mono text-[12px]" />
          </div>
        </div>

        {/* Test Cases */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-[13px] font-medium text-[#3a3a3a]">Test Cases</Label>
            <Button type="button" size="sm" variant="outline" className="h-7 gap-1 px-2.5 text-[12px]"
              onClick={() => onChange({ testCases: [...problem.testCases, emptyTestCase()] })}>
              <Plus className="h-3 w-3" /> Add Case
            </Button>
          </div>
          {problem.testCases.map(tc => (
            <TestCaseRow key={tc.id} tc={tc}
              onChange={patch => updateTestCase(tc.id, patch)}
              onDelete={() => deleteTestCase(tc.id)}
              canDelete={problem.testCases.length > 1} />
          ))}
        </div>

        {/* Reference Solution */}
        <div className="space-y-4 border-t border-neutral-200 pt-4">
          <p className="text-[13px] font-semibold text-[#3a3a3a]">Reference Solution</p>
          <div className="space-y-1.5">
            <Label className="text-[13px] font-medium text-[#3a3a3a]">Solution Language</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" className="w-48 justify-between text-[13px]">
                  {problem.solutionLanguage}
                  <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {LANGUAGE_OPTIONS.map(l => (
                  <DropdownMenuItem key={l} className="text-[13px]" onClick={() => onChange({ solutionLanguage: l })}>
                    {l}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px] font-medium text-[#3a3a3a]">Solution Code</Label>
            <Textarea placeholder="Enter reference solution code…" value={problem.solutionCode}
              onChange={e => onChange({ solutionCode: e.target.value })}
              className="min-h-[120px] resize-none font-mono text-[12px]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px] font-medium text-[#3a3a3a]">Solution Explanation</Label>
            <Textarea placeholder="Explain the approach or algorithm…" value={problem.solutionExplanation}
              onChange={e => onChange({ solutionExplanation: e.target.value })}
              className="min-h-[80px] resize-none text-[13px]" />
          </div>
        </div>

      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CodingQuestionsPage() {
  const params = useParams();
  const router = useRouter();
  const { activeOrg } = useOrg();

  const assessmentId = params.assessmentId as string;
  const orgId        = activeOrg?.orgId;

  const [assessmentName, setAssessmentName] = useState('');
  const [problems,       setProblems]       = useState<UiCodingProblem[]>([]);
  const [loadingInit,    setLoadingInit]    = useState(true);
  const [saving,         setSaving]         = useState(false);

  // ── Load from questions collection ────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!orgId || !assessmentId) return;
    try {
      const token = getAccessToken();
      const [asmtRes, qRes] = await Promise.all([
        getAssessmentById(assessmentId, orgId, token),
        listQuestions(assessmentId, orgId, token),
      ]);

      const a = asmtRes.data?.assessment;
      if (!a) return;

      setAssessmentName(a.name);

      if (a.roleType !== 'IT') {
        toast.error('Coding questions are only available for IT role assessments.');
        router.push('/whitecollar/assessments');
        return;
      }

      const codingQs = (qRes.data?.questions ?? [])
        .filter(q => q.type === 'Coding')
        .sort((a, b) => (a.questionSetIndex ?? 0) - (b.questionSetIndex ?? 0));

      if (codingQs.length > 0) {
        setProblems(codingQs.map(fromQuestion));
      }
    } catch {
      toast.error('Failed to load coding questions');
    } finally {
      setLoadingInit(false);
    }
  }, [orgId, assessmentId, router]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const addProblem = () => setProblems(prev => [...prev, emptyProblem(prev.length)]);

  const updateProblem = (id: string, patch: Partial<UiCodingProblem>) =>
    setProblems(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));

  const deleteProblem = (id: string) => setProblems(prev => prev.filter(p => p.id !== id));

  const handleSave = async () => {
    for (let i = 0; i < problems.length; i++) {
      const p = problems[i];
      if (!p.title.trim()) {
        toast.error(`Problem ${i + 1}: title is required.`);
        return;
      }
      if (!p.problemStatement.trim()) {
        toast.error(`Problem ${i + 1}: problem statement is required.`);
        return;
      }
    }

    if (!orgId) return;
    setSaving(true);
    try {
      const token = getAccessToken();

      await bulkReplaceQuestions(
        assessmentId,
        {
          orgId,
          scopeTypes: ['Coding'],
          questions:  problems.map(toQuestion),
        },
        token,
      );

      toast.success('Coding questions saved');
      router.push(`/whitecollar/assessments/${assessmentId}/review`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save coding questions');
    } finally {
      setSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-5 space-y-6">

      {/* Back nav */}
      <button type="button"
        onClick={() => router.push(`/whitecollar/assessments/${assessmentId}/build`)}
        className="inline-flex items-center gap-1.5 text-[13px] text-[#7a7a7a] hover:text-[#1f1f1f] transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to Assessment Questions
      </button>

      {/* Header */}
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#1f1f1f]">
            {loadingInit ? 'Loading…' : `${assessmentName} · Coding Questions`}
          </h2>
          <p className="text-sm text-gray-600 mt-0.5">
            Add coding problems and test cases for your IT-role assessment.
          </p>
        </div>

        <div className="flex gap-3 flex-wrap">
          <Button type="button" variant="outline" onClick={addProblem} disabled={loadingInit}>
            <Plus className="mr-2 h-4 w-4" />
            Add Problem
          </Button>

          {problems.length === 0 && !loadingInit && (
            <Button type="button" variant="outline"
              onClick={() => router.push(`/whitecollar/assessments/${assessmentId}/review`)}>
              Skip to Review
            </Button>
          )}

          {problems.length > 0 && (
            <Button type="button" onClick={handleSave} disabled={saving}
              className="bg-[#ff5723] text-white hover:bg-[#f04d1d]">
              {saving
                ? <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Saving…</>
                : 'Save & Continue to Review'
              }
            </Button>
          )}
        </div>
      </div>

      {/* Loading skeleton */}
      {loadingInit && (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="h-20 animate-pulse rounded border border-neutral-200 bg-neutral-50" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loadingInit && problems.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded border border-dashed border-neutral-300 bg-neutral-50 py-16 text-center">
          <p className="text-[13px] font-medium text-[#1f1f1f]">No coding problems yet</p>
          <p className="mt-1 text-[12px] text-[#9a9a9a]">
            Click &quot;Add Problem&quot; to create your first coding challenge.
          </p>
          <Button type="button"
            className="mt-4 h-9 gap-2 bg-[#ff5723] px-4 text-[13px] font-semibold text-white hover:bg-[#f04d1d]"
            onClick={addProblem}>
            <Plus className="h-4 w-4" />
            Add First Problem
          </Button>
        </div>
      )}

      {/* Problem cards */}
      {!loadingInit && problems.map((p, i) => (
        <CodingProblemCard key={p.id} problem={p} index={i}
          onChange={patch => updateProblem(p.id, patch)}
          onDelete={() => deleteProblem(p.id)} />
      ))}

    </div>
  );
}
