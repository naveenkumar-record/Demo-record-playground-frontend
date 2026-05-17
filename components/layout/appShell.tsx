"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import Sidebar from "./sidebar";
import TestModeBanner from "./testModeBanner";

export default function AppShell({
  header,
  children,
}: {
  header: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isSettings = pathname.startsWith("/settings");

  return (
    <div
      className={cn(
        "h-full grid grid-cols-1 bg-[#f8f8f8] text-[#242424]",
        !isSettings && "lg:grid-cols-[220px_1fr]",
      )}
    >
      {!isSettings && <Sidebar />}

      <section className="flex h-full min-h-0 flex-col overflow-hidden">
        {header}
        <TestModeBanner pathname={pathname} />
        <main className="flex-1 min-h-0 overflow-y-auto bg-[#fff]">
          {children}
        </main>
      </section>
    </div>
  );
}
