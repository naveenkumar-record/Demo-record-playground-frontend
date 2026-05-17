"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

export default function GoogleProvider({ children }: { children: React.ReactNode }) {
  const handleScriptLoad = () => {
    const w = window as typeof window & { google?: { accounts?: { id?: { cancel?: () => void } } } };
    if (typeof window !== "undefined" && w.google?.accounts?.id?.cancel) {
      w.google.accounts.id.cancel();
    }
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID} onScriptLoadSuccess={handleScriptLoad}>
      {children}
    </GoogleOAuthProvider>
  );
}
