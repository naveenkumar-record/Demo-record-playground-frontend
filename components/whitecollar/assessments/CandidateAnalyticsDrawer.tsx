"use client";

import { useEffect, useState } from "react";
import { X, Shield, Clock, CheckCircle2, XCircle, AlertTriangle, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCandidateSession, type CandidateSession, type Violation } from "@/api/assessmentAssignment.api";

// ── Helpers ───────────────────────────────────────────────────────────────────

function getToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("auth_access_token") ?? "";
}

function formatDuration(start?: string, end?: string): string {
  if (!start || !end) return "—";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms <= 0) return "—";
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatTime(iso?: string): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  }).format(new Date(iso));
}

// ── Score ring ────────────────────────────────────────────────────────────────

function ScoreRing({ score, size = 96 }: { score: number; size?: number }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 70 ? "#10b981" : score >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={10} />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth={10}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
    </svg>
  );
}

// ── Proctoring stat row ───────────────────────────────────────────────────────

function ProcRow({ label, value, bad }: { label: string; value: number; bad?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-[12px] text-[#6a6a6a]">{label}</span>
      <span className={cn(
        "text-[13px] font-semibold",
        bad && value > 0 ? "text-red-500" : "text-[#1f1f1f]",
      )}>
        {value}
      </span>
    </div>
  );
}

// ── Violation badge ───────────────────────────────────────────────────────────

const SEV_STYLE: Record<string, string> = {
  high:   "bg-red-50 text-red-500 border-red-200",
  medium: "bg-amber-50 text-amber-600 border-amber-200",
  low:    "bg-neutral-50 text-neutral-500 border-neutral-200",
};

function ViolationRow({ v, i }: { v: Violation; i: number }) {
  return (
    <div className="flex items-center gap-3 border-b border-neutral-100 py-2.5 last:border-0">
      <span className="w-5 text-[11px] text-[#bbb]">#{i + 1}</span>
      <div className="flex-1">
        <p className="text-[12px] font-medium text-[#1f1f1f]">
          {v.type.replace(/_/g, " ")}
        </p>
        <p className="text-[11px] text-[#9a9a9a]">{formatTime(v.timestamp)}</p>
      </div>
      <span className={cn(
        "rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize",
        SEV_STYLE[v.severity] ?? SEV_STYLE.low,
      )}>
        {v.severity}
      </span>
    </div>
  );
}

// ── Main Drawer ───────────────────────────────────────────────────────────────

type Props = {
  candidateId:   string | null;
  candidateName: string;
  onClose:       () => void;
};

export default function CandidateAnalyticsDrawer({ candidateId, candidateName, onClose }: Props) {
  const [session,      setSession]      = useState<CandidateSession | null>(null);
  const [loading,      setLoading]      = useState(false);
  const [violationsOpen, setViolationsOpen] = useState(false);
  const [answersOpen,    setAnswersOpen]    = useState(false);

  useEffect(() => {
    if (!candidateId) { setSession(null); return; }
    setLoading(true);
    setSession(null);
    setViolationsOpen(false);
    setAnswersOpen(false);
    getCandidateSession(candidateId, getToken())
      .then((res) => setSession(res.data?.session ?? null))
      .catch(() => setSession(null))
      .finally(() => setLoading(false));
  }, [candidateId]);

  const open = !!candidateId;

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[1px]"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div className={cn(
        "fixed right-0 top-0 z-50 flex h-full w-full max-w-[520px] flex-col bg-white shadow-2xl transition-transform duration-300",
        open ? "translate-x-0" : "translate-x-full",
      )}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-5">
          <div>
            <p className="text-[15px] font-semibold text-[#1f1f1f]">{candidateName}</p>
            <p className="text-[12px] text-[#8a8a8a]">Candidate Analytics</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-neutral-100"
          >
            <X className="h-4 w-4 text-[#6a6a6a]" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading && (
            <div className="flex h-full items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-200 border-t-[#ff5723]" />
            </div>
          )}

          {!loading && !session && (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
              <AlertTriangle className="h-8 w-8 text-neutral-300" />
              <p className="text-[13px] text-[#8a8a8a]">No session data found for this candidate.</p>
            </div>
          )}

          {!loading && session && (() => {
            const p = session.proctoring;
            const score = session.score ?? 0;
            const scoreColor = score >= 70 ? "text-emerald-600" : score >= 40 ? "text-amber-500" : "text-red-500";
            const procScore = p?.proctoringScore ?? null;
            const procColor = procScore === null ? "text-neutral-400" : procScore >= 70 ? "text-emerald-600" : procScore >= 40 ? "text-amber-500" : "text-red-500";
            const duration = formatDuration(session.startTime, session.endTime);
            const violations = p?.violations ?? [];

            return (
              <div className="space-y-5">

                {/* Score + Result row */}
                <div className="flex items-center gap-5 rounded-xl border border-neutral-200 bg-neutral-50 px-5 py-4">
                  <div className="relative">
                    <ScoreRing score={score} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={cn("text-[20px] font-bold leading-none", scoreColor)}>{score}%</span>
                      <span className="text-[10px] text-[#9a9a9a]">score</span>
                    </div>
                  </div>

                  <div className="flex-1 space-y-2">
                    {/* Pass / Fail */}
                    <div className="flex items-center gap-2">
                      {session.passed ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[13px] font-semibold text-emerald-600">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Pass
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-[13px] font-semibold text-red-500">
                          <XCircle className="h-3.5 w-3.5" /> Fail
                        </span>
                      )}
                      <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[12px] capitalize text-[#5a5a5a]">
                        {session.status.replace(/_/g, " ")}
                      </span>
                    </div>

                    {/* Duration + time */}
                    <div className="flex items-center gap-1.5 text-[12px] text-[#6a6a6a]">
                      <Clock className="h-3.5 w-3.5 text-neutral-400" />
                      <span>{duration}</span>
                      {session.submittedAt && (
                        <>
                          <span className="text-neutral-300">·</span>
                          <span>Submitted {formatTime(session.submittedAt)}</span>
                        </>
                      )}
                    </div>

                    {/* Identity */}
                    <div className="flex items-center gap-1.5 text-[12px]">
                      <Shield className="h-3.5 w-3.5 text-neutral-400" />
                      <span className={session.identityVerified ? "text-emerald-600" : "text-neutral-400"}>
                        {session.identityVerified ? "Identity verified" : "Identity not verified"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Proctoring + AI Feedback */}
                <div className="grid grid-cols-2 gap-4">

                  {/* Proctoring */}
                  {p && (
                    <div className="rounded-xl border border-neutral-200 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-[13px] font-semibold text-[#1f1f1f]">Proctoring</p>
                        <span className={cn("text-[18px] font-bold", procColor)}>
                          {procScore ?? "—"}
                          <span className="text-[11px] font-normal text-[#9a9a9a]">/100</span>
                        </span>
                      </div>
                      {/* Proctoring score bar */}
                      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-neutral-100">
                        <div
                          className={cn("h-full rounded-full", (procScore ?? 0) >= 70 ? "bg-emerald-500" : (procScore ?? 0) >= 40 ? "bg-amber-400" : "bg-red-400")}
                          style={{ width: `${procScore ?? 0}%`, transition: "width 0.6s ease" }}
                        />
                      </div>
                      <div className="divide-y divide-neutral-100">
                        <ProcRow label="Tab switches"      value={p.tabSwitchCount}      bad />
                        <ProcRow label="Fullscreen exits"  value={p.fullscreenExitCount}  bad />
                        <ProcRow label="Look away"         value={p.lookawayCount}        bad />
                        <ProcRow label="No face"           value={p.noFaceCount}          bad />
                        <ProcRow label="Multiple faces"    value={p.multipleFaceCount}    bad />
                        <ProcRow label="External objects"  value={p.externalObjectCount}  bad />
                      </div>
                    </div>
                  )}

                  {/* AI Feedback */}
                  {session.aiFeedback && (
                    <div className="rounded-xl border border-neutral-200 p-4">
                      <p className="mb-2 text-[13px] font-semibold text-[#1f1f1f]">AI Feedback</p>
                      <p className="text-[12px] leading-relaxed text-[#5a5a5a]">{session.aiFeedback}</p>
                    </div>
                  )}
                </div>

                {/* Violations */}
                {violations.length > 0 && (
                  <div className="rounded-xl border border-neutral-200">
                    <button
                      type="button"
                      onClick={() => setViolationsOpen((v) => !v)}
                      className="flex w-full items-center justify-between px-4 py-3 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        <span className="text-[13px] font-semibold text-[#1f1f1f]">
                          Violations
                        </span>
                        <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-500">
                          {violations.length}
                        </span>
                      </div>
                      {violationsOpen
                        ? <ChevronDown className="h-4 w-4 text-neutral-400" />
                        : <ChevronRight className="h-4 w-4 text-neutral-400" />
                      }
                    </button>
                    {violationsOpen && (
                      <div className="border-t border-neutral-100 px-4 pb-2">
                        {violations.map((v, i) => (
                          <ViolationRow key={i} v={v} i={i} />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Answers */}
                {session.answers && session.answers.length > 0 && (
                  <div className="rounded-xl border border-neutral-200">
                    <button
                      type="button"
                      onClick={() => setAnswersOpen((v) => !v)}
                      className="flex w-full items-center justify-between px-4 py-3 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-[#1f1f1f]">Answers</span>
                        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] text-[#6a6a6a]">
                          {session.answers.length}
                        </span>
                      </div>
                      {answersOpen
                        ? <ChevronDown className="h-4 w-4 text-neutral-400" />
                        : <ChevronRight className="h-4 w-4 text-neutral-400" />
                      }
                    </button>
                    {answersOpen && (
                      <div className="space-y-3 border-t border-neutral-100 px-4 py-3">
                        {session.answers.map((a, i) => (
                          <div key={i} className="rounded-lg bg-neutral-50 px-4 py-3">
                            <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-[#9a9a9a]">
                              Q{i + 1} · {a.questionId}
                            </p>
                            <p className="whitespace-pre-wrap font-mono text-[12px] text-[#1f1f1f]">
                              {a.answer || <span className="text-[#bbb] italic">No answer</span>}
                            </p>
                            {a.timeSpent > 0 && (
                              <p className="mt-1.5 text-[11px] text-[#9a9a9a]">{a.timeSpent}s spent</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </div>
            );
          })()}
        </div>
      </div>
    </>
  );
}
