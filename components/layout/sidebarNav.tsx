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
      <div className="flex items-center gap-2 mb-4 mt-2 ml-2">
        <Image
          src="/logo.png"
          alt="Record"
          width={24}
          height={24}
          className="rounded"
        />
        <span className="text-xl font-semibold text-black">
          RecordStudio
        </span>
      </div>

      {/* Vertical switcher */}
      <div className="mb-3 flex rounded-lg bg-neutral-100 p-0.5">
        <button
          type="button"
          onClick={() => router.push("/bluecollar/dashboard")}
          className={cn(
            "flex-1 cursor-pointer rounded-md py-1.5 text-[13px] font-medium transition-colors",
            isWhitecollar
              ? "text-neutral-500 hover:bg-neutral-200"
              : "bg-white text-[#1f1f1f] shadow-sm",
          )}
        >
          Bluecollar
        </button>
        <button
          type="button"
          onClick={() => router.push("/whitecollar/dashboard")}
          className={cn(
            "flex-1 rounded-md py-1.5 text-[13px] font-medium transition-colors",
            !isWhitecollar
              ? "text-neutral-500 hover:bg-neutral-200"
              : "bg-white text-[#1f1f1f] shadow-sm",
          )}
        >
          whitecollar
        </button>
      </div>

      {/* Navigation */}
      <div className="flex flex-col flex-1 space-y-3">

        {nav.map(({ group, items }) => (
          <div key={group} className="space-y-1">

            {/* Group Label */}
            <p className="px-1 text-sm text-gray-500">
              {group}
            </p>

            {/* Links */}
            <div className="space-y-1">
              {items.map(({ label, href, icon: Icon, external }) => {
                const active = pathname === href;

                const className = cn(
                  "flex cursor-pointer items-center gap-2 rounded-md px-1 py-1.5 text-[15px] transition-colors",
                  active
                    ? "bg-gray-100 font-semibold"
                    : "text-gray-600 hover:bg-gray-100"
                );

                const iconClass = cn(
                  "h-4 w-4 shrink-0",
                  active ? "text-orange-600" : "text-gray-500"
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
          className="flex w-full cursor-pointer items-center gap-2 rounded-md px-1 py-1.5 text-[15px] text-gray-600 transition-colors hover:bg-gray-100"
        >
          <FlaskConicalIcon className="h-4 w-4 shrink-0 text-gray-500" />
          <span className="flex-1 text-left text-sm">Test Mode</span>
          <Switch
            checked={isTestMode}
            onCheckedChange={setIsTestMode}
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        <div
          onClick={() => router.push("/settings")}
          className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-2 hover:bg-gray-100"
        >
          <Settings className="h-4 w-4" />
          <span className="text-sm">Account & Settings</span>
        </div>
      </div>

      {/* Footer */}
      <div className="pb-4 text-xs whitespace-nowrap text-gray-400">
        Privacy Policy | Terms & Conditions
      </div>

    </div>
  );
}
