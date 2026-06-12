"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import authApi from "@/api/auth.api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { clearAuthSession, getAccessToken } from "@/lib/auth-client";

type ProfileMenuProps = {
  email?: string;
  letter: string;
};
 
export default function ProfileMenu({ email, letter }: ProfileMenuProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);
    const accessToken = getAccessToken();

    try {
      if (accessToken) {
        await authApi.logout(accessToken);
      }
    } catch {
      toast.message("Logout request failed. Clearing local session.");
    } finally {
      clearAuthSession();
      router.replace("/login");
      router.refresh();
      setIsLoggingOut(false);
    }
  };

  const trigger = (
    <span className="grid h-9 w-9 place-items-center rounded-full bg-[#e5e9ef] text-sm font-semibold text-[#6e747f]">
      {letter}
    </span>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" aria-label="Profile" className="cursor-pointer">
          {trigger}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-[180px] max-w-[300px] p-1"
      >
        <DropdownMenuLabel className="p-3">
          <p className=" text-[12px] font-medium text-[#595959]">
            {email || "No email available"}
          </p>
        </DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => router.push("/settings")}>
          Your profile
        </DropdownMenuItem>
        {/* <DropdownMenuItem>Exit setup</DropdownMenuItem> */}
        {/* <DropdownMenuItem>Terms &amp; policies</DropdownMenuItem> */}
        {/* <DropdownMenuItem>Help</DropdownMenuItem> */}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={isLoggingOut}
          onSelect={(event) => {
            event.preventDefault();
            void handleLogout();
          }}
        >
          {isLoggingOut ? "Logging out..." : "Log out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
