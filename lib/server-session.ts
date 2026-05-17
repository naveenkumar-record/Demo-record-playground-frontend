import { cookies } from "next/headers";
import { cache } from "react";
import { AuthUser } from "@/interfaces/auth.interface";

const BACKEND_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080").replace(/\/$/, "");
const PROFILE_ENDPOINT = `${BACKEND_BASE_URL}/api/v1/auth/profile`;

type ApiResponse<TData = undefined> = {
  success: boolean;
  message: string;
  data?: TData;
};

type ProfileResponseData = {
  user: AuthUser;
};

type ServerSessionData = {
  isAuthenticated: boolean;
  user: AuthUser | null;
};

const getServerSessionData = cache(async (): Promise<ServerSessionData> => {
  const cookieStore = await cookies();

  const accessToken = cookieStore.get("auth_token")?.value;
  if (!accessToken) {
    return { isAuthenticated: false, user: null };
  }

  try {
    const profileResponse = await fetch(PROFILE_ENDPOINT, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    if (!profileResponse.ok) {
      return { isAuthenticated: false, user: null };
    }

    const profilePayload = (await profileResponse.json().catch(() => null)) as ApiResponse<ProfileResponseData> | null;
    return { isAuthenticated: true, user: profilePayload?.data?.user ?? null };
  } catch {
    return { isAuthenticated: false, user: null };
  }
});

export const hasValidServerSession = async (): Promise<boolean> => {
  const session = await getServerSessionData();
  return session.isAuthenticated;
};

export const getServerSessionUser = async (): Promise<AuthUser | null> => {
  const session = await getServerSessionData();
  return session.user;
};
