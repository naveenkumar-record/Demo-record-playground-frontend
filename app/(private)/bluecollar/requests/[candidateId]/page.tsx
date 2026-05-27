"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SkillRating = "Strong" | "Good" | "Average" | "Present" | "Verified";
type QuestionRating = "Strong" | "Average" | "Weak";

const SKILL_BREAKDOWN: { skill: string; rating: SkillRating }[] = [
  { skill: "Picking process knowledge", rating: "Strong" },
  { skill: "Error handling", rating: "Good" },
  { skill: "Speed and target awareness", rating: "Average" },
  { skill: "Floor safety awareness", rating: "Present" },
  { skill: "Experience authenticity", rating: "Verified" },
];

const QUESTIONS: { code: string; category: string; question: string; rating: QuestionRating; answer: string }[] = [
  {
    code: "Q1",
    category: "Picking process",
    question: "What do you do when the item on your pick list is not in the bin?",
    rating: "Strong",
    answer: "Described checking alternate bin, scanning location to confirm, raising a short-pick in system, and informing supervisor -- in sequence.",
  },
  {
    code: "Q2",
    category: "Picking standards",
    question: "How do you pack a fragile item differently from a normal item?",
    rating: "Strong",
    answer: "Mentioned bubble wrap, box sizing, void fill, double taping, marking fragile on all sides, and trolley placement order.",
  },
  {
    code: "Q3",
    category: "Target awareness",
    question: "How many orders do you pick on a normal day and during peak season?",
    rating: "Average",
    answer: "Gave specific numbers with context -- 180 normal, 280 during Diwali, with overtime. Numbers are realistic for her warehouse type.",
  },
];

const KEY_SIGNALS = [
  {
    title: "Failure memory detected",
    body: "Described a mispick incident at her last job and the exact step she took to catch it at the scan stage before sealing.",
  },
  {
    title: "Spontaneous details",
    body: "Unprompted, mentioned that Diwali season targets were 280 per day and overtime was common. Consistent with her calmed 4 years.",
  },
  {
    title: "Anchor re-probe passed",
    body: "Correctly described daily routine at Amazon Fulfillment Hosur -- shift timing, zone assignment, and briefing process.",
  },
];

function SkillRatingBadge({ rating }: { rating: SkillRating }) {
  return (
    <span
      className={cn(
        "text-[12px] font-medium",
        rating === "Strong" && "text-green-600",
        rating === "Good" && "text-blue-600",
        rating === "Average" && "text-amber-600",
        rating === "Present" && "text-teal-600",
        rating === "Verified" && "text-indigo-600",
      )}
    >
      {rating}
    </span>
  );
}

function QuestionRatingBadge({ rating }: { rating: QuestionRating }) {
  return (
    <span
      className={cn(
        "shrink-0 text-[12px] font-semibold",
        rating === "Strong" && "text-green-600",
        rating === "Average" && "text-amber-600",
        rating === "Weak" && "text-red-500",
      )}
    >
      {rating}
    </span>
  );
}

export default function CandidateDetailPage() {
  const router = useRouter();

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

      <div className="px-6 py-5 space-y-6">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="cursor-pointer text-[#4a4a4a] hover:text-[#1f1f1f]"
              onClick={() => router.push("/bluecollar/requests")}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-[20px] font-semibold text-[#1f1f1f]">Tony</h1>
          </div>
          <Button
            variant="outline"
            className="flex cursor-pointer items-center gap-1.5 text-[13px]"
          >
            Resend
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Candidate info strip */}
        <div className="grid grid-cols-5 gap-4 rounded-lg border border-neutral-100 bg-neutral-50 px-5 py-4">
          {[
            { label: "Candidate Name", value: "tony" },
            { label: "Phone", value: "+91 0987654321" },
            { label: "Workflow", value: "Warehouse Staff" },
            { label: "Verified on", value: "25 May 2026" },
            { label: "Language", value: "Tamil" },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-[11px] text-[#9a9a9a]">{label}</p>
              <p className="mt-0.5 text-[13px] font-medium text-[#1f1f1f]">{value}</p>
            </div>
          ))}
        </div>

        {/* Top section: verdict + video */}
        <div className="grid grid-cols-[1fr_280px] gap-5">
          {/* Verdict card */}
          <div className="rounded-xl border border-neutral-200 p-5">
            <div className="flex items-center gap-5">
              {/* Green circle checkmark */}
              <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-green-100">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              {/* Verdict label */}
              <div>
                <p className="text-[12px] text-[#7a7a7a]">Verdict</p>
                <p className="text-[22px] font-bold text-green-600">Place</p>
              </div>
              {/* Metrics */}
              <div className="ml-4 flex gap-3">
                <div className="rounded-lg border border-neutral-200 px-4 py-3 text-center">
                  <p className="text-[11px] text-[#7a7a7a]">Skills Score</p>
                  <p className="mt-0.5 text-[18px] font-bold text-[#1f1f1f]">72%</p>
                </div>
                <div className="rounded-lg border border-neutral-200 px-4 py-3 text-center">
                  <p className="text-[11px] text-[#7a7a7a]">Trust Level</p>
                  <p className="mt-0.5 text-[18px] font-bold text-[#1f1f1f]">Medium</p>
                </div>
                <div className="rounded-lg border border-neutral-200 px-4 py-3 text-center">
                  <p className="text-[11px] text-[#7a7a7a]">Experience</p>
                  <p className="mt-0.5 text-[18px] font-bold text-[#1f1f1f]">3 to 5 yrs</p>
                </div>
              </div>
            </div>
          </div>

          {/* Video thumbnail */}
          <div className="relative overflow-hidden rounded-xl border-2 border-red-500 bg-neutral-900">
            <div className="aspect-[4/3] w-full bg-neutral-800">
              <div className="flex h-full items-center justify-center text-neutral-600">
                <svg className="h-12 w-12" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4 4h10a2 2 0 012 2v3.5l4-2.5v9l-4-2.5V18a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z" />
                </svg>
              </div>
            </div>
            {/* Timer overlay */}
            <div className="absolute right-2 top-2 rounded bg-red-600 px-2 py-0.5">
              <span className="font-mono text-[11px] font-bold text-white">00:00:03</span>
            </div>
          </div>
        </div>

        {/* Key signals */}
        <div>
          <h2 className="mb-3 text-[14px] font-semibold text-[#1f1f1f]">Key signals from conversation</h2>
          <div className="space-y-3">
            {KEY_SIGNALS.map((signal) => (
              <div key={signal.title} className="rounded-lg border border-neutral-200 bg-white px-4 py-4">
                <p className="text-[13px] font-semibold text-[#1f1f1f]">{signal.title}</p>
                <p className="mt-1.5 text-[13px] leading-6 text-[#6a6a6a]">{signal.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Skill breakdown + Q&A */}
        <div className="grid grid-cols-[200px_1fr] gap-6">
          {/* Skill breakdown */}
          <div>
            <h2 className="mb-3 text-[14px] font-semibold text-[#1f1f1f]">Skill breakdown</h2>
            <div className="space-y-3">
              {SKILL_BREAKDOWN.map(({ skill, rating }) => (
                <div key={skill} className="flex items-center justify-between">
                  <p className="text-[13px] text-[#4a4a4a]">{skill}</p>
                  <SkillRatingBadge rating={rating} />
                </div>
              ))}
            </div>
          </div>

          {/* Question-by-Question Summary */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[14px] font-semibold text-[#1f1f1f]">Question-by-Question Summary</h2>
              <span className="rounded-full bg-neutral-100 px-3 py-0.5 text-[12px] text-[#6a6a6a]">
                3 Questions
              </span>
            </div>
            <div className="space-y-4">
              {QUESTIONS.map((q) => (
                <div key={q.code} className="rounded-lg border border-neutral-200 px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-[11px] font-medium text-[#9a9a9a]">
                        {q.code} - {q.category}
                      </p>
                      <p className="mt-1 text-[13px] font-semibold text-[#1f1f1f]">{q.question}</p>
                    </div>
                    <QuestionRatingBadge rating={q.rating} />
                  </div>
                  <p className="mt-2 text-[13px] leading-6 text-[#6a6a6a]">{q.answer}</p>
                </div>
              ))}
              <button
                type="button"
                className="cursor-pointer text-[13px] font-medium text-[#ff5723] hover:underline"
              >
                View all
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
