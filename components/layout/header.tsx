"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  MenuIcon,
  ChevronDownIcon,
  CheckIcon,
  FolderIcon,
  PlusIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import SidebarNav    from "./sidebarNav";
import { bluecollarNav, whitecollarNav } from "./navConfig";
import ProfileMenu   from "./profileMenu";
import { useOrg }    from "./orgContext";
import { useProject } from "./projectContext";
import { type OrgData } from "@/api/user-access.api";

function OrgAvatar({ org, size }: { org: OrgData; size: number }) {
  const { orgName } = org;
  const initial = orgName.charAt(0).toUpperCase() || "O";
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Before mount: always render the text fallback so server and first
  // client render are identical (avoids hydration mismatch when logoUrl
  // is fetched async after mount).
  const logoUrl = mounted ? org.logoUrl : undefined;

  if (!logoUrl) {
    return (
      <span
        style={{ width: size, height: size }}
        className="grid place-items-center rounded bg-neutral-900 text-white text-xs font-semibold"
      >
        {initial}
      </span>
    );
  }

  return (
    <span
      style={{
        width: size,
        height: size,
        backgroundImage: `url(${logoUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
      className="rounded border border-neutral-200"
    />
  );
}

type HeaderProps = {
  userInitial: string;
  email?: string;
};

type Crumb = {
  label: string;
  href: string | null;
  current: boolean;
};

function getBreadcrumbs(pathname: string): Crumb[] {
  if (pathname.startsWith("/settings")) return [];

  const nav = pathname.startsWith("/whitecollar") ? whitecollarNav : bluecollarNav;

  for (const { group, items } of nav) {
    for (const item of items) {
      if (item.href === pathname) {
        if (group === "Overview") {
          return [{ label: item.label, href: item.href, current: true }];
        }
        return [
          { label: group, href: null, current: false },
          { label: item.label, href: item.href, current: true },
        ];
      }
    }
  }
  const defaultHref = pathname.startsWith("/whitecollar")
    ? "/whitecollar/dashboard"
    : "/bluecollar/dashboard";
  return [{ label: "Dashboard", href: defaultHref, current: true }];
}

export default function Header({ userInitial, email }: HeaderProps) {
  const pathname = usePathname();
  const router   = useRouter();
  const [open, setOpen] = useState(false);

  const { organizations, activeOrg, setActiveOrg }                       = useOrg();
  const { projects, activeProject, setActiveProject, loading: projLoad } = useProject();

  const crumbs  = getBreadcrumbs(pathname);
  const orgName = activeOrg?.orgName ?? "";

  return (
    <>
      <header className="flex h-10 items-center justify-between border-b bg-neutral-50 !p-6 !bg-[#fff]">
        {/* LEFT */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-7 w-7"
            onClick={() => setOpen(true)}
          >
            <MenuIcon className="h-4 w-4 text-neutral-600" />
          </Button>

          {pathname.startsWith("/settings") ? (
            <div
              className="flex items-center gap-3 mt-2 cursor-pointer"
              onClick={() => router.push("/bluecollar/dashboard")}
            >
              <Image src="/logo.png" alt="Record" width={24} height={24} className="rounded" />
              <span className="text-xl font-semibold text-gray-800">Record Studio</span>
            </div>
          ) : (
            <Breadcrumb>
              <BreadcrumbList className="flex items-center gap-1.5">
                {crumbs.map((crumb, i) => (
                  <React.Fragment key={crumb.label}>
                    {i > 0 && <BreadcrumbSeparator />}
                    <BreadcrumbItem>
                      {crumb.current ? (
                        <BreadcrumbPage className="text-sm font-medium text-neutral-900">
                          {crumb.label}
                        </BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink
                          href={crumb.href ?? "#"}
                          className="text-sm text-neutral-500 hover:text-neutral-700"
                        >
                          {crumb.label}
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </React.Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          )}
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-2">

          {/* ── Project Switcher ── */}
          {activeOrg?.orgId && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-sm">
                  <FolderIcon className="h-3.5 w-3.5 text-neutral-500 shrink-0" />
                  <span className="max-w-[110px] truncate">
                    {projLoad ? "Loading…" : activeProject?.name ?? "Default"}
                  </span>
                  <ChevronDownIcon className="h-3.5 w-3.5 text-neutral-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <div className="px-2 py-1.5 text-[10px] font-semibold text-neutral-400 uppercase tracking-wide">
                  Projects
                </div>

                {/* Default (no project) */}
                <DropdownMenuItem
                  onClick={() => setActiveProject(null)}
                  className="flex items-center gap-2 text-[13px]"
                >
                  <FolderIcon className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                  <span className="flex-1 truncate">Default Project</span>
                  {!activeProject && (
                    <CheckIcon className="h-3.5 w-3.5 text-neutral-600" />
                  )}
                </DropdownMenuItem>

                {/* User-created projects */}
                {projects.map(p => (
                  <DropdownMenuItem
                    key={p.projectId}
                    onClick={() => setActiveProject(p)}
                    className="flex items-center gap-2 text-[13px]"
                  >
                    <FolderIcon className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                    <span className="flex-1 truncate">{p.name}</span>
                    {p.projectId === activeProject?.projectId && (
                      <CheckIcon className="h-3.5 w-3.5 text-neutral-600" />
                    )}
                  </DropdownMenuItem>
                ))}

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => router.push("/settings/projects")}
                  className="flex items-center gap-2 text-[13px] text-neutral-700"
                >
                  <PlusIcon className="h-3.5 w-3.5" />
                  Create Project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* ── Org Switcher ── */}
          {organizations.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-2 text-sm">
                  {activeOrg && <OrgAvatar org={activeOrg} size={16} />}
                  <span className="max-w-[90px] truncate">{orgName}</span>
                  <ChevronDownIcon className="h-3.5 w-3.5 text-neutral-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                {organizations.map((org) => (
                  <DropdownMenuItem
                    key={org.orgId}
                    onClick={() => setActiveOrg(org)}
                    className="flex items-center gap-2 text-sm"
                  >
                    <OrgAvatar org={org} size={18} />
                    <div className="flex flex-col flex-1 truncate">
                      <span className="truncate">{org.orgName}</span>
                      <span className="text-[11px] text-neutral-500 capitalize">
                        {org.userRole}
                      </span>
                    </div>
                    {org.orgId === activeOrg?.orgId && (
                      <CheckIcon className="h-3.5 w-3.5 text-neutral-600" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <ProfileMenu email={email} letter={userInitial} />
        </div>
      </header>

      {/* Mobile sidebar */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="left"
          className="flex w-56 flex-col bg-neutral-100 p-3"
          showCloseButton={false}
        >
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarNav onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}
