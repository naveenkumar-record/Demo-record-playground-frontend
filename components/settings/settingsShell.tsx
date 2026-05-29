"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const SETTINGS_NAV = [
  { label: "Company Details", href: "/settings" },
  { label: "Users",           href: "/settings/users" },
  { label: "Projects",        href: "/settings/projects" },
  { label: "Billing",         href: "/settings/billing" },
];

export default function SettingsShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router   = useRouter();

  return (
    <div className="flex h-full flex-col">

      {/* Settings top bar */}
      <div className="flex shrink-0 items-center border-b border-[#e7e7e7] bg-white px-5 py-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex cursor-pointer items-center gap-1.5 text-lg font-semibold text-[#1a1a1a] transition-opacity hover:opacity-60"
        >
          <ChevronLeft className="h-[18px] w-[18px]" strokeWidth={2.5} />
          Settings
        </button>
      </div>

      <div className="flex flex-1 min-h-0">

        {/* Inner sidebar */}
        <aside className="w-[200px] shrink-0 overflow-y-auto border-r border-[#e7e7e7] bg-white px-3 py-5">
          <nav className="flex flex-col gap-0.5">
            {SETTINGS_NAV.map(({ label, href }) => {
              const active =
                href === "/settings"
                  ? pathname === "/settings"
                  : pathname === href || pathname.startsWith(href + "/");

              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "rounded-md px-3 py-2 text-[15px] transition-colors",
                    active
                      ? "bg-[#f0f0f0] font-medium text-[#1a1a1a]"
                      : "text-[#6a6a6a] hover:bg-[#f5f5f5] hover:text-[#1a1a1a]",
                  )}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Page content */}
        <div className="flex-1 min-w-0 overflow-y-auto">
          {children}
        </div>

      </div>
    </div>
  );
}
