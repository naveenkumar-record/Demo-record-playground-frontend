import { getRequest, postRequest, deleteRequest, patchRequest } from "@/config/http.config";
import apiPathConstants from "@/constants/api-path.constants";

export type QuestionRowConfig = {
  type: "mcq" | "true-false" | "short-answer" | "long-answer" | "coding";
  count: number;
  marksEach: number;
  enabled: boolean;
};

export type AssessConfig = {
  questionRows: QuestionRowConfig[];
  difficultyLevel: "easy" | "medium" | "hard";
};

export type ApiKey = {
  _id: string;
  userId: string;
  orgId: string;
  name: string;
  keyId: string;
  apiKey: string;
  mode: "test" | "live";
  emailNotificationsEnabled?: boolean;
  assessConfig?: AssessConfig;
  createdAt: string;
  updatedAt: string;
};

// Returned only at creation — secretKey shown once
export type ApiKeyCreated = ApiKey & { secretKey: string };

export const listApiKeys = (
  orgId: string, accessToken: string,
  projectId?: string, signal?: AbortSignal, mode?: "test" | "live",
) =>
  getRequest<ApiKey[]>(apiPathConstants.apiKeys.base, {
    accessToken,
    signal,
    params: { orgId, ...(projectId !== undefined ? { projectId } : {}), ...(mode ? { mode } : {}) },
  });

export const createApiKey = (
  orgId: string,
  data: {
    name: string;
    mode: "test" | "live";
    projectId?: string;
    emailNotificationsEnabled?: boolean;
  },
  accessToken: string,
) =>
  postRequest<ApiKeyCreated>(apiPathConstants.apiKeys.base, data, {
    accessToken,
    params: { orgId },
  });

export const deleteApiKey = (orgId: string, keyId: string, accessToken: string) =>
  deleteRequest(`${apiPathConstants.apiKeys.base}/${keyId}`, {
    accessToken,
    params: { orgId },
  });

export const updateAssessConfig = (
  orgId: string,
  keyId: string,
  assessConfig: AssessConfig,
  accessToken: string,
  emailNotificationsEnabled?: boolean,
) =>
  patchRequest<ApiKey>(`${apiPathConstants.apiKeys.base}/${keyId}/assess-config`, {
    assessConfig,
    ...(emailNotificationsEnabled !== undefined ? { emailNotificationsEnabled } : {}),
  }, {
    accessToken,
    params: { orgId },
  });
