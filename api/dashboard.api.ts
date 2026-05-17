import { getRequest } from "@/config/http.config";
import apiPathConstants from "@/constants/api-path.constants";

export type DashboardStats = {
  journeysInitiated: number;
  completed: number;
  notAttempted: number;
  stillInProgress: number;
  expired: number;
};

export const getDashboardStats = (
  orgId:       string,
  mode:        "test" | "live",
  accessToken: string,
  projectId?:  string,
  signal?:     AbortSignal,
) =>
  getRequest<DashboardStats>(apiPathConstants.dashboard.stats, {
    accessToken,
    signal,
    params: projectId ? { orgId, mode, projectId } : { orgId, mode },
  });
