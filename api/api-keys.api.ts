import { getRequest, postRequest, deleteRequest } from "@/config/http.config";
import apiPathConstants from "@/constants/api-path.constants";

export type ApiKey = {
  _id: string;
  userId: string;
  orgId: string;
  name: string;
  keyId: string;
  apiKey: string;
  mode: "test" | "live";
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
    params: { orgId, ...(projectId ? { projectId } : {}), ...(mode ? { mode } : {}) },
  });

export const createApiKey = (
  orgId: string,
  data: { name: string; mode: "test" | "live"; projectId?: string },
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
