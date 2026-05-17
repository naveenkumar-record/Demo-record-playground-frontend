import { getRequest, postRequest, deleteRequest } from "@/config/http.config";
import apiPathConstants from "@/constants/api-path.constants";

export type OrgProject = {
  projectId:      string;
  orgId:          string;
  name:           string;
  createdBy:      string;
  createdByEmail: string;
  workflowCount:  number;
  createdAt:      string;
  updatedAt:      string;
};

export const listProjects = (orgId: string, accessToken: string) =>
  getRequest<OrgProject[]>(apiPathConstants.projects.base, {
    accessToken,
    params: { orgId },
  });

export const createProject = (
  orgId:       string,
  name:        string,
  accessToken: string,
) =>
  postRequest<OrgProject>(apiPathConstants.projects.base, { name }, {
    accessToken,
    params: { orgId },
  });

export const deleteProject = (
  orgId:       string,
  projectId:   string,
  accessToken: string,
) =>
  deleteRequest<void>(`${apiPathConstants.projects.base}/${projectId}`, {
    accessToken,
    params: { orgId },
  });
