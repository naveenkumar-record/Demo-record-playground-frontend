import { getRequest } from "@/config/http.config";
import apiPathConstants from "@/constants/api-path.constants";

export type StatTrend = {
  value: number;
  direction: "up" | "down" | "flat";
  label: string;
};

export type DashboardStats = {
  journeysInitiated: number;
  completed: number;
  notAttempted: number;
  stillInProgress: number;
  expired: number;
  trends: {
    journeysInitiated: StatTrend;
    completed: StatTrend;
    notAttempted: StatTrend;
    stillInProgress: StatTrend;
    expired: StatTrend;
  };
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
