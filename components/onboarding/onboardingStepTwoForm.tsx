"use client";

import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  OnboardingButton,
  OnboardingField,
  OnboardingInput,
  OnboardingSelect,
} from "@/components/onboarding/onboardingUi";
import {
  createMemberOrganization,
  getMyOrganization,
} from "@/api/member-organization.api";
import { getAccessToken } from "@/lib/auth-client";

const organizationTypeOptions = [
  { value: "startup", label: "Startup" },
  { value: "enterprise", label: "Enterprise" },
  { value: "individual", label: "Individual" },
] as const;

type OnboardingStepTwoFormProps = {
  email: string;
};

export default function OnboardingStepTwoForm({
  email,
}: OnboardingStepTwoFormProps) {
  const router = useRouter();
  const [organizationName, setOrganizationName] = useState("");
  const [organizationType, setOrganizationType] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!organizationName.trim()) {
      toast.message("Organization name is required.");
      return;
    }

    if (!organizationType) {
      toast.message("Please select what best describes you.");
      return;
    }

    const accessToken = getAccessToken();
    if (!accessToken) {
      toast.message("Session expired. Please log in again.");
      router.push("/login");
      return;
    }

    setLoading(true);
    try {
      const res = await createMemberOrganization(
        { orgName: organizationName, orgRole: organizationType },
        accessToken,
      );

      const orgId = res.data?.orgId;

      toast.message("Organization saved successfully"); // ✅ updated text

      router.push(
        `/onboarding/invite?email=${encodeURIComponent(email)}&orgId=${encodeURIComponent(orgId ?? "")}`, // ✅ pass orgId
      );
    } catch {
      toast.message("Failed to save organization");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchOrg = async () => {
      try {
        const token = getAccessToken();
        if (!token) return;

        const res = await getMyOrganization(token);
        const org = res.data; // ✅ res.data IS the org object

        if (org) {
          setOrganizationName(org.orgName || "");
          setOrganizationType(org.orgRole || "");
        }
      } catch (error) {
        console.error("Failed to fetch organization", error);
      }
    };

    fetchOrg();
  }, []);

  return (
    <form className="mt-[18px] grid gap-2.5 sm:gap-2" onSubmit={handleSubmit}>
      <OnboardingField
        label={
          <>
            Organization name <span className="text-red-500">*</span>
          </>
        }
      >
        <OnboardingInput
          id="orgName"
          name="orgName"
          placeholder="ABC or Personal"
          value={organizationName}
          onChange={(event) => setOrganizationName(event.target.value)}
        />
      </OnboardingField>

      <OnboardingField
        label={
          <>
            What best describes you? <span className="text-red-500">*</span>
          </>
        }
      >
        <OnboardingSelect
          id="orgType"
          name="orgType"
          placeholder="Select"
          options={organizationTypeOptions}
          value={organizationType}
          onValueChange={setOrganizationType}
        />
      </OnboardingField>

      <OnboardingButton disabled={loading}>
        {loading ? "Creating..." : "Create Organization"}
      </OnboardingButton>
    </form>
  );
}
