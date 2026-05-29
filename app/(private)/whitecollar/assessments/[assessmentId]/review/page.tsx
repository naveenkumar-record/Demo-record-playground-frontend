'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter }                      from 'next/navigation';
import { ArrowLeft, Edit2, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { toast }   from 'sonner';
import { Button }  from '@/components/ui/button';
import { useOrg }  from '@/components/layout/orgContext';
import { getAssessmentById, publishAssessment, type AssessmentItem } from '@/api/assessment.api';
import { listQuestions, type QuestionItem }                          from '@/api/question.api';
import { listWorkflowSkills }                                        from '@/api/workflow.api';

// ── Helpers ───────────────────────────────────────────────────────────────────

function getAccessToken() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('auth_access_token') ?? '';
}

const Q_TYPE_LABEL: Record<string, string> = {
  'MCQ':          'Multiple Choice',
  'True/False':   'True / False',
  'Short Answer': 'Short Answer',
  'Long Answer':  'Long Answer',
};

type ReviewSection = {
  sectionIndex: number;
  type:         string;
  pointsPerQ:   number;
  questions:    QuestionItem[];
};

function buildSections(questions: QuestionItem[]): ReviewSection[] {
  const map = new Map<number, QuestionItem[]>();
  for (const q of questions) {
    if (q.type === 'Coding') continue;
    const idx = q.questionSetIndex ?? 0;
    if (!map.has(idx)) map.set(idx, []);
    map.get(idx)!.push(q);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a - b)
    .map(([sectionIndex, qs]) => {
      const sorted = [...qs].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      return {
        sectionIndex,
        type:       sorted[0].type,
        pointsPerQ: sorted[0].marks ?? 1,
        questions:  sorted,
      };
    });
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[12px] font-medium text-[#6a6a6a] mb-0.5">{label}</p>
      <p className="text-[13px] text-[#1f1f1f]">{value || '—'}</p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AssessmentReviewPage() {
  const params = useParams();
  const router = useRouter();
  const { activeOrg } = useOrg();

  const assessmentId = params.assessmentId as string;
  const orgId        = activeOrg?.orgId;

  const [assessment,     setAssessment]     = useState<AssessmentItem | null>(null);
  const [sections,       setSections]       = useState<ReviewSection[]>([]);
  const [codingProblems, setCodingProblems] = useState<QuestionItem[]>([]);
  const [skillNames,     setSkillNames]     = useState<string[]>([]);
  const [loadingInit,    setLoadingInit]    = useState(true);
  const [publishing,     setPublishing]     = useState(false);

  // ── Load ──────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!orgId || !assessmentId) return;
    try {
      const token = getAccessToken();
      const [asmtRes, qRes, skillsRes] = await Promise.all([
        getAssessmentById(assessmentId, orgId, token),
        listQuestions(assessmentId, orgId, token),
        listWorkflowSkills(token),
      ]);
      const a    = asmtRes.data?.assessment;
      const qs   = qRes.data?.questions ?? [];
      const all  = skillsRes.data?.skills ?? [];
      if (a) {
        setAssessment(a);
        const names = (a.skills ?? []).map(
          id => all.find(s => s.skillId === id)?.name ?? id,
        );
        setSkillNames(names);
      }
      setSections(buildSections(qs));
      setCodingProblems(
        qs
          .filter(q => q.type === 'Coding')
          .sort((a, b) => (a.questionSetIndex ?? 0) - (b.questionSetIndex ?? 0)),
      );
    } catch {
      toast.error('Failed to load assessment');
    } finally {
      setLoadingInit(false);
    }
  }, [orgId, assessmentId]);

  useEffect(() => { load(); }, [load]);

  // ── Marks tally ───────────────────────────────────────────────────────────
  const knowledgeMarks = sections.flatMap(s => s.questions).reduce((sum, q) => sum + (q.marks ?? 0), 0);
  const codingMarks    = codingProblems.reduce((sum, q) => sum + (q.marks ?? 0), 0);
  const totalAssigned  = knowledgeMarks + codingMarks;
  const requiredMarks  = assessment?.totalMarks ?? 0;
  const isMarksValid   = requiredMarks > 0 && totalAssigned === requiredMarks;

  const backPath = assessment?.roleType === 'IT'
    ? `/whitecollar/assessments/${assessmentId}/coding`
    : `/whitecollar/assessments/${assessmentId}/build`;

  // ── Publish ───────────────────────────────────────────────────────────────
  const handlePublish = async () => {
    if (!orgId || !isMarksValid) return;
    setPublishing(true);
    try {
      await publishAssessment(assessmentId, orgId, getAccessToken());
      toast.success('Assessment published successfully!');
      router.push('/whitecollar/assessments');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to publish');
    } finally {
      setPublishing(false);
    }
  };

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loadingInit) {
    return (
      <div className="p-5 space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 animate-pulse rounded border border-neutral-200 bg-neutral-50" />
        ))}
      </div>
    );
  }

  if (!assessment) {
    return <div className="p-5 text-sm text-gray-500">Assessment not found.</div>;
  }

  const totalQuestions = sections.reduce((n, s) => n + s.questions.length, 0);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-5 space-y-6 pb-4">

      {/* Back nav */}
      <button
        type="button"
        onClick={() => router.push(backPath)}
        className="inline-flex items-center gap-1.5 text-[13px] text-[#7a7a7a] hover:text-[#1f1f1f] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        {assessment.roleType === 'IT' ? 'Back to Coding Questions' : 'Back to Questions'}
      </button>

      {/* Page header */}
      <div>
        <h2 className="text-xl font-bold text-[#1f1f1f]">Review & Publish</h2>
        <p className="text-sm text-gray-600 mt-0.5">
          Review your assessment below. Assigned marks must equal the required total before publishing.
        </p>
      </div>

      {/* Marks tally banner */}
      <div className={`flex items-start gap-3 rounded-lg border p-4 ${
        isMarksValid
          ? 'border-green-200 bg-green-50'
          : 'border-amber-200 bg-amber-50'
      }`}>
        {isMarksValid
          ? <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
          : <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
        }
        <div className="text-[13px] space-y-0.5">
          <p className={`font-semibold ${isMarksValid ? 'text-green-800' : 'text-amber-800'}`}>
            {isMarksValid
              ? 'Marks tally matches — ready to publish!'
              : 'Marks tally does not match — cannot publish yet'
            }
          </p>
          <p className={isMarksValid ? 'text-green-700' : 'text-amber-700'}>
            Assigned: <strong>{totalAssigned}</strong> pts
            {codingProblems.length > 0 && (
              <span className="text-[12px]"> (Knowledge: {knowledgeMarks}, Coding: {codingMarks})</span>
            )}
            {' '}&nbsp;|&nbsp; Required: <strong>{requiredMarks}</strong> pts
          </p>
          {!isMarksValid && requiredMarks > 0 && (
            <p className={`text-[12px] font-medium ${totalAssigned < requiredMarks ? 'text-amber-600' : 'text-red-600'}`}>
              {totalAssigned < requiredMarks
                ? `You need ${requiredMarks - totalAssigned} more pts — go back and adjust question marks.`
                : `You have ${totalAssigned - requiredMarks} pts in excess — reduce question marks or update the total.`
              }
            </p>
          )}
          {requiredMarks === 0 && (
            <p className="text-[12px] text-amber-600 font-medium">
              Total marks not set on this assessment — edit the assessment to set a total.
            </p>
          )}
        </div>
      </div>

      {/* ── Assessment Details ──────────────────────────────────────────── */}
      <section className="rounded-lg border border-neutral-200 bg-white p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-[#1f1f1f]">Assessment Details</h3>
          <button
            type="button"
            onClick={() => router.push('/whitecollar/assessments')}
            className="inline-flex items-center gap-1.5 text-[12px] text-[#7a7a7a] hover:text-[#1f1f1f] border rounded px-2.5 py-1 transition-colors"
          >
            <Edit2 className="h-3.5 w-3.5" />
            Edit
          </button>
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-3">
          <Field label="Assessment Name"  value={assessment.name} />
          <Field label="Role Type"        value={assessment.roleType} />
          <Field label="Job Title"        value={assessment.jobTitle} />
          <Field label="Difficulty"       value={assessment.difficulty} />
          <Field label="Duration"         value={assessment.duration ? `${assessment.duration} min` : ''} />
          <Field label="Experience Range" value={assessment.experienceRange} />
          <Field label="Total Marks"      value={String(assessment.totalMarks ?? '')} />
          <Field label="Pass Marks"       value={String(assessment.passMarks ?? '')} />
          {skillNames.length > 0 && (
            <div className="col-span-2">
              <p className="text-[12px] font-medium text-[#6a6a6a] mb-1">Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {skillNames.map(name => (
                  <span key={name} className="rounded-full border border-neutral-200 px-2.5 py-0.5 text-[12px] text-[#3a3a3a]">
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Knowledge Questions ─────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-[#1f1f1f]">Knowledge Questions</h3>
            <p className="text-[12px] text-[#9a9a9a] mt-0.5">
              {totalQuestions === 0
                ? 'No knowledge questions added'
                : `${totalQuestions} question${totalQuestions !== 1 ? 's' : ''} across ${sections.length} section${sections.length !== 1 ? 's' : ''} · ${knowledgeMarks} pts`
              }
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push(`/whitecollar/assessments/${assessmentId}/build`)}
            className="inline-flex items-center gap-1.5 text-[12px] text-[#7a7a7a] hover:text-[#1f1f1f] border rounded px-2.5 py-1 transition-colors"
          >
            <Edit2 className="h-3.5 w-3.5" />
            Edit
          </button>
        </div>

        {sections.length === 0 ? (
          <div className="rounded border border-dashed border-neutral-200 bg-neutral-50 py-8 text-center text-[12px] text-[#9a9a9a]">
            No knowledge questions added — skipped
          </div>
        ) : (
          sections.map((sec, si) => (
            <div key={si} className="rounded-lg border border-neutral-200 bg-white overflow-hidden">
              {/* Section header */}
              <div className="flex items-center justify-between border-b border-neutral-100 bg-neutral-50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-[13px] font-semibold text-[#1f1f1f]">Section {si + 1}</span>
                  <span className="rounded-full border border-neutral-200 bg-white px-2.5 py-0.5 text-[11px] text-[#6a6a6a]">
                    {Q_TYPE_LABEL[sec.type] ?? sec.type}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-[12px] text-[#6a6a6a]">
                  <span>{sec.pointsPerQ} pt{sec.pointsPerQ !== 1 ? 's' : ''} / question</span>
                  <span className="font-semibold text-[#1f1f1f]">
                    {sec.questions.length * sec.pointsPerQ} pts total
                  </span>
                </div>
              </div>

              {/* Questions */}
              <div className="divide-y divide-neutral-100">
                {sec.questions.map((q, qi) => (
                  <div key={q._id} className="px-4 py-4 space-y-2.5">
                    <p className="text-[13px] font-medium text-[#1f1f1f]">
                      {qi + 1}.&nbsp;{q.question}
                    </p>

                    {/* MCQ / True-False */}
                    {(q.type === 'MCQ' || q.type === 'True/False') && (
                      <div className="space-y-1.5">
                        {q.options.map((opt, oi) => {
                          const correct = opt === q.correctAnswer;
                          return (
                            <div key={oi} className={`flex items-center gap-2.5 rounded border px-3 py-2 text-[13px] ${
                              correct
                                ? 'border-green-400 bg-green-50 text-green-800'
                                : 'border-neutral-200 bg-white text-[#3a3a3a]'
                            }`}>
                              <div className={`h-4 w-4 flex-shrink-0 rounded-full border-2 flex items-center justify-center ${
                                correct ? 'border-green-500 bg-green-500' : 'border-gray-300 bg-white'
                              }`}>
                                {correct && (
                                  <svg className="h-2.5 w-2.5 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                              {opt}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Short / Long answer */}
                    {(q.type === 'Short Answer' || q.type === 'Long Answer') && (
                      <div className="rounded border border-green-200 bg-green-50 px-3 py-2 text-[13px]">
                        <p className="text-[11px] font-semibold text-green-600 mb-1">Sample Answer</p>
                        <p className="text-green-800 whitespace-pre-wrap">{q.correctAnswer || '—'}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </section>

      {/* ── Coding Problems (IT only) ───────────────────────────────────── */}
      {assessment.roleType === 'IT' && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-[#1f1f1f]">Coding Problems</h3>
              <p className="text-[12px] text-[#9a9a9a] mt-0.5">
                {codingProblems.length === 0
                  ? 'No coding problems added'
                  : `${codingProblems.length} problem${codingProblems.length !== 1 ? 's' : ''} · ${codingMarks} pts`
                }
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push(`/whitecollar/assessments/${assessmentId}/coding`)}
              className="inline-flex items-center gap-1.5 text-[12px] text-[#7a7a7a] hover:text-[#1f1f1f] border rounded px-2.5 py-1 transition-colors"
            >
              <Edit2 className="h-3.5 w-3.5" />
              Edit
            </button>
          </div>

          {codingProblems.length === 0 ? (
            <div className="rounded border border-dashed border-neutral-200 bg-neutral-50 py-8 text-center text-[12px] text-[#9a9a9a]">
              No coding problems added — skipped
            </div>
          ) : (
            codingProblems.map((p, pi) => {
              const sampleTc = p.codingTestCases.find(tc => !tc.isHidden);
              return (
                <div key={p._id} className="rounded-lg border border-neutral-200 bg-white overflow-hidden">
                  {/* Problem header */}
                  <div className="flex items-center justify-between border-b border-neutral-100 bg-neutral-50 px-4 py-3">
                    <span className="text-[13px] font-semibold text-[#1f1f1f]">
                      Problem {pi + 1}: {p.title}
                    </span>
                    <span className="text-[12px] font-semibold text-[#1f1f1f]">{p.marks} pts</span>
                  </div>

                  <div className="px-4 py-4 space-y-4 text-[13px]">
                    {/* Allowed languages */}
                    <div>
                      <p className="text-[12px] font-medium text-[#6a6a6a] mb-1.5">Allowed Languages</p>
                      <div className="flex flex-wrap gap-1.5">
                        {p.options.map(lang => (
                          <span key={lang} className="rounded-full border border-[#ff5723] bg-orange-50 px-2.5 py-0.5 text-[12px] text-[#ff5723]">
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Problem statement */}
                    <div>
                      <p className="text-[12px] font-medium text-[#6a6a6a] mb-1.5">Problem Statement</p>
                      <div className="rounded border border-neutral-200 bg-neutral-50 px-3 py-2 text-[13px] text-[#1f1f1f] whitespace-pre-wrap">
                        {p.question || '—'}
                      </div>
                    </div>

                    {/* Sample I/O */}
                    {sampleTc && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[12px] font-medium text-[#6a6a6a] mb-1.5">Sample Input</p>
                          <div className="rounded border border-neutral-200 bg-neutral-50 px-3 py-2 font-mono text-[12px] text-[#1f1f1f] whitespace-pre-wrap min-h-[48px]">
                            {sampleTc.input || '—'}
                          </div>
                        </div>
                        <div>
                          <p className="text-[12px] font-medium text-[#6a6a6a] mb-1.5">Sample Output</p>
                          <div className="rounded border border-neutral-200 bg-neutral-50 px-3 py-2 font-mono text-[12px] text-[#1f1f1f] whitespace-pre-wrap min-h-[48px]">
                            {sampleTc.expectedOutput || '—'}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Reference solution */}
                    {(p.sampleSolution || p.correctAnswer) && (
                      <div className="space-y-3 border-t border-neutral-100 pt-3">
                        <p className="text-[12px] font-semibold text-[#3a3a3a]">Reference Solution</p>
                        {p.sampleSolution && (
                          <div>
                            <p className="text-[12px] font-medium text-[#6a6a6a] mb-1.5">
                              Solution Code
                              {p.programmingLanguage && (
                                <span className="ml-1 text-[#9a9a9a]">({p.programmingLanguage})</span>
                              )}
                            </p>
                            <pre className="rounded border border-neutral-700 bg-[#1e1e2e] px-4 py-3 text-[12px] text-[#cdd6f4] font-mono overflow-x-auto whitespace-pre-wrap max-h-[240px]">
                              {p.sampleSolution}
                            </pre>
                          </div>
                        )}
                        {p.correctAnswer && (
                          <div>
                            <p className="text-[12px] font-medium text-[#6a6a6a] mb-1.5">Solution Explanation</p>
                            <div className="rounded border border-neutral-200 bg-neutral-50 px-3 py-2 text-[13px] whitespace-pre-wrap">
                              {p.correctAnswer}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </section>
      )}

      {/* ── Sticky bottom action bar ────────────────────────────────────── */}
      <div className="sticky bottom-0 border-t border-neutral-200 bg-white px-6 py-3 flex items-center justify-between shadow-sm">
        {/* Marks summary */}
        <div className={`flex items-center gap-2 text-[13px] ${isMarksValid ? 'text-green-700' : 'text-amber-700'}`}>
          {isMarksValid
            ? <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            : <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          }
          <span>
            Assigned <strong>{totalAssigned}</strong> / Required <strong>{requiredMarks}</strong> pts
            {!isMarksValid && requiredMarks > 0 && (
              <span className="ml-2 text-[12px]">
                ({totalAssigned < requiredMarks
                  ? `${requiredMarks - totalAssigned} pts short`
                  : `${totalAssigned - requiredMarks} pts over`
                })
              </span>
            )}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/whitecollar/assessments')}
          >
            Save as Draft
          </Button>
          <Button
            type="button"
            onClick={handlePublish}
            disabled={!isMarksValid || publishing}
            className={
              isMarksValid
                ? 'bg-[#ff5723] text-white hover:bg-[#f04d1d]'
                : 'cursor-not-allowed bg-neutral-200 text-neutral-400 hover:bg-neutral-200'
            }
          >
            {publishing
              ? <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Publishing…</>
              : 'Save & Publish'
            }
          </Button>
        </div>
      </div>

    </div>
  );
}
