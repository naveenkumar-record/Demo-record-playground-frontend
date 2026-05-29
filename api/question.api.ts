import { getRequest, postRequest, putRequest, deleteRequest } from "@/config/http.config";
import apiPathConstants from "@/constants/api-path.constants";

// ── Types ─────────────────────────────────────────────────────────────────────

export type QuestionType = "MCQ" | "True/False" | "Short Answer" | "Long Answer" | "Coding";
export type Difficulty   = "Easy" | "Medium" | "Hard";

export type CodingTestCase = {
  input:          string;
  expectedOutput: string;
  explanation:    string;
  isHidden:       boolean;
};

export type QuestionItem = {
  _id:                 string;
  assessmentId:        string;
  title:               string;
  type:                QuestionType;
  question:            string;
  options:             string[];
  correctAnswer:       string;
  sampleSolution:      string;
  programmingLanguage: string;
  codingTestCases:     CodingTestCase[];
  difficulty:          Difficulty;
  marks:               number;
  skills:              string[];
  order:               number;
  questionSetIndex:    number;
  createdAt:           string;
  updatedAt:           string;
};

export type QuestionPayload = {
  orgId:               string;
  title?:              string;
  type:                QuestionType;
  question:            string;
  options?:            string[];
  correctAnswer?:      string;
  sampleSolution?:     string;
  programmingLanguage?: string;
  codingTestCases?:    CodingTestCase[];
  difficulty?:         Difficulty;
  marks:               number;
  skills?:             string[];
  order?:              number;
  questionSetIndex?:   number;
};

// ── API functions ─────────────────────────────────────────────────────────────

export const listQuestions = (
  assessmentId: string,
  orgId:        string,
  accessToken:  string,
) =>
  getRequest<{ questions: QuestionItem[] }>(
    apiPathConstants.assessments.questions(assessmentId),
    { accessToken, params: { orgId } },
  );

export const addQuestion = (
  assessmentId: string,
  payload:      QuestionPayload,
  accessToken:  string,
) =>
  postRequest<{ question: QuestionItem }, QuestionPayload>(
    apiPathConstants.assessments.questions(assessmentId),
    payload,
    { accessToken },
  );

export const updateQuestion = (
  assessmentId: string,
  questionId:   string,
  payload:      QuestionPayload,
  accessToken:  string,
) =>
  putRequest<{ question: QuestionItem }, QuestionPayload>(
    apiPathConstants.assessments.questionById(assessmentId, questionId),
    payload,
    { accessToken },
  );

export type BulkReplacePayload = {
  orgId:       string;
  questions:   Omit<QuestionPayload, "orgId">[];
  scopeTypes?: string[];
};

export const bulkReplaceQuestions = (
  assessmentId: string,
  payload:      BulkReplacePayload,
  accessToken:  string,
) =>
  putRequest<{ questions: QuestionItem[] }, BulkReplacePayload>(
    apiPathConstants.assessments.questions(assessmentId),
    payload,
    { accessToken },
  );

export const deleteQuestion = (
  assessmentId: string,
  questionId:   string,
  orgId:        string,
  accessToken:  string,
) =>
  deleteRequest(
    apiPathConstants.assessments.questionById(assessmentId, questionId),
    { accessToken, params: { orgId } },
  );
