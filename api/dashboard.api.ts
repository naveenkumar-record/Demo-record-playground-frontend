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
  days:        number = 30,
  signal?:     AbortSignal,
) => {
  const params: Record<string, string> = { orgId, mode, days: String(days) };
  if (projectId) params.projectId = projectId;
  return getRequest<DashboardStats>(apiPathConstants.dashboard.stats, { accessToken, signal, params });
};
