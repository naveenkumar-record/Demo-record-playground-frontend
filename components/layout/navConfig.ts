import type { LucideIcon } from "lucide-react";
import {
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

export const nav: NavGroup[] = [
  {
    group: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    group: "Verification",
    items: [
      { label: "Workflows", href: "/workflows", icon: Network },
      // { label: "Analytics", href: "/analytics", icon: FileLineChart },
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
    }
    ],
  },
];
