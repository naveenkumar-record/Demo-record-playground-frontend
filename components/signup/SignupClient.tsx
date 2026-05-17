"use client";
 
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import authApi from "@/api/auth.api";
import {
  AuthCard,
  AuthForm,
  AuthShell,
  PrimaryAuthButton,
} from "@/components/auth/authUi";
import { Input } from "@/components/ui/input";
import { getErrorMessage } from "@/lib/auth-client";

export default function Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") ?? "";
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage("");

    const formData = new FormData(e.currentTarget);
    const password = String(formData.get("password") ?? "");

    if (!password) {
      setErrorMessage("Password is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.signup({ email: initialEmail, password });
      router.push(`/verification?email=${encodeURIComponent(initialEmail)}`);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Unable to create account. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell>
      <AuthCard title="Create your account" showBrandLogo>
        <AuthForm onSubmit={handleSubmit} >
          <div className="flex flex-col gap-1 text-left">
            <label className="text-sm mb-2 block font-semibold text-black">
              Email address
            </label>
            <div className="flex items-center justify-between rounded-md border border-input bg-gray-50 px-3 py-2 text-sm">
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

          <div className="flex flex-col gap-1 text-left">
            <label className="text-sm mb-2 block font-semibold text-black">
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
            {isSubmitting ? "Creating account..." : "Continue"}
          </PrimaryAuthButton>
        </AuthForm>
      </AuthCard>
    </AuthShell>
  );
}
