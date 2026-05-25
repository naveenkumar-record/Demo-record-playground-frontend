import type { LucideIcon } from "lucide-react";
import {
  ClipboardList,
  FileText,
  LayoutDashboard,
  Network,
  Send,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  external?: boolean;
};

export type NavGroup = {
  group: string;
  items: NavItem[];
};

export const bluecollarNav: NavGroup[] = [
  {
    group: "Overview",
    items: [
      { label: "Dashboard", href: "/bluecollar/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    group: "Verification & Skills",
    items: [
      { label: "Workflows", href: "/bluecollar/workflows", icon: Network },
    ],
  },
  {
    group: "Developer",
    items: [
      {
        label: "Support",
        href: "https://cal.com/tharunm/30min",
        icon: Send,
        external: true,
      },
    ],
  },
];

export const whitecollarNav: NavGroup[] = [
  {
    group: "Overview",
    items: [
      { label: "Dashboard", href: "/whitecollar/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    group: "Verification & Skills",
    items: [
      { label: "Workflows", href: "/whitecollar/workflows", icon: Network },
      { label: "Assessments", href: "/whitecollar/assessments", icon: ClipboardList },
      { label: "Requests", href: "/whitecollar/requests", icon: FileText },
    ],
  },
  {
    group: "Developer",
    items: [
      {
        label: "Support",
        href: "https://cal.com/tharunm/30min",
        icon: Send,
        external: true,
      },
    ],
  },
];
