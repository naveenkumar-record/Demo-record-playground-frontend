import { getRequest, postRequest, patchRequest, putRequest, deleteRequest } from "@/config/http.config";
// patchRequest kept for toggleAssessmentActive
import apiPathConstants from "@/constants/api-path.constants";
 
// ── Knowledge Assessment types ────────────────────────────────────────────────
 
export type SectionType = "single_choice" | "short_answer" | "long_answer" | "true_false";
 
export type SectionAnswer = {
answerId: string;
answerText: string;
isCorrect: boolean;
};
 
export type SectionQuestion = {
questionId: string;
questionText: string;
marks: number;
answers: SectionAnswer[];
};
 
export type AssessmentSection = {
sectionId: string;
sectionType: SectionType;
pointsPerQuestion: number;
questions: SectionQuestion[];
};
 
// ── Skill Assessment types ────────────────────────────────────────────────────
 
export type TestCase = {
input: string;
expectedOutput: string;
explanation: string;
};
 
export type CodingProblem = {
problemId: string;
title: string;
marks: number;
allowedLanguages: string[];
problemStatement: string;
sampleInput: string;
sampleOutput: string;
solutionLanguage: string;
solutionCode: string;
solutionExplanation: string;
testCases: TestCase[];
};
 
// ── Assessment item ───────────────────────────────────────────────────────────
 
export type AssessmentItem = {
assessmentId: string;
name: string;
assessmentType: string;
description: string;
mode: "test" | "live";
isActive: boolean;
isPublished: boolean;
creationMethod: "ai" | "custom";
jobTitle: string;
jobDescription: string;
roleType: string;
experienceRange: string;
skills: string[];
questionSetType: string;
totalMarks: number;
passMarks: number;
duration: number;
difficulty: string;
sections: AssessmentSection[];
codingProblems: CodingProblem[];
createdAt: string;
updatedAt: string;
};
 
export type AssessmentListResponse = {
assessments: AssessmentItem[];
pagination: { total: number; page: number; limit: number; totalPages: number };
};
 
export type CreateAssessmentPayload = {
orgId: string;
name: string;
assessmentType?: string;
description?: string;
mode?: "test" | "live";
projectId?: string;
creationMethod: "ai" | "custom";
jobTitle?: string;
jobDescription?: string;
roleType?: string;
experienceRange?: string;
skills?: string[];
questionSetType?: string;
totalMarks?: number;
passMarks?: number;
duration?: number;
difficulty?: string;
};
 
// ── API functions ─────────────────────────────────────────────────────────────
 
export const listAssessments = (
orgId: string, page: number, limit: number,
mode: "test" | "live", accessToken: string,
projectId?: string, signal?: AbortSignal,
) =>
getRequest<AssessmentListResponse>(apiPathConstants.assessments.base, {
accessToken, signal,
params: {
orgId, page: String(page), limit: String(limit), mode,
...(projectId ? { projectId } : {}),
},
});
 
export const getAssessmentById = (
assessmentId: string, orgId: string, accessToken: string,
) =>
getRequest<{ assessment: AssessmentItem }>(apiPathConstants.assessments.byId(assessmentId), {
accessToken,
params: { orgId },
});
 
export const createAssessment = (payload: CreateAssessmentPayload, accessToken: string) =>
postRequest<{ assessment: AssessmentItem }, CreateAssessmentPayload>(
apiPathConstants.assessments.base, payload, { accessToken },
);
 
export type UpdateAssessmentPayload = {
  orgId:            string;
  // Metadata
  name?:            string;
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
  // Builder content
  sections?:        AssessmentSection[];
  codingProblems?:  CodingProblem[];
  isPublished?:     boolean;
};
 
export const updateAssessment = (
assessmentId: string,
payload: UpdateAssessmentPayload,
accessToken: string,
) =>
putRequest<{ assessment: AssessmentItem }, UpdateAssessmentPayload>(
apiPathConstants.assessments.byId(assessmentId),
payload,
{ accessToken },
);
 
export const toggleAssessmentActive = (
assessmentId: string, orgId: string, accessToken: string,
) =>
patchRequest<{ assessment: AssessmentItem }>(
apiPathConstants.assessments.toggle(assessmentId),
undefined,
{ accessToken, params: { orgId } },
);
 
export const deleteAssessmentApi = (
assessmentId: string, orgId: string, accessToken: string,
) =>
deleteRequest(
apiPathConstants.assessments.delete(assessmentId),
{ accessToken, params: { orgId } },
);