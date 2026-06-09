import { postRequest, getRequest } from "@/config/http.config";
import apiPathConstants from "@/constants/api-path.constants";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ViolationType = "FULLSCREEN_EXIT" | "TAB_SWITCH" | "LOOKING_AWAY" | "NO_FACE" | "MULTIPLE_FACES" | "EXTERNAL_OBJECT" | string;
export type ViolationSeverity = "low" | "medium" | "high";

export type Violation = {
  type:            ViolationType;
  severity:        ViolationSeverity;
  timestamp:       string;
  screenshotPath?: string;
};

export type Proctoring = {
  proctoringScore:     number;
  tabSwitchCount:      number;
  fullscreenExitCount: number;
  noFaceCount:         number;
  multipleFaceCount:   number;
  lookawayCount:       number;
  externalObjectCount: number;
  violations:          Violation[];
};

export type CandidateAnswer = {
  questionId: string;
  answer:     string;
  timeSpent:  number;
};

export type CandidateSession = {
  candidateId:           string;
  assessmentStrId:       string;
  candidate:             { name: string; email: string };
  status:                string;
  startTime?:            string;
  endTime?:              string;
  submittedAt?:          string;
  score?:                number;
  passed?:               boolean;
  identityVerified?:     boolean;
  aiFeedback?:           string;
  proctoring?:           Proctoring;
  answers?:              CandidateAnswer[];
  recording?:            { status: string };
  createdAt:             string;
  updatedAt:             string;
};

export type CandidateRecord = {
  candidateId: string;
  name:        string;
  email:       string;
  status:      "pending" | "started" | "completed" | "expired";
  assignedAt:  string;
  passed?:     boolean;   // undefined = not yet attempted
  score?:      number;
};

export type AssignmentItem = {
  assignmentId:      string;
  assessmentId:      string;
  orgId:             string;
  batchName:         string;
  tag:               string;
  candidates:        CandidateRecord[];
  totalCandidates:   number;
  duplicatesRemoved: number;
  alreadyAssigned:   string[];
  createdAt:         string;
  updatedAt:         string;
};

// ── API functions ─────────────────────────────────────────────────────────────

/** Check which emails are already assigned to this assessment */
export const checkAssignmentDuplicates = (
  assessmentId: string,
  orgId:        string,
  emails:       string[],
  accessToken:  string,
) =>
  postRequest<{ alreadyAssigned: string[] }>(
    `${apiPathConstants.assessments.base}/${assessmentId}/assign/check`,
    { orgId, emails },
    { accessToken },
  );

/** Create an assignment batch */
export const createAssignment = (
  assessmentId: string,
  payload: {
    orgId:      string;
    mode:       "test" | "live";
    batchName:  string;
    tag:        string;
    candidates: { name: string; email: string }[];
  },
  accessToken: string,
) =>
  postRequest<{ assignment: AssignmentItem }>(
    `${apiPathConstants.assessments.base}/${assessmentId}/assign`,
    payload,
    { accessToken },
  );

/** List all assignment batches across all assessments for an org */
export const listOrgAssignments = (
  orgId:       string,
  accessToken: string,
  mode?:       "test" | "live",
  projectId?:  string,
) =>
  getRequest<{ assignments: AssignmentItem[]; total: number }>(
    `${apiPathConstants.assessments.base}/assignments`,
    {
      accessToken,
      params: {
        orgId,
        ...(mode      ? { mode }      : {}),
        // Always send projectId so backend can filter (empty string = Default project)
        projectId: projectId ?? "",
      },
    },
  );

/** Get a single assignment detail with pass/fail enrichment */
export const getAssignmentDetail = (
  assignmentId: string,
  orgId:        string,
  accessToken:  string,
  mode?:        "test" | "live",
) =>
  getRequest<{ assignment: AssignmentItem }>(
    `${apiPathConstants.assessments.base}/assignments/${assignmentId}`,
    { accessToken, params: { orgId, ...(mode ? { mode } : {}) } },
  );

/** Fetch the full analytics session for a single candidate */
export const getCandidateSession = (
  candidateId: string,
  accessToken: string,
) =>
  getRequest<{ session: CandidateSession }>(
    `${apiPathConstants.assessments.base}/candidate-session/${candidateId}`,
    { accessToken },
  );

/** List assignment batches for an assessment */
export const listAssignments = (
  assessmentId: string,
  orgId:        string,
  accessToken:  string,
  mode?:        "test" | "live",
) =>
  getRequest<{ assignments: AssignmentItem[]; total: number }>(
    `${apiPathConstants.assessments.base}/${assessmentId}/assignments`,
    { accessToken, params: { orgId, ...(mode ? { mode } : {}) } },
  );
