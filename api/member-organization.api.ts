import { postRequest, getRequest } from "@/config/http.config";
import apiPathConstants from "@/constants/api-path.constants";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type CreatedOrgData = {
  orgId: string;
  orgName: string;
  orgRole: string;
  userRole: string;
};

export type MemberOrganizationData = {
  orgId: string;
  orgName: string;
  orgRole: string;
  userRole: string;
};

// ✅ FIXED
export const createMemberOrganization = (
  payload: { orgName: string; orgRole: string },
  accessToken: string,
) => {
  return postRequest<CreatedOrgData>(  // ✅ not ApiResponse<CreatedOrgData>
    apiPathConstants.memberOrganization.create,
    payload,
    { accessToken },
  );
};

// ✅ FIXED
export const getMyOrganization = (accessToken: string) => {
  return getRequest<MemberOrganizationData>(
    apiPathConstants.memberOrganization.getOrganization,
    { accessToken },
  );
};