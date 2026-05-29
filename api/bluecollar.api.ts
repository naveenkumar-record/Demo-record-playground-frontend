import { getRequest } from "@/config/http.config";
import apiPathConstants from "@/constants/api-path.constants";

// ── shared types ───────────────────────────────────────────────────────────────

export type RequestStatus = "Completed" | "Sent" | "Expired";
export type TrustBadge = "High Trust" | "Low Trust" | "Pending";
export type Verdict = "Place" | "Review" | "Do Not Place";
export type TrustLevel = "High" | "Medium" | "Low";
export type SkillRating = "Strong" | "Good" | "Average" | "Weak";
export type QuestionRating = "Strong" | "Average" | "Weak";

// ── list ───────────────────────────────────────────────────────────────────────

export type RequestListItem = {
  candidateId: string;
  candidateName: string;
  phoneNumber: string;
  role: string;
  status: RequestStatus;
  workflowId: string;
  workflowName: string;
  requestedOn: string;
  verdict: Verdict | null;
  skillScore: number | null;
  trustLevel: TrustLevel | null;
  trustBadge: TrustBadge;
};

export type RequestListResponse = {
  requests: RequestListItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export type RequestFilters = {
  workflowId?: string;
  status?: string;
  trustLevel?: string;
};

export const listRequests = (
  orgId: string,
  page: number,
  limit: number,
  accessToken: string,
  filters?: RequestFilters,
  signal?: AbortSignal,
) => {
  const params: Record<string, string> = {
    orgId,
    page: String(page),
    limit: String(limit),
  };
  if (filters?.workflowId) params.workflowId = filters.workflowId;
  if (filters?.status) params.status = filters.status;
  if (filters?.trustLevel) params.trustLevel = filters.trustLevel;

  return getRequest<RequestListResponse>(apiPathConstants.bluecollar.requests, {
    accessToken,
    signal,
    params,
  });
};

// ── detail ─────────────────────────────────────────────────────────────────────

export type KeySignal = { title: string; description: string };
export type SkillBreakdownItem = { skill: string; rating: SkillRating };
export type QuestionSummaryItem = {
  index: number;
  category: string;
  question: string;
  transcript: string;
  rating: QuestionRating;
  summary: string;
};
export type VideoItem = {
  questionIndex: number;
  videoUrl: string;
  durationSeconds: number;
};

export type InterviewResult = {
  verdict: Verdict;
  skillScore: number;
  trustLevel: TrustLevel;
  keySignals: KeySignal[];
  skillBreakdown: SkillBreakdownItem[];
  questions: QuestionSummaryItem[];
};

export type RequestDetail = {
  candidateId: string;
  name: string;
  phoneNumber: string;
  role: string;
  workflowId: string;
  workflowName: string;
  status: string;
  language: string;
  completedAt: string | null;
  createdAt: string;
  result: InterviewResult | null;
  videos: VideoItem[];
};

export const getRequestDetail = (
  candidateId: string,
  accessToken: string,
  signal?: AbortSignal,
) =>
  getRequest<RequestDetail>(
    `${apiPathConstants.bluecollar.requests}/${encodeURIComponent(candidateId)}`,
    { accessToken, signal },
  );
