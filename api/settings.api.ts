import { getRequest, patchRequest, uploadRequest, deleteRequest } from "@/config/http.config";
import apiPathConstants from "@/constants/api-path.constants";

export type LogoCropData = {
  x: number;
  y: number;
  width: number;
  height: number;
  zoom: number;
};

export type OrgSettings = {
  orgId: string;
  orgName: string;
  orgRole: string;
  gstNo: string;
  userRole: string;
  logoUrl: string;
  logoCropData: LogoCropData;
  streetAddress: string;
  city: string;
  state: string;
  pinCode: string;
  country: string;
  createdAt: string;
  updatedAt: string;
};

export type OrgSettingsResponse = {
  org: OrgSettings;
  viewerRole: "owner" | "superadmin" | "reader";
};

export const getOrgSettings = (orgId: string, accessToken: string, signal?: AbortSignal) =>
  getRequest<OrgSettingsResponse>(apiPathConstants.settings.base, {
    accessToken,
    signal,
    params: { orgId },
  });

export const updateOrgSettings = (
  orgId: string,
  data: {
    orgName?: string;
    orgRole?: string;
    gstNo?: string;
    streetAddress?: string;
    city?: string;
    state?: string;
    pinCode?: string;
    country?: string;
    logoUrl?: string;
    logoCropData?: LogoCropData;
  },
  accessToken: string
) =>
  patchRequest<OrgSettings>(apiPathConstants.settings.base, data, {
    accessToken,
    params: { orgId },
  });

export const uploadOrgLogo = (orgId: string, file: File, accessToken: string) => {
  const formData = new FormData();
  formData.append("logo", file);
  return uploadRequest<{ logoUrl: string }>(apiPathConstants.settings.logo, formData, {
    accessToken,
    params: { orgId },
  });
};

export const deleteOrgLogo = (orgId: string, accessToken: string) =>
  deleteRequest<OrgSettings>(apiPathConstants.settings.logo, {
    accessToken,
    params: { orgId },
  });

export const deleteOrgAccount = (orgId: string, accessToken: string) =>
  deleteRequest<{ role: string; hasOrganization: boolean }>(apiPathConstants.settings.base, {
    accessToken,
    params: { orgId },
  });
