"use client";

import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import authApi from "@/api/auth.api";
import {
  AuthCard,
  AuthForm,
  AuthInput,
  AuthOrDivider,
  AuthShell,
  PrimaryAuthButton,
} from "@/components/auth/authUi";
import { Input } from "@/components/ui/input";
import GoogleAuthButton from "@/components/auth/googleAuthButton";
import { getErrorMessage } from "@/lib/auth-client";

type Step = "enter-password" | "enter-code";

export default function Page() {
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") ?? "";
  const router = useRouter();

  const [step, setStep] = useState<Step>("enter-password");
  const [password, setPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);
    const pwd = String(formData.get("password") ?? "");

    if (!pwd) {
      setErrorMessage("Password is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.forgotPassword({ email: initialEmail });
      setPassword(pwd);
      setStep("enter-code");
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Unable to send verification code."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCodeSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);
    const code = String(formData.get("code") ?? "").trim();

    if (!code) {
      setErrorMessage("Verification code is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      let token = resetToken;
      if (!token) {
        const verifyRes = await authApi.verifyResetCode({ email: initialEmail, code });
        token = verifyRes.data?.resetToken ?? "";
        setResetToken(token);
      }
      await authApi.setPasswordWithCode({ resetToken: token, password });
      router.push(`/dashboard`);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Invalid or expired code. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setErrorMessage("");
    try {
      await authApi.forgotPassword({ email: initialEmail });
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Unable to resend code."));
    }
  };

  if (step === "enter-password") {
    return (
      <AuthShell>
        <AuthCard title="Create password" showBrandLogo>
          <AuthForm onSubmit={handlePasswordSubmit}>
            <div className="flex flex-col gap-1 text-left">
              <label className="mb-2 block font-semibold text-black text-sm">
                Email address
              </label>
              <div className="flex items-center justify-between rounded-md border border-input bg-[#f5f5f5] px-3 py-2 text-sm">
                <span className="text-[#8a8a8a]">{initialEmail}</span>
                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="cursor-pointer text-[12px] font-medium text-[#595959] hover:underline"
                >
                  Edit
                </button>
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1 text-left">
              <label className="mb-2 block font-semibold text-black text-sm">
                Password
              </label>
              <div className="relative w-full">
                <Input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  required
                  className="w-full pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-[#a3a3a3] hover:text-[#595959] focus:outline-none"
                >
                  {showPassword ? <EyeOff size={15} strokeWidth={1.75} /> : <Eye size={15} strokeWidth={1.75} />}
                </button>
              </div>
            </div>

            {errorMessage ? (
              <p className="m-0 text-left text-[12px] text-[#c8382b]">{errorMessage}</p>
            ) : null}

            <PrimaryAuthButton disabled={isSubmitting}>
              {isSubmitting ? "Sending code..." : "Continue"}
            </PrimaryAuthButton>
          </AuthForm>

          <p className="mt-3 text-[13px] text-[#8a8a8a]">
            Already have an account?{" "}
            <Link href="/login" className="cursor-pointer text-[#595959] hover:underline">
              Login
            </Link>
          </p>

          <AuthOrDivider />
          <GoogleAuthButton />
        </AuthCard>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <AuthCard
        title="Check your inbox"
        subtitle={`Enter the verification code we just sent to ${initialEmail}`}
        showBrandLogo
      >
        <AuthForm onSubmit={handleCodeSubmit}>
          <AuthInput
            name="code"
            label="Verification code"
            placeholder="Enter 6-digit code"
            required
          />
          {errorMessage ? (
            <p className="m-0 text-left text-[12px] text-[#c8382b]">{errorMessage}</p>
          ) : null}

          <PrimaryAuthButton disabled={isSubmitting}>
            {isSubmitting ? "Verifying..." : "Continue"}
          </PrimaryAuthButton>
        </AuthForm>

        <p className="mt-3 text-[13px] text-[#8a8a8a]">
          Didn&apos;t receive it?{" "}
          <button
            type="button"
            onClick={handleResend}
            className="cursor-pointer text-[#595959]"
          >
            Resend email
          </button>
        </p>
      </AuthCard>
    </AuthShell>
  );
}
