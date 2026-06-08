import { getRequest, postRequest } from "@/config/http.config";
import apiPathConstants from "@/constants/api-path.constants";

export type WorkflowItem = {
  keyId: string;
  workflowId: string;
  name: string;
  mode: "test" | "live";
  environment: "PRODUCTION" | "TEST";
  isActive: boolean;
  status: "Active" | "Paused";
  totalRequests: number;
  totalVerifications: number;
  verifiedCount: number;
  notAttempted: number;
  inProgress: number;
  expired: number;
  completionPercent: number;
  workflowType: string;
  jobDescription?: string;
  skillIds: string[];
  verificationMethod: "text" | "voice" | "video";
  createdAt: string;
  updatedAt: string;
};

export type WorkflowSkill = {
  skillId: string;
  name: string;
};

export type WorkflowPagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type WorkflowListResponse = {
  workflows: WorkflowItem[];
  pagination: WorkflowPagination;
};

export type CreateWorkflowPayload = {
  orgId: string;
  name: string;
  workflowType: string;
  jobTitle?: string;
  roleType?: string;
  experienceRange?: string;
  salary?: string;
  location?: string;
  jobDescription?: string;
  startMessage: string;
  completionMessage: string;
  skillIds: string[];
  verificationMethod: "text" | "voice" | "video";
  mode: "test" | "live";
  language?: "tamil" | "english" | "kannada" | "hindi" | "telugu";
  projectId?: string;
};

export const listWorkflows = (
  orgId: string,
  page: number,
  limit: number,
  mode: "test" | "live",
  accessToken: string,
  projectId?: string,
  signal?: AbortSignal,
) =>
  getRequest<WorkflowListResponse>(apiPathConstants.workflows.base, {
    accessToken,
    signal,
    params: {
      orgId,
      page: String(page),
      limit: String(limit),
      mode,
      ...(projectId ? { projectId } : {}),
    },
  });

export const listWorkflowSkills = (accessToken: string, signal?: AbortSignal) =>
  getRequest<{ skills: WorkflowSkill[] }>(apiPathConstants.workflows.skills, {
    accessToken,
    signal,
  });

export const searchWorkflowSkills = (
  q: string,
  accessToken: string,
  signal?: AbortSignal,
) =>
  getRequest<{ skills: WorkflowSkill[] }>(apiPathConstants.workflows.searchSkills, {
    accessToken,
    signal,
    params: { q },
  });

export const createWorkflow = (
  payload: CreateWorkflowPayload,
  accessToken: string,
) =>
  postRequest<{ workflow: WorkflowItem }, CreateWorkflowPayload>(
    apiPathConstants.workflows.base,
    payload,
    { accessToken },
  );

export type WorkflowCandidatePayload = {
  name: string;
  phoneNumber: string;
  role?: string;
};

export const createWorkflowCandidates = (
  workflowId: string,
  candidates: WorkflowCandidatePayload[],
  accessToken: string,
  language?: string,
) =>
  postRequest<
    { candidates: unknown[] },
    { candidates: WorkflowCandidatePayload[]; language?: string }
  >(
    `${apiPathConstants.workflows.base}/${workflowId}/candidates`,
    { candidates, language },
    { accessToken },
  );
