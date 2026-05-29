"use client";

import { useState } from "react";
import Image from "next/image";
import { useGoogleLogin } from "@react-oauth/google";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import authApi from "@/api/auth.api";
import { setAuthSession } from "@/lib/auth-client";

export default function GoogleAuthButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        // Send the Google access_token to our backend.
        // The backend calls Google's tokeninfo API server-side to verify it
        // and extract the email — so the email cannot be spoofed.
        const res = await authApi.googleLogin({
          accessToken: tokenResponse.access_token,
        });

        if (!res.data?.accessToken || !res.data.user) {
          throw new Error("Sign-in failed");
        }

        setAuthSession(res.data.accessToken, res.data.user);
        router.push(res.data.hasOrganization ? "/bluecollar/dashboard" : "/onboarding");
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Google sign-in failed.";
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    },

    onError: () => {
      toast.error("Google sign-in was cancelled or failed. Please try again.");
    },
  });

  return (
    <div className="mt-[9px] w-full">
      <button
        type="button"
        onClick={() => handleGoogleLogin()}
        disabled={loading}
        className="app-text-button inline-flex h-[40px] w-full cursor-pointer items-center justify-center gap-2 rounded-[9px] border border-[#e9e9e9] bg-white text-[13px] text-[#333333] hover:bg-[#fbfbfb] disabled:opacity-60 transition-colors"
      >
        <span className="inline-flex items-center justify-center" aria-hidden>
          <Image src="/google.svg" alt="" width={18} height={18} />
        </span>
        {loading ? "Connecting..." : "Continue with Google"}
      </button>
    </div>
  );
}
