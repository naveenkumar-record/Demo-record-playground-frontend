"use client";

import Image from "next/image";
import Link from "next/link";
import { FlaskConicalIcon, Settings } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { bluecollarNav, whitecollarNav } from "./navConfig";
import { useTestMode } from "./testModeContext";

type SidebarNavProps = {
  onNavigate?: () => void;
};

export default function SidebarNav({ onNavigate }: SidebarNavProps) {
  const pathname = usePathname();
  const { isTestMode, setIsTestMode } = useTestMode();
  const router = useRouter();

  const isWhitecollar = pathname.startsWith("/whitecollar");
  const nav = isWhitecollar ? whitecollarNav : bluecollarNav;

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <Link
        href={
          isWhitecollar ? "/whitecollar/dashboard" : "/bluecollar/dashboard"
        }
        className="mb-5 ml-2 mt-2 flex items-center gap-2"
      >
        <Image
          src="/logo.png"
          alt="Record"
          width={24}
          height={24}
          className="rounded"
        />
        <span className="text-xl font-semibold text-black">Record Studio</span>
      </Link>

      {/* Product mode toggle */}
      <button
        type="button"
        role="switch"
        aria-checked={isWhitecollar}
        aria-label="Switch between blue collar and white collar"
        onClick={() =>
          router.push(
            isWhitecollar ? "/bluecollar/dashboard" : "/whitecollar/dashboard",
          )
        }
        className="relative mb-3 grid h-10 w-full gap-[6px] cursor-pointer grid-cols-2 rounded-lg bg-neutral-100 p-1 text-[13px] font-medium text-neutral-500"
      >
        <span
          className={cn(
            "absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-md bg-white shadow-sm transition-transform duration-200",
            isWhitecollar && "translate-x-full",
          )}
        />
        <span
          className={cn(
            "relative z-10 grid place-items-center rounded-md border border-transparent bg-transparent transition-colors",
            !isWhitecollar ? "text-[#1f1f1f]" : "hover:border-neutral-300 hover:bg-neutral-300 hover:text-[#1f1f1f]",
          )}
        >
          Blue Collar
        </span>
        <span
          className={cn(
            "relative z-10 grid place-items-center rounded-md border border-transparent bg-transparent transition-colors",
            isWhitecollar ? "text-[#1f1f1f]" : "hover:border-neutral-300 hover:bg-neutral-300 hover:text-[#1f1f1f]",
          )}
        >
          White Collar
        </span>
      </button>

      {/* Navigation */}
      <div className="flex flex-1 flex-col space-y-5">
        {nav.map(({ group, items }) => (
          <div key={group} className="space-y-2">
            {/* Group Label */}
            <p className="px-1 text-[14px] font-medium text-[#8a8f98]">
              {group}
            </p>

            {/* Links */}
            <div className="space-y-2">
              {items.map(({ label, href, icon: Icon, external }) => {
                const active = pathname === href;

                const className = cn(
                  "flex cursor-pointer items-center gap-3 rounded-md px-1 py-1 text-[14px] leading-6 transition-colors",
                  active
                    ? "font-semibold text-black"
                    : "font-normal text-[#2f3b4c] hover:text-black",
                );

                const iconClass = cn(
                  "h-5 w-5 shrink-0 stroke-[2]",
                  active ? "text-[#ff5723]" : "text-[#8a8f98]",
                );

                return external ? (
                  <a
                    key={href}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={className}
                  >
                    <Icon className={iconClass} />
                    {label}
                  </a>
                ) : (
                  <Link
                    key={href}
                    href={href}
                    onClick={onNavigate}
                    className={className}
                  >
                    <Icon className={iconClass} />
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Test Mode toggle */}
      <div className="border-t border-[#e7e7e7] py-4">
        <div
          role="button"
          tabIndex={0}
          onClick={() => setIsTestMode(!isTestMode)}
          onKeyDown={(e) => e.key === "Enter" && setIsTestMode(!isTestMode)}
          className="flex w-full cursor-pointer items-center gap-3 rounded-md px-1 py-2 text-[14px] text-[#2f3b4c] transition-colors hover:text-black"
        >
          <FlaskConicalIcon className="h-5 w-5 shrink-0 text-[#8a8f98]" />
          <span className="flex-1 text-left">Test Mode</span>
          <Switch
            checked={isTestMode}
            onCheckedChange={setIsTestMode}
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        <div
          onClick={() => router.push("/settings")}
          className="flex cursor-pointer items-center gap-3 rounded-md px-1 py-2 text-[14px] text-[#2f3b4c] transition-colors hover:text-black"
        >
          <Settings className="h-5 w-5 text-[#2f3b4c]" />
          <span>Account & Settings</span>
        </div>
      </div>

      {/* Footer */}
      <div className="pb-4 text-xs whitespace-nowrap text-gray-400">
        Privacy Policy | Terms & Conditions
      </div>
    </div>
  );
}
