"use client";

import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import authApi from "@/api/auth.api";
import {
  AuthCard,
  AuthForm,
  AuthInput,
  AuthShell,
  PrimaryAuthButton,
} from "@/components/auth/authUi";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/auth-client";

type Step = "send-code" | "enter-code" | "enter-password";

export default function Page() {
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") ?? "";
  const router = useRouter();
  const [step, setStep] = useState<Step>("send-code");
  const [code, setCode] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);

  const handleSendCode = async () => {
    setIsSendingCode(true);
    try {
      const response = await authApi.forgotPassword({ email: initialEmail });
      toast.message(response.message || "Reset code sent. Check your inbox.");
      setStep("enter-code");
      setCode("");
    } catch (error) {
      toast.message(getErrorMessage(error, "Unable to send reset code."));
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code.trim()) {
      toast.message("Enter the verification code from your email.");
      return;
    }

    setIsVerifyingCode(true);
    try {
      const response = await authApi.verifyResetCode({
        email: initialEmail,
        code: code.trim(),
      });
      toast.message("Code verified. Set your new password.");
      setResetToken(response.data?.resetToken ?? "");
      setStep("enter-password");
    } catch (error) {
      toast.message(
        getErrorMessage(error, "Invalid or expired code. Please try again."),
      );
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const handleResetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");

    if (!password) {
      toast.message("Please enter a new password.");
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.resetPassword({ resetToken, newPassword: password });
      toast.message("Password reset successfully.");
      router.push("/login");
    } catch (error) {
      toast.message(
        getErrorMessage(error, "Unable to reset password right now."),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell variant="signup">
      <AuthCard
        title="Reset password"
        variant="signup"
        subtitle="Click continue to reset your password."
        showBrandLogo
      >
        <div className="mt-4 flex flex-col gap-1 text-left sm:mt-[18px]">
          <label className="mb-2 block font-semibold text-black text-sm">
            Email address
          </label>
          <div className="flex items-center justify-between rounded-md border border-input bg-[#f5f5f5] px-3 py-2 text-sm">
            <span className="text-[#8a8a8a]">{initialEmail}</span>
            {/* <Link href="/login" className="cursor-pointer text-[12px] font-medium text-[#595959] hover:underline">
              Edit
            </Link> */}
          </div>
        </div>
        <div className="mt-2">
          {step === "send-code" && (
            <PrimaryAuthButton
              type="button"
              onClick={handleSendCode}
              disabled={isSendingCode}
            >
              {isSendingCode ? "Sending code..." : "Send reset code"}
            </PrimaryAuthButton>
          )}
        </div>

        {step === "enter-code" && (
          <>
            <AuthInput
              name="code"
              label="Verification code"
              placeholder="Enter 6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
            <Button
              type="button"
              variant="link"
              onClick={handleSendCode}
              disabled={isSendingCode}
              className="app-text-button h-auto p-0 text-[#595959]"
            >
              {isSendingCode ? "Resending code..." : "Resend reset code"}
            </Button>

            <PrimaryAuthButton
              type="button"
              onClick={handleVerifyCode}
              disabled={isVerifyingCode}
            >
              {isVerifyingCode ? "Verifying..." : "Verify code"}
            </PrimaryAuthButton>
          </>
        )}

        {step === "enter-password" && (
          <AuthForm onSubmit={handleResetPassword}>
            <div className="text-left">
              <Label
                htmlFor="password"
                className="font-semibold text-black text-sm mb-2"
              >
                New password
              </Label>
              <div className="relative flex items-center">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  className="pr-9"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-0 flex h-full w-9 cursor-pointer items-center justify-center text-[#a3a3a3] hover:text-[#595959] focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff size={15} strokeWidth={1.75} />
                  ) : (
                    <Eye size={15} strokeWidth={1.75} />
                  )}
                </button>
              </div>
            </div>

            <PrimaryAuthButton disabled={isSubmitting}>
              {isSubmitting ? "Resetting password..." : "Reset password"}
            </PrimaryAuthButton>
          </AuthForm>
        )}

        <p className="mt-3 text-[13px] text-[#8a8a8a] sm:text-[14px]">
          <Link
            href="/login"
            className="cursor-pointer text-[#595959] hover:underline"
          >
            Back to login
          </Link>
        </p>
      </AuthCard>
    </AuthShell>
  );
}
