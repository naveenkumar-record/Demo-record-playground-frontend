"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  AlertTriangleIcon,
  ImageIcon,
  InfoIcon,
  PencilIcon,
  Trash2Icon,
  UploadIcon,
} from "lucide-react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { getAccessToken } from "@/lib/auth-client";
import { useOrg } from "@/components/layout/orgContext";
import {
  deleteOrgAccount,
  deleteOrgLogo,
  getOrgSettings,
  updateOrgSettings,
  uploadOrgLogo,
  type LogoCropData,
} from "@/api/settings.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ORG_ROLE_OPTIONS = [
  { value: "startup", label: "Startup" },
  { value: "enterprise", label: "Enterprise" },
  { value: "individual", label: "Individual" },
] as const;

const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

// ── Types ──────────────────────────────────────────────────────────────────────
type ExtraSettings = {
  logoUrl: string;
  logoCropData: LogoCropData | null;
  gstNo: string;
  streetAddress: string;
  city: string;
  state: string;
  pinCode: string;
  country: string;
};

type FormErrors = Partial<
  Record<
    | "orgName"
    | "orgRole"
    | "streetAddress"
    | "city"
    | "state"
    | "pinCode"
    | "country"
    | "gstNo",
    string
  >
>;

// ── Logo preview ───────────────────────────────────────────────────────────────
function LogoPreview({
  logoUrl,
  cropData,
  size = 80,
}: {
  logoUrl: string;
  cropData?: LogoCropData | null;
  size?: number;
}) {
  if (!logoUrl) {
    return (
      <div
        style={{ width: size, height: size }}
        className="flex items-center justify-center rounded-full border-2 border-dashed border-[#d4d4d4] bg-[#ebebeb]"
      >
        <ImageIcon className="h-8 w-8 text-[#c0c0c0]" />
      </div>
    );
  }

  if (!cropData?.width || !cropData?.height) {
    return (
      <div
        style={{
          width: size,
          height: size,
          backgroundImage: `url(${logoUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
        className="shrink-0 rounded-full border-[3px] border-white shadow"
      />
    );
  }

  const bgW = (100 / cropData.width) * 100;
  const bgH = (100 / cropData.height) * 100;
  const bgX = -(cropData.x / cropData.width) * size;
  const bgY = -(cropData.y / cropData.height) * size;

  return (
    <div
      style={{
        width: size,
        height: size,
        backgroundImage: `url(${logoUrl})`,
        backgroundSize: `${bgW}% ${bgH}%`,
        backgroundPosition: `${bgX}px ${bgY}px`,
        backgroundRepeat: "no-repeat",
      }}
      className="shrink-0 rounded-full border-[3px] border-white shadow"
    />
  );
}

// ── Field wrapper (with inline error) ─────────────────────────────────────────
function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-[13px] font-semibold text-[#1a1a1a]">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </Label>
      {children}
      {error && <p className="text-[11px] text-red-500 mt-0.5">{error}</p>}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const router = useRouter();
  const { activeOrg } = useOrg();

  const [extra, setExtra] = useState<ExtraSettings | null>(null);
  const [extraLoading, setExtraLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [orgName, setOrgName] = useState("");
  const [orgRole, setOrgRole] = useState("");
  const [gstNo, setGstNo] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateVal, setStateVal] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [country, setCountry] = useState("");
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null);
  const [pendingLogoCropData, setPendingLogoCropData] =
    useState<LogoCropData | null>(null);
  const [pendingLogoPreview, setPendingLogoPreview] = useState<string>("");

  const displayLogoUrl = pendingLogoPreview || (extra?.logoUrl ?? "");
  const displayCropData = pendingLogoCropData ?? extra?.logoCropData;

  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [deletingLogo, setDeletingLogo] = useState(false);

  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjustImageSrc, setAdjustImageSrc] = useState<string>("");
  const [adjustFile, setAdjustFile] = useState<File | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);

  const uploadFileRef = useRef<HTMLInputElement>(null);
  // Dedup guard — survives StrictMode's simulated unmount; prevents second fetch from firing
  const fetchedRef = useRef("");

  const viewerRole = (activeOrg?.userRole ?? "reader") as
    | "owner"
    | "superadmin"
    | "reader";
  const canEdit = viewerRole === "owner" || viewerRole === "superadmin";
  const accessToken = getAccessToken() ?? "";

  // ── Fetch settings ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!activeOrg?.orgId) return;

    // Reset form on every org/name/role change
    setExtra(null);
    setOrgName(activeOrg.orgName ?? "");
    setOrgRole(activeOrg.orgRole ?? "");
    setPendingLogoFile(null);
    setPendingLogoCropData(null);
    setPendingLogoPreview("");
    setFormErrors({});

    // Dedup: if this org was already fetched in this mount, skip the API call
    if (fetchedRef.current === activeOrg.orgId) return;
    fetchedRef.current = activeOrg.orgId;

    const orgId = activeOrg.orgId;
    const token = getAccessToken();
    if (!token) {
      setExtraLoading(false);
      return;
    }

    setExtraLoading(true);
    getOrgSettings(orgId, token)
      .then((res) => {
        if (fetchedRef.current !== orgId) return;
        if (res.data) {
          const org = res.data.org;
          setExtra({
            logoUrl: org.logoUrl ?? "",
            logoCropData: org.logoCropData ?? null,
            gstNo: org.gstNo ?? "",
            streetAddress: org.streetAddress ?? "",
            city: org.city ?? "",
            state: org.state ?? "",
            pinCode: org.pinCode ?? "",
            country: org.country ?? "",
          });
        }
      })
      .catch(() => {
        if (fetchedRef.current !== orgId) return;
        setExtra({
          logoUrl: "",
          logoCropData: null,
          gstNo: "",
          streetAddress: "",
          city: "",
          state: "",
          pinCode: "",
          country: "",
        });
      })
      .finally(() => {
        if (fetchedRef.current === orgId) setExtraLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOrg?.orgId, activeOrg?.orgName, activeOrg?.orgRole]);

  useEffect(() => {
    if (!extra) return;
    setGstNo(extra.gstNo);
    setStreetAddress(extra.streetAddress);
    setCity(extra.city);
    setStateVal(extra.state);
    setPinCode(extra.pinCode);
    setCountry(extra.country);
  }, [extra]);

  // ── Validation ─────────────────────────────────────────────────────────────
  const [logoError, setLogoError] = useState("");

  const validate = (): boolean => {
    const errors: FormErrors = {};
    if (!orgName.trim()) errors.orgName = "Company name is required";
    if (!orgRole.trim()) errors.orgRole = "Industry / Role is required";
    if (!streetAddress.trim())
      errors.streetAddress = "Street address is required";
    if (!city.trim()) errors.city = "City is required";
    if (!stateVal.trim()) errors.state = "State is required";
    if (!pinCode.trim()) errors.pinCode = "Pin code is required";
    if (!country.trim()) errors.country = "Country is required";
    const g = gstNo.trim().toUpperCase();
    if (g && !GST_REGEX.test(g))
      errors.gstNo = "Invalid GST format (e.g. 29ABCDE1234F1Z5)";

    // Profile image is mandatory
    const hasLogo = !!(pendingLogoPreview || extra?.logoUrl);
    if (!hasLogo) {
      setLogoError("Company profile image is required");
    } else {
      setLogoError("");
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0 && hasLogo;
  };

  const clearError = (key: keyof FormErrors) =>
    setFormErrors((prev) => {
      const n = { ...prev };
      delete n[key];
      return n;
    });

  // ── Save Changes (validates + optionally uploads logo + saves backend) ──────
  const handleSave = async () => {
    if (!validate()) return;
    if (!activeOrg) return;
    const token = getAccessToken();
    if (!token) return;

    setSaving(true);
    try {
      let finalLogoUrl = extra?.logoUrl ?? "";

      // Upload pending file to Cloudinary only now
      if (pendingLogoFile) {
        const res = await uploadOrgLogo(
          activeOrg.orgId,
          pendingLogoFile,
          token,
        );
        if (!res.data?.logoUrl) throw new Error("Logo upload failed");
        finalLogoUrl = res.data.logoUrl;
      }

      const g = gstNo.trim().toUpperCase();

      await updateOrgSettings(
        activeOrg.orgId,
        {
          orgName: orgName.trim() || undefined,
          orgRole: orgRole.trim() || undefined,
          gstNo: g || undefined,
          streetAddress: streetAddress.trim() || undefined,
          city: city.trim() || undefined,
          state: stateVal.trim() || undefined,
          pinCode: pinCode.trim() || undefined,
          country: country.trim() || undefined,
          // Include logo data only if there were pending changes
          ...(pendingLogoFile || pendingLogoCropData
            ? {
                logoUrl: finalLogoUrl,
                logoCropData: pendingLogoCropData ?? undefined,
              }
            : {}),
        },
        token,
      );

      // Commit to local state
      setExtra((prev) =>
        prev
          ? {
              ...prev,
              ...(pendingLogoFile || pendingLogoCropData
                ? { logoUrl: finalLogoUrl, logoCropData: pendingLogoCropData }
                : {}),
            }
          : prev,
      );

      setPendingLogoFile(null);
      setPendingLogoCropData(null);
      setPendingLogoPreview("");

      toast.message("Changes saved successfully");
      window.location.reload();
    } catch (err: unknown) {
      toast.message(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOrg = async () => {
    if (!activeOrg) return;
    const token = getAccessToken();
    if (!token) return;
    setDeleting(true);
    try {
      const res = await deleteOrgAccount(activeOrg.orgId, token);
      setDeleteDialogOpen(false);
      toast.message(
        viewerRole === "owner"
          ? "Organization deleted"
          : "You have left the organization",
      );
      if (!res.data?.hasOrganization) router.push("/login");
      else router.refresh();
    } catch (err: unknown) {
      toast.message(
        err instanceof Error ? err.message : "Failed. Please try again.",
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleEditClick = () => {
    const url = pendingLogoPreview || (extra?.logoUrl ?? "");
    if (!url) return;
    setAdjustImageSrc(url);
    setAdjustFile(pendingLogoFile);
    setCrop({ x: 0, y: 0 });
    setZoom(pendingLogoCropData?.zoom ?? extra?.logoCropData?.zoom ?? 1);
    setCroppedArea(null);
    setAdjustModalOpen(true);
  };

  const handleUploadPhotoClick = () => uploadFileRef.current?.click();

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAdjustFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setAdjustImageSrc(reader.result as string);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedArea(null);
      setAdjustModalOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleDeleteLogo = async () => {
    if (!activeOrg) return;
    setDeletingLogo(true);
    try {
      await deleteOrgLogo(activeOrg.orgId, accessToken);
      setExtra((prev) =>
        prev ? { ...prev, logoUrl: "", logoCropData: null } : prev,
      );
      setPendingLogoFile(null);
      setPendingLogoCropData(null);
      setPendingLogoPreview("");
      setProfileModalOpen(false);
      toast.message("Profile photo removed");
    } catch (err: unknown) {
      toast.message(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeletingLogo(false);
    }
  };

  const handleSavePhoto = () => {
    const cropData: LogoCropData = {
      x: croppedArea?.x ?? 0,
      y: croppedArea?.y ?? 0,
      width: croppedArea?.width ?? 100,
      height: croppedArea?.height ?? 100,
      zoom,
    };

    if (adjustFile) {
      setPendingLogoFile(adjustFile);
      setPendingLogoPreview(adjustImageSrc); // dataURL for local preview
    }

    setPendingLogoCropData(cropData);
    setLogoError(""); // clear error once image is selected

    // Close both modals
    setAdjustModalOpen(false);
    setProfileModalOpen(false);
  };

  if (!activeOrg) {
    return (
      <div className="flex h-40 items-center justify-center text-[12px] text-[#9a9a9a]">
        No organization selected.
      </div>
    );
  }

  const isFormComplete =
    !!(pendingLogoPreview || extra?.logoUrl) &&
    orgName.trim() !== "" &&
    orgRole.trim() !== "" &&
    streetAddress.trim() !== "" &&
    city.trim() !== "" &&
    stateVal.trim() !== "" &&
    pinCode.trim() !== "" &&
    country.trim() !== "";

  return (
    <div className="w-full p-4 sm:p-8 pb-16">
      <div className="pb-8">
        <div className="flex flex-col gap-8 sm:flex-row">
          <div className="shrink-0 sm:w-[420px]">
            <h2 className="text-lg font-bold text-[#1a1a1a]">
              Company Details
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-[#8a8a8a]">
              View and update your Company details here.
            </p>
          </div>

          <div className="flex flex-1 flex-col gap-5">
            {/* Logo row */}
            <div className="flex items-start gap-5">
              {extraLoading ? (
                <div className="h-[120px] w-[120px] shrink-0 animate-pulse rounded-full bg-[#f0f0f0]" />
              ) : (
                <LogoPreview
                  logoUrl={displayLogoUrl}
                  cropData={displayCropData}
                  size={120}
                />
              )}
              <div className="flex flex-col gap-2 pt-1">
                <div className="flex items-center gap-1">
                  <span className="mt-2 text-sm font-semibold text-[#1a1a1a]">
                    Update Profile
                  </span>
                  <span className="text-red-500">*</span>
                  <InfoIcon className="h-3.5 w-3.5 text-[#b0b0b0]" />
                </div>
                {canEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    className={`h-9 w-24 text-[12px] font-medium ${logoError ? "border-red-400" : "border-[#d0d0d0]"}`}
                    onClick={() => { setProfileModalOpen(true); setLogoError(""); }}
                    disabled={extraLoading}
                  >
                    Upload
                  </Button>
                )}
                <span className="text-[11px] text-[#aaa]">
                  JPG or PNG. 10MB max.
                </span>
                {/* Logo error */}
                {logoError && (
                  <p className="text-[11px] text-red-500">{logoError}</p>
                )}
                {/* Unsaved indicator */}
                {(pendingLogoFile || pendingLogoCropData) && (
                  <span className="text-[11px] text-amber-600 font-medium">
                    Unsaved — click Save Changes to apply
                  </span>
                )}
              </div>
            </div>

            {/* Company Name */}
            <Field label="Company Name" required error={formErrors.orgName}>
              <Input
                className={cn(
                  "h-11 border-[#d4d4d4] text-[13px] focus-visible:ring-0 focus-visible:border-[#1a1a1a]",
                  formErrors.orgName &&
                    "border-red-400 focus-visible:border-red-400",
                )}
                value={orgName}
                onChange={(e) => {
                  setOrgName(e.target.value);
                  clearError("orgName");
                }}
                disabled={!canEdit}
                placeholder="e.g. Acme Corporation"
              />
            </Field>

            {/* Industry / Role + GST No */}
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Industry / Role"
                required
                error={formErrors.orgRole}
              >
                <Select
                  value={orgRole}
                  onValueChange={(v) => {
                    setOrgRole(v);
                    clearError("orgRole");
                  }}
                  disabled={!canEdit}
                >
                  <SelectTrigger
                    className={cn(
                      "h-11 border-[#d4d4d4] text-[13px] focus:ring-0 focus:border-[#1a1a1a]",
                      formErrors.orgRole && "border-red-400",
                    )}
                  >
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ORG_ROLE_OPTIONS.map((opt) => (
                      <SelectItem
                        key={opt.value}
                        value={opt.value}
                        className="text-[13px]"
                      >
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="GST No" error={formErrors.gstNo}>
                <Input
                  className={cn(
                    "h-11 border-[#d4d4d4] text-[13px] focus-visible:ring-0 focus-visible:border-[#1a1a1a]",
                    formErrors.gstNo &&
                      "border-red-400 focus-visible:border-red-400",
                  )}
                  value={extraLoading ? "" : gstNo}
                  onChange={(e) => {
                    setGstNo(e.target.value.toUpperCase());
                    clearError("gstNo");
                  }}
                  disabled={!canEdit || extraLoading}
                  maxLength={15}
                  placeholder={
                    extraLoading ? "Loading…" : "e.g. 29ABCDE1234F1Z5"
                  }
                />
              </Field>
            </div>

            {/* Street Address */}
            <Field
              label="Street Address"
              required
              error={formErrors.streetAddress}
            >
              <Input
                className={cn(
                  "h-11 border-[#d4d4d4] text-[13px] focus-visible:ring-0 focus-visible:border-[#1a1a1a]",
                  formErrors.streetAddress &&
                    "border-red-400 focus-visible:border-red-400",
                )}
                value={extraLoading ? "" : streetAddress}
                onChange={(e) => {
                  setStreetAddress(e.target.value);
                  clearError("streetAddress");
                }}
                disabled={!canEdit || extraLoading}
                placeholder={
                  extraLoading ? "Loading…" : "e.g. 12A Shanthi Nagar"
                }
              />
            </Field>

            {/* City + State */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="City" required error={formErrors.city}>
                <Input
                  className={cn(
                    "h-11 border-[#d4d4d4] text-[13px] focus-visible:ring-0 focus-visible:border-[#1a1a1a]",
                    formErrors.city &&
                      "border-red-400 focus-visible:border-red-400",
                  )}
                  value={extraLoading ? "" : city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    clearError("city");
                  }}
                  disabled={!canEdit || extraLoading}
                  placeholder={extraLoading ? "Loading…" : "e.g. Coimbatore"}
                />
              </Field>
              <Field label="State" required error={formErrors.state}>
                <Input
                  className={cn(
                    "h-11 border-[#d4d4d4] text-[13px] focus-visible:ring-0 focus-visible:border-[#1a1a1a]",
                    formErrors.state &&
                      "border-red-400 focus-visible:border-red-400",
                  )}
                  value={extraLoading ? "" : stateVal}
                  onChange={(e) => {
                    setStateVal(e.target.value);
                    clearError("state");
                  }}
                  disabled={!canEdit || extraLoading}
                  placeholder={extraLoading ? "Loading…" : "e.g. Tamil Nadu"}
                />
              </Field>
            </div>

            {/* Pin Code + Country */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Pin Code" required error={formErrors.pinCode}>
                <Input
                  className={cn(
                    "h-11 border-[#d4d4d4] text-[13px] focus-visible:ring-0 focus-visible:border-[#1a1a1a]",
                    formErrors.pinCode &&
                      "border-red-400 focus-visible:border-red-400",
                  )}
                  value={extraLoading ? "" : pinCode}
                  onChange={(e) => {
                    setPinCode(e.target.value);
                    clearError("pinCode");
                  }}
                  disabled={!canEdit || extraLoading}
                  placeholder={extraLoading ? "Loading…" : "e.g. 641019"}
                />
              </Field>
              <Field label="Country" required error={formErrors.country}>
                <Input
                  className={cn(
                    "h-11 border-[#d4d4d4] text-[13px] focus-visible:ring-0 focus-visible:border-[#1a1a1a]",
                    formErrors.country &&
                      "border-red-400 focus-visible:border-red-400",
                  )}
                  value={extraLoading ? "" : country}
                  onChange={(e) => {
                    setCountry(e.target.value);
                    clearError("country");
                  }}
                  disabled={!canEdit || extraLoading}
                  placeholder={extraLoading ? "Loading…" : "e.g. India"}
                />
              </Field>
            </div>

            {canEdit && isFormComplete && (
              <div className="flex justify-end pt-1">
                <Button
                  className="h-10 bg-orange-600 px-7 text-[13px] font-medium text-white hover:bg-orange-700"
                  onClick={handleSave}
                  disabled={saving || extraLoading}
                >
                  {saving ? "Saving…" : "Save Changes"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 border border-[#e7e7e7] rounded-lg">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangleIcon className="h-4 w-4 text-[#c8382b]" />
          <span className="text-md font-medium text-[#c8382b]">
            Danger Zone
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-md font-semibold text-[#1a1a1a]">
              {viewerRole === "owner"
                ? "Delete organization"
                : "Leave organization"}
            </span>
            <span className="text-sm text-[#8a8a8a]">
              {viewerRole === "owner"
                ? "Permanently delete this organization and remove all members."
                : "Remove yourself from this organization. Your other organizations are not affected."}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="ml-6 h-9 shrink-0 border-[#fde8e8] px-4 text-sm font-medium text-[#c8382b] hover:border-[#c8382b] hover:bg-[#fff5f5] hover:text-[#c8382b]"
            onClick={() => setDeleteDialogOpen(true)}
          >
            {viewerRole === "owner" ? "Delete" : "Leave"}
          </Button>
        </div>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-md">
              <AlertTriangleIcon className="h-5 w-5 text-[#c8382b]" />
              {viewerRole === "owner"
                ? "Delete organization?"
                : "Leave organization?"}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm leading-relaxed text-[#555]">
            {viewerRole === "owner" ? (
              <>
                This will permanently delete{" "}
                <strong className="text-[#1f1f1f]">{activeOrg.orgName}</strong>{" "}
                and remove all members.{" "}
                <strong className="text-[#555] text-sm leading-relaxed">
                  This action cannot be undone.
                </strong>
              </>
            ) : (
              <>
                You will be removed from{" "}
                <strong className="text-[#1f1f1f]">{activeOrg.orgName}</strong>.
                Your other organizations are not affected.
              </>
            )}
          </p>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              size="sm"
              className="h-8 text-sm text-black bg-white border border-[#d4d4d4] hover:bg-[#f5f5f5]"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="h-8 bg-[#c8382b] text-sm text-white hover:bg-[#a82d22]"
              onClick={handleDeleteOrg}
              disabled={deleting}
            >
              {deleting
                ? viewerRole === "owner"
                  ? "Deleting…"
                  : "Leaving…"
                : viewerRole === "owner"
                  ? "Delete organization"
                  : "Leave organization"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <input
        ref={uploadFileRef}
        type="file"
        accept="image/jpeg,image/png"
        className="hidden"
        onChange={handleFileSelected}
      />
      <Dialog open={profileModalOpen} onOpenChange={setProfileModalOpen}>
        <DialogContent className="max-w-[480px] gap-0 overflow-hidden p-0">
          <DialogHeader className="px-6 pt-6 pb-0">
            <DialogTitle className="text-[17px] font-bold text-[#1a1a1a]">
              Company Profile
            </DialogTitle>
          </DialogHeader>

          {/* Preview */}
          <div
            className="mx-6 mt-4 mb-6 flex items-center justify-center rounded-2xl bg-[#f2f2f2]"
            style={{ height: 220 }}
          >
            <LogoPreview
              logoUrl={displayLogoUrl}
              cropData={displayCropData}
              size={170}
            />
          </div>

          {/* Action buttons */}
          <div className="flex border-t border-[#ececec]">
            <button
              type="button"
              className="flex flex-1 flex-col items-center justify-center gap-2 py-5 transition-colors hover:bg-[#fafafa] disabled:opacity-40"
              onClick={handleEditClick}
              disabled={!displayLogoUrl}
            >
              <PencilIcon className="h-[22px] w-[22px] text-[#3a3a3a]" />
              <span className="text-[13px] font-medium text-[#3a3a3a]">
                Edit
              </span>
            </button>

            <button
              type="button"
              className="flex flex-1 flex-col items-center justify-center gap-2 py-5 border-x border-[#ececec] transition-colors hover:bg-[#fafafa]"
              onClick={handleUploadPhotoClick}
            >
              <UploadIcon className="h-[22px] w-[22px] text-[#3a3a3a]" />
              <span className="text-[13px] font-medium text-[#3a3a3a]">
                Upload Photo
              </span>
            </button>

            <button
              type="button"
              className="flex flex-1 flex-col items-center justify-center gap-2 py-5 transition-colors hover:bg-[#fafafa] disabled:opacity-40"
              onClick={handleDeleteLogo}
              disabled={deletingLogo || !displayLogoUrl}
            >
              <Trash2Icon className="h-[22px] w-[22px] text-[#3a3a3a]" />
              <span className="text-[13px] font-medium text-[#3a3a3a]">
                {deletingLogo ? "Deleting…" : "Delete"}
              </span>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={adjustModalOpen}
        onOpenChange={(open) => {
          if (!open) setAdjustModalOpen(false);
        }}
      >
        <DialogContent className="max-w-[520px] gap-0 overflow-hidden p-0">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle className="text-[17px] font-bold text-[#1a1a1a]">
              Adjust Photo
            </DialogTitle>
          </DialogHeader>

          <div
            className="relative mx-6 overflow-hidden rounded-2xl bg-[#111]"
            style={{ height: 340 }}
          >
            {adjustImageSrc && (
              <Cropper
                image={adjustImageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(area: Area) => setCroppedArea(area)}
              />
            )}
          </div>

          <div className="flex items-center gap-3 px-6 pt-5 pb-1">
            <span className="text-[13px] font-medium text-[#3a3a3a]">Zoom</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="h-[4px] flex-1 cursor-pointer accent-green-500"
            />
          </div>

          {/* Cancel / Save Photo */}
          <div className="flex justify-end gap-3 px-6 pb-6 pt-4">
            <Button
              variant="outline"
              className="h-10 min-w-[100px] border-[#d4d4d4] text-[13px] font-medium"
              onClick={() => setAdjustModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="h-10 min-w-[120px] bg-[#171717] text-[13px] font-semibold text-white hover:bg-[#333]"
              onClick={handleSavePhoto}
              disabled={!adjustImageSrc}
            >
              Save Photo
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
