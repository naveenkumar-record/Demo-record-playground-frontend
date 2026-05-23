"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import authApi from "@/api/auth.api";
import {
  AuthCard,
  AuthForm,
  AuthInput,
  AuthShell,
  PrimaryAuthButton,
} from "@/components/auth/authUi";
import { getErrorMessage, setAuthSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function Page() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email") ?? "";
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleVerify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const code = String(formData.get("code") ?? "").trim();

    if (!code) {
      toast.message("Verification code resent");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await authApi.verifyEmail({ email, code });
      if (response.data?.accessToken) {
        setAuthSession(response.data.accessToken, response.data.user);
      }
      router.push(
        response.data?.hasOrganization ? "/bluecollar/dashboard" : "/onboarding",
      );
    } catch (error) {
      toast.message(
        getErrorMessage(error, "Unable to verify email right now."),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      await authApi.resendVerification({ email });
      toast.message("Verification code resent.");
    } catch (error) {
      toast.error(
        getErrorMessage(error, "Unable to resend verification code."),
      );
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthShell>
      <AuthCard
        title="Check your inbox"
        subtitle={`Enter verification code we just sent to ${email}`}
        showBrandLogo
      >
        <AuthForm onSubmit={handleVerify}>
          <AuthInput
            name="code"
            label="Code"
            placeholder="Enter 6-digit code"
            required
          />
          <PrimaryAuthButton disabled={isSubmitting}>
            {isSubmitting ? "Verifying..." : "Continue"}
          </PrimaryAuthButton>
        </AuthForm>

        <p className="mt-3 text-[13px] text-[#8a8a8a]">
          <Button
            type="button"
            variant="link"
            onClick={handleResend}
            disabled={isResending}
            className="app-text-button p-0 text-[#595959] no-underline"
          >
            {isResending ? "Resending..." : "Resend email"}
          </Button>
        </p>
      </AuthCard>
    </AuthShell>
  );
}
