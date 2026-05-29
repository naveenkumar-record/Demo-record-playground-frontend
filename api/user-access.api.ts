import { getRequest, postRequest, deleteRequest, patchRequest } from "@/config/http.config";
import apiPathConstants from "@/constants/api-path.constants";

export type OrgRole = "superadmin" | "owner" | "reader";

export type OrgData = {
  orgId: string;
  orgName: string;
  orgRole: string;
  logoUrl: string;
  logoCropData: { x: number; y: number; width: number; height: number; zoom: number } | null;
  userRole: OrgRole;
};

export type MemberData = {
  orgId: string;
  userId: string;
  email: string;
  role: OrgRole;
  invitedUserId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OrgMembersData = {
  org: { orgId: string; orgName: string; orgRole: string; userRole: string };
  members: MemberData[];
};

/** Invite role — owner cannot be assigned via invite (org creator only) */
export type InviteRole = "superadmin" | "reader";

/** Fetch all orgs the current user belongs to (owned + invited) */
export const getUserOrganizations = (userIdOrToken: string, accessToken?: string) =>
  getRequest<{ organizations: OrgData[] }>(apiPathConstants.userAccess.organizations, {
    accessToken: accessToken ?? userIdOrToken,
    params: accessToken ? { userId: userIdOrToken } : undefined,
  });

/** Fetch all members for a specific org */
export const getOrgMembers = (orgId: string, accessToken: string, signal?: AbortSignal) =>
  getRequest<OrgMembersData>(apiPathConstants.userAccess.members, {
    accessToken,
    signal,
    params: { orgId },
  });

/** Invite a member to a specific org */
export const inviteMember = (
  payload: { orgId: string; email: string; role: InviteRole },
  accessToken: string
) => postRequest(apiPathConstants.userAccess.invite, payload, { accessToken });

/** Update a member's role within a specific org */
export const updateMemberRole = (
  orgId: string,
  memberUserId: string,
  role: InviteRole,
  accessToken: string
) =>
  patchRequest(
    `${apiPathConstants.userAccess.memberBase}/${memberUserId}/role`,
    { orgId, role },
    { accessToken }
  );

/** Remove a member from a specific org */
export const removeMember = (orgId: string, memberUserId: string, accessToken: string) =>
  deleteRequest(`${apiPathConstants.userAccess.memberBase}/${memberUserId}`, {
    accessToken,
    params: { orgId },
  });
