"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  getRequestDetail,
  resendLog,
  type RequestDetail,
  type VideoItem,
  type QuestionSummaryItem,
} from "@/api/bluecollar.api";
import { useTestMode } from "@/components/layout/testModeContext";
import { getAccessToken } from "@/lib/auth-client";
import { toast } from "sonner";

// ── helpers ────────────────────────────────────────────────────────────────────

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `00:${m}:${s}`;
}

function ratingColor(rating: string) {
  if (rating === "Strong") return "text-green-600";
  if (rating === "Good") return "text-blue-600";
  if (rating === "Average") return "text-amber-600";
  if (rating === "Weak") return "text-red-500";
  return "text-neutral-500";
}

// ── video player ───────────────────────────────────────────────────────────────

function VideoPlayer({ video }: { video: VideoItem | undefined }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.pause();
    el.load();
  }, [video?.videoUrl]);

  if (!video?.videoUrl) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-xl border border-neutral-200 bg-neutral-900">
        <div className="text-center text-neutral-500">
          <svg className="mx-auto h-10 w-10" fill="currentColor" viewBox="0 0 24 24">
            <path d="M4 4h10a2 2 0 012 2v3.5l4-2.5v9l-4-2.5V18a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z" />
          </svg>
          <p className="mt-2 text-[12px]">No video</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full overflow-hidden rounded-xl bg-black">
      {video.durationSeconds > 0 && (
        <div className="absolute right-2 top-2 z-10 rounded bg-red-600 px-2 py-0.5">
          <span className="font-mono text-[11px] font-bold text-white">
            {formatDuration(video.durationSeconds)}
          </span>
        </div>
      )}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        ref={videoRef}
        className="h-full w-full object-cover"
        controls
        preload="metadata"
        playsInline
      >
        <source src={video.videoUrl} type="video/webm" />
      </video>
    </div>
  );
}

// ── verdict icon ───────────────────────────────────────────────────────────────

function VerdictIcon({ verdict }: { verdict: string }) {
  const isPlace = verdict === "Place";
  const isReview = verdict === "Review";

  // Three-layer ring: outermost (very pale) → middle (pale) → solid circle
  const outer  = isPlace ? "bg-green-100"  : isReview ? "bg-amber-100"  : "bg-red-100";
  const mid    = isPlace ? "bg-green-200"  : isReview ? "bg-amber-200"  : "bg-red-200";
  const solid  = isPlace ? "bg-green-500"  : isReview ? "bg-amber-500"  : "bg-red-500";

  return (
    /* outermost pale ring */
    <div className={cn("flex h-16 w-16 shrink-0 items-center justify-center rounded-full", outer)}>
      {/* middle ring */}
      <div className={cn("flex h-12 w-12 items-center justify-center rounded-full", mid)}>
        {/* solid inner circle */}
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-full", solid)}>
          {isPlace ? (
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : isReview ? (
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01" />
            </svg>
          ) : (
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}

// ── skeleton ───────────────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="min-h-full bg-white">
      <div className="border-b border-neutral-100 px-6 py-3">
        <div className="h-4 w-48 animate-pulse rounded bg-neutral-100" />
      </div>
      <div className="space-y-6 px-6 py-5">
        <div className="h-8 w-40 animate-pulse rounded bg-neutral-200" />
        <div className="grid grid-cols-5 gap-4 rounded-lg border border-neutral-100 bg-neutral-50 px-5 py-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i}>
              <div className="h-3 w-20 animate-pulse rounded bg-neutral-200" />
              <div className="mt-1.5 h-4 w-28 animate-pulse rounded bg-neutral-100" />
            </div>
          ))}
        </div>
        <div className="flex gap-5">
          <div className="flex-1 space-y-4">
            <div className="h-28 animate-pulse rounded-xl bg-neutral-100" />
            <div className="h-40 animate-pulse rounded-xl bg-neutral-100" />
          </div>
          <div className="w-[260px] animate-pulse rounded-xl bg-neutral-100" />
        </div>
      </div>
    </div>
  );
}

// ── main ───────────────────────────────────────────────────────────────────────

export default function CandidateDetailPage() {
  const router = useRouter();
  const params = useParams<{ candidateId: string }>();
  const candidateId = params.candidateId;
  const { isTestMode } = useTestMode();
  const mode = isTestMode ? "test" : "live";

  const [detail,         setDetail]         = useState<RequestDetail | null>(null);
  const [loading,        setLoading]        = useState(true);
  const [notFound,       setNotFound]       = useState(false);
  const [resending,      setResending]      = useState(false);
  const [selectedQIndex, setSelectedQIndex] = useState(0);

  const handleResend = async () => {
    if (!candidateId) return;
    const token = getAccessToken();
    if (!token) return;
    setResending(true);
    try {
      await resendLog(candidateId, mode, token);
      toast.success("WhatsApp message resent successfully");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to resend");
    } finally {
      setResending(false);
    }
  };

  useEffect(() => {
    if (!candidateId) return;
    const token = getAccessToken();
    if (!token) return;

    const controller = new AbortController();
    setLoading(true);
    setNotFound(false);
    setDetail(null);

    getRequestDetail(candidateId, mode, token, controller.signal)
      .then((res) => {
        if (res.data) {
          setDetail(res.data);
        } else {
          setNotFound(true);
        }
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        const msg = err instanceof Error ? err.message : "";
        if (msg.toLowerCase().includes("not found") || msg.includes("404")) {
          setNotFound(true);
        } else {
          toast.error(msg || "Failed to load candidate");
          setNotFound(true);
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [candidateId, mode]);

  if (loading) return <LoadingSkeleton />;

  if (notFound || !detail) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
          <svg className="h-8 w-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-[16px] font-semibold text-[#1f1f1f]">Candidate not found</p>
          <p className="mt-1 text-[13px] text-[#9a9a9a]">
            This candidate doesn&apos;t exist or belongs to a different mode.
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push("/bluecollar/requests")}>
          Back to Requests
        </Button>
      </div>
    );
  }

  const result = detail.result;
  const sortedQuestions: QuestionSummaryItem[] = [...(result?.questions ?? [])].sort(
    (a, b) => a.index - b.index,
  );

  const activeQuestion = sortedQuestions[selectedQIndex] ?? sortedQuestions[0];
  const activeVideo: VideoItem | undefined = activeQuestion
    ? detail.videos.find((v) => v.questionIndex === activeQuestion.index)
    : detail.videos[0];

  const verdictColor =
    result?.verdict === "Place"
      ? "text-green-600"
      : result?.verdict === "Review"
      ? "text-amber-600"
      : "text-red-500";

  // Card theming driven by verdict
  const verdictTheme = {
    Place: {
      card: "border-green-200 bg-green-50",
      metricBox: "border-green-300 bg-white",
      metricLabel: "text-green-700",
      metricValue: "text-green-700",
    },
    Review: {
      card: "border-amber-200 bg-amber-50",
      metricBox: "border-amber-300 bg-white",
      metricLabel: "text-amber-700",
      metricValue: "text-amber-700",
    },
    "Do Not Place": {
      card: "border-red-200 bg-red-50",
      metricBox: "border-red-300 bg-white",
      metricLabel: "text-red-700",
      metricValue: "text-red-700",
    },
  } as const;

  const theme = result ? verdictTheme[result.verdict] : null;

  return (
    <div className="min-h-full bg-white">
      {/* Breadcrumb */}
      <div className="border-b border-neutral-100 px-6 py-3">
        <p className="text-[12px] text-[#7a7a7a]">
          <button
            type="button"
            className="cursor-pointer hover:text-[#1f1f1f]"
            onClick={() => router.push("/bluecollar/requests")}
          >
            Requests
          </button>
          <span className="mx-1.5 text-neutral-300">&rsaquo;</span>
          <span className="text-[#1f1f1f]">Detailed View</span>
        </p>
      </div>

      <div className="space-y-6 px-6 py-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="cursor-pointer text-[#4a4a4a] hover:text-[#1f1f1f]"
              onClick={() => router.push("/bluecollar/requests")}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-[20px] font-semibold text-[#1f1f1f]">{detail.name}</h1>
          </div>
          <Button
            variant="outline"
            className="flex cursor-pointer items-center gap-1.5 text-[13px]"
            disabled={resending}
            onClick={handleResend}
          >
            {resending ? "Sending..." : "Resend"}
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Candidate info strip */}
        <div className="grid grid-cols-5 gap-4 rounded-lg border border-neutral-100 bg-neutral-50 px-5 py-4">
          {[
            { label: "Candidate Name", value: detail.name },
            { label: "Phone", value: detail.phoneNumber },
            { label: "Workflow", value: detail.workflowName },
            {
              label: "Verified on",
              value: detail.completedAt ? formatDate(detail.completedAt) : "—",
            },
            { label: "Language", value: detail.language || "—" },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-[11px] text-[#9a9a9a]">{label}</p>
              <p className="mt-0.5 text-[13px] font-medium text-[#1f1f1f]">{value}</p>
            </div>
          ))}
        </div>

        {/* ── MAIN BODY: left stack + tall video ─────────────────────────────── */}
        <div className="flex gap-5">
          {/* Left column — verdict + key signals stacked */}
          <div className="flex flex-1 flex-col gap-5 min-w-0">
            {/* Verdict card */}
            <div className={cn("rounded-xl border p-5", theme ? theme.card : "border-neutral-200 bg-white")}>
              {result && theme ? (
                <div className="flex items-center gap-5">
                  {/* Icon with double-ring glow */}
                  <VerdictIcon verdict={result.verdict} />

                  {/* Label + verdict text */}
                  <div>
                    <p className="text-[12px] text-[#7a7a7a]">Verdict</p>
                    <p className={cn("text-[22px] font-bold leading-tight", verdictColor)}>
                      {result.verdict}
                    </p>
                  </div>

                  {/* Metric boxes — pushed to the far right */}
                  <div className="ml-auto flex gap-3">
                    <div className={cn("rounded-lg border px-5 py-2.5 text-center", theme.metricBox)}>
                      <p className={cn("text-[11px] font-medium", theme.metricLabel)}>Skills Score</p>
                      <p className={cn("mt-0.5 text-[17px] font-bold", theme.metricValue)}>
                        {result.skillScore}%
                      </p>
                    </div>
                    <div className={cn("rounded-lg border px-5 py-2.5 text-center", theme.metricBox)}>
                      <p className={cn("text-[11px] font-medium", theme.metricLabel)}>Trust Level</p>
                      <p className={cn("mt-0.5 text-[17px] font-bold", theme.metricValue)}>
                        {result.trustLevel}
                      </p>
                    </div>
                  </div>
                </div>
              ) : detail.status === "completed" ? (
                /* completed but result still being generated */
                <div className="flex items-center gap-4 py-2">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-50">
                    <svg className="h-5 w-5 animate-spin text-[#ff5723]" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-[#1f1f1f]">Generating result…</p>
                    <p className="text-[12px] text-[#9a9a9a]">
                      AI is evaluating the videos. This usually takes under a minute.
                    </p>
                  </div>
                </div>
              ) : (
                /* not yet completed */
                <div className="flex items-center gap-4 py-2">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100">
                    <svg className="h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-[#4a4a4a]">Awaiting completion</p>
                    <p className="text-[12px] text-[#9a9a9a]">
                      Result will appear once the candidate finishes the verification.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Key signals */}
            {result && result.keySignals.length > 0 && (
              <div className="flex-1">
                <h2 className="mb-3 text-[14px] font-semibold text-[#1f1f1f]">
                  Key signals from conversation
                </h2>
                <div className="space-y-3">
                  {result.keySignals.map((signal) => (
                    <div
                      key={signal.title}
                      className="rounded-lg border border-neutral-200 px-4 py-3.5"
                    >
                      <p className="text-[12px] font-medium text-[#9a9a9a]">{signal.title}</p>
                      <p className="mt-1 text-[13px] leading-[1.65] text-[#1f1f1f]">
                        {signal.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right column — tall video spanning verdict + key signals */}
          <div className="w-[260px] shrink-0 self-stretch">
            <VideoPlayer video={activeVideo} />
          </div>
        </div>

        {/* ── BOTTOM: skill breakdown + Q-by-Q ───────────────────────────────── */}
        {result && (
          <div className="grid grid-cols-[220px_1fr] gap-6 pb-8">
            {/* Skill breakdown — box cards */}
            <div>
              <h2 className="mb-3 text-[14px] font-semibold text-[#1f1f1f]">Skill breakdown</h2>
              <div className="space-y-2">
                {result.skillBreakdown.map(({ skill, rating }) => (
                  <div
                    key={skill}
                    className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-4 py-3"
                  >
                    <p className="text-[13px] text-[#4a4a4a]">{skill}</p>
                    <span className={cn("shrink-0 text-[12px] font-semibold", ratingColor(rating))}>
                      {rating}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Q-by-Q summary — orange highlight on active */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[14px] font-semibold text-[#1f1f1f]">
                  Question-by-Question Summary
                </h2>
                <span className="rounded-full bg-neutral-100 px-3 py-0.5 text-[12px] text-[#6a6a6a]">
                  {sortedQuestions.length} Question{sortedQuestions.length !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="space-y-3">
                {sortedQuestions.map((q, idx) => {
                  const isActive = idx === selectedQIndex;
                  return (
                    <button
                      key={q.index}
                      type="button"
                      onClick={() => setSelectedQIndex(idx)}
                      className={cn(
                        "w-full rounded-lg border px-4 py-4 text-left transition-colors",
                        isActive
                          ? "border-[#ff5723] bg-orange-50"
                          : "border-neutral-200 bg-white hover:bg-neutral-50",
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-[11px]", isActive ? "text-[#ff5723]" : "text-[#9a9a9a]")}>
                            Q{q.index} - {q.category}
                          </p>
                          <p className="mt-1 text-[13px] font-semibold text-[#1f1f1f]">
                            {q.question}
                          </p>
                        </div>
                        <span className={cn("mt-0.5 shrink-0 text-[12px] font-semibold", ratingColor(q.rating))}>
                          {q.rating}
                        </span>
                      </div>
                      <p className="mt-2 text-[13px] leading-[1.65] text-[#6a6a6a]">{q.summary}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* No result — show raw videos */}
        {!result && detail.videos.length > 0 && (
          <div className="pb-8">
            <h2 className="mb-3 text-[14px] font-semibold text-[#1f1f1f]">Recorded Videos</h2>
            <div className="grid grid-cols-3 gap-4">
              {detail.videos.map((v) => (
                <div key={v.questionIndex} className="aspect-video">
                  <p className="mb-1 text-[12px] text-[#7a7a7a]">Question {v.questionIndex}</p>
                  <VideoPlayer video={v} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
