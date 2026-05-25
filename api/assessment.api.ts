import { getRequest, postRequest, patchRequest, deleteRequest } from "@/config/http.config";
import apiPathConstants from "@/constants/api-path.constants";

export type AssessmentItem = {
  assessmentId:    string;
  name:            string;
  assessmentType:  string;
  description:     string;
  mode:            "test" | "live";
  isActive:        boolean;
  creationMethod:  "ai" | "custom";
  // AI Step 1
  jobTitle:        string;
  jobDescription:  string;
  roleType:        string;
  experienceRange: string;
  skills:          string[];
  // AI Step 2
  questionSetType: string;
  totalMarks:      number;
  passMarks:       number;
  duration:        number;
  difficulty:      string;
  createdAt:       string;
  updatedAt:       string;
};

export type AssessmentListResponse = {
  assessments: AssessmentItem[];
  pagination: {
    total:      number;
    page:       number;
    limit:      number;
    totalPages: number;
  };
};

export type CreateAssessmentPayload = {
  orgId:          string;
  name:           string;
  assessmentType?: string;
  description?:   string;
  mode?:          "test" | "live";
  projectId?:     string;
  creationMethod: "ai" | "custom";
  // AI Step 1
  jobTitle?:        string;
  jobDescription?:  string;
  roleType?:        string;
  experienceRange?: string;
  skills?:          string[];
  // AI Step 2
  questionSetType?: string;
  totalMarks?:      number;
  passMarks?:       number;
  duration?:        number;
  difficulty?:      string;
};

export const listAssessments = (
  orgId:       string,
  page:        number,
  limit:       number,
  mode:        "test" | "live",
  accessToken: string,
  projectId?:  string,
  signal?:     AbortSignal,
) =>
  getRequest<AssessmentListResponse>(apiPathConstants.assessments.base, {
    accessToken,
    signal,
    params: {
      orgId,
      page:  String(page),
      limit: String(limit),
      mode,
      ...(projectId ? { projectId } : {}),
    },
  });

export const createAssessment = (
  payload:     CreateAssessmentPayload,
  accessToken: string,
) =>
  postRequest<{ assessment: AssessmentItem }, CreateAssessmentPayload>(
    apiPathConstants.assessments.base,
    payload,
    { accessToken },
  );

export const toggleAssessmentActive = (
  assessmentId: string,
  orgId:        string,
  accessToken:  string,
) =>
  patchRequest<{ assessment: AssessmentItem }>(
    apiPathConstants.assessments.toggle(assessmentId),
    undefined,
    { accessToken, params: { orgId } },
  );

export const deleteAssessmentApi = (
  assessmentId: string,
  orgId:        string,
  accessToken:  string,
) =>
  deleteRequest(
    apiPathConstants.assessments.delete(assessmentId),
    { accessToken, params: { orgId } },
  );
