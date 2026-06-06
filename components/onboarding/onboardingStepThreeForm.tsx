"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RoleDropdown } from "@/components/onboarding/roleDropdown";
import {
  OnboardingButton,
  OnboardingField,
  OnboardingInput,
} from "@/components/onboarding/onboardingUi";
import { inviteMember, InviteRole } from "@/api/user-access.api";
import { getAccessToken } from "@/lib/auth-client";

type OnboardingStepThreeFormProps = {
  email: string;
  orgId: string;
};



const isValidEmail = (value: string): boolean => /\S+@\S+\.\S+/.test(value);

export default function OnboardingStepThreeForm({
  email,
  orgId,
}: OnboardingStepThreeFormProps) {
  const router = useRouter();
  const [inviteEmail, setInviteEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nextInviteEmail = String(formData.get("inviteEmail") ?? "").trim().toLowerCase();
    const role = String(formData.get("role") ?? "").trim() as InviteRole;

    if (!nextInviteEmail) {
      toast.message("Invite email is required.");
      return;
    }

    if (!isValidEmail(nextInviteEmail)) {
      toast.message("Enter a valid invite email.");
      return;
    }

    if (!role) {
      toast.message("Please select a role.");
      return;
    }

    if (!orgId) {
      toast.message("Organization not found. Please go back and try again.");
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
      await inviteMember({ orgId, email: nextInviteEmail, role }, accessToken);
      toast.message("Invite sent successfully.");
      router.push("/bluecollar/dashboard");
    } catch (err: unknown) {
      toast.message(err instanceof Error ? err.message : "Failed to send invite.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="mt-4 grid gap-2.5 sm:gap-2" onSubmit={handleSubmit}>
      <input type="hidden" name="email" value={email} />
      <OnboardingField label="Email">
        <OnboardingInput
          id="inviteEmail"
          name="inviteEmail"
          placeholder="name@company.com"
          value={inviteEmail}
          onChange={(event) => setInviteEmail(event.target.value)}
        />
      </OnboardingField>

      <OnboardingField label="Role">
        <RoleDropdown />
      </OnboardingField>

      <OnboardingButton disabled={loading}>
        {loading ? "Sending invite..." : "Send Invite"}
      </OnboardingButton>
    </form>
  );
}
