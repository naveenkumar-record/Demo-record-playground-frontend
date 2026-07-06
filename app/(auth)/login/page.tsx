"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import authApi from "@/api/auth.api";
import { ApiError } from "@/config/http.config";
import {
  AuthCard,
  AuthForm,
  AuthInput,
  AuthOrDivider,
  AuthShell,
  PrimaryAuthButton,
} from "@/components/auth/authUi";
import GoogleAuthButton from "@/components/auth/googleAuthButton";
import { getErrorMessage, setAuthSession } from "@/lib/auth-client";
import { toast } from "sonner";

type Step = "email" | "login";

export default function Page() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const goBack = () => {
    setStep("email");
  };

  const handleEmailSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const value = String(formData.get("email") ?? "")
      .trim()
      .toLowerCase();

    if (!value) {
      toast.message("Email is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await authApi.checkEmail({ email: value });
      const emailStatus = response.data;
      setEmail(value);

      if (!emailStatus?.exists) {
        router.push(`/signup?email=${encodeURIComponent(value)}`);
      } else if (emailStatus.hasPassword) {
        setStep("login");
      } else {
        router.push(`/set-password?email=${encodeURIComponent(value)}`);
      }
    } catch (error) {
      toast.message(
        getErrorMessage(error, "Something went wrong. Please try again."),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoginSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");

    if (!password) {
      toast.message("Password is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await authApi.login({ email, password });
      if (response.data?.accessToken) {
        setAuthSession(response.data.accessToken, response.data.user);
      }
      router.push(
        response.data?.hasOrganization ? "/bluecollar/dashboard" : "/onboarding",
      );
    } catch (error) {
      if (error instanceof ApiError && error.status === 403) {
        if (error.message.includes("Password login is not available")) {
          router.push(`/set-password?email=${encodeURIComponent(email)}`);
          return;
        }
        if (error.message.includes("Email is not verified")) {
          router.push(`/verification?email=${encodeURIComponent(email)}`);
          return;
        }
      }
      toast.message(getErrorMessage(error, "Unable to login right now."));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === "email") {
    return (
      <AuthShell>
        <AuthCard
          title="Welcome back"
          showBrandLogo
        >
          <AuthForm onSubmit={handleEmailSubmit}>
            <AuthInput
              name="email"
              label="Email Address"
              placeholder="name@gmail.com"
              type="email"
              autoComplete="email"
            />
            <PrimaryAuthButton disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Continue"}
            </PrimaryAuthButton>
          </AuthForm>
          <AuthOrDivider />
          <GoogleAuthButton />
        </AuthCard>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <AuthCard title="Welcome back" showBrandLogo>
        <AuthForm onSubmit={handleLoginSubmit}>
          <div className="relative">
            <AuthInput
              name="email"
              label="Email address"
              type="email"
              value={email}
              className=" text-black placeholder:text-gray-400"
              readOnly
            />
            <button
              type="button"
              onClick={goBack}
              className="absolute right-3 top-9 cursor-pointer text-[13px] text-[#595959] hover:underline"
            >
              Edit
            </button>
          </div>
          <div className="relative">
            <AuthInput
              name="password"
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter password"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-8 cursor-pointer text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <p className="m-0 text-left text-[13px] text-[#8a8a8a] sm:text-[14px]">
            <Link
              href={`/reset-password?email=${encodeURIComponent(email)}`}
              className="cursor-pointer text-[#595959] hover:underline"
            >
              Forgot password?
            </Link>
          </p>
          <PrimaryAuthButton disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Continue"}
          </PrimaryAuthButton>
        </AuthForm>
        <AuthOrDivider />
        <GoogleAuthButton />
      </AuthCard>
    </AuthShell>
  );
}
