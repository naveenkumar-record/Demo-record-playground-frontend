import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Network,
  ScrollText,
  Send,
  Settings,
  UserPlus,
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
      { label: "Requests", href: "/bluecollar/requests", icon: ClipboardList },
      { label: "Logs", href: "/bluecollar/logs", icon: ScrollText },
    ],
  },
  // {
  //   group: "Configuration",
  //   items: [
  //     { label: "Settings", href: "/settings", icon: Settings },
  //   ],
  // },
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
      { label: "Assign", href: "/whitecollar/assign", icon: UserPlus },
      { label: "API Requests", href: "/whitecollar/requests", icon: FileText },
    ],
  },
  {
    group: "Developer",
    items: [
      
      {
        label: "Documentation",
        href: "https://docs.userecord.io/smartai/introduction",
        icon: BookOpen,
        external: true,
      },
      {
        label: "Support",
        href: "https://cal.com/tharunm/30min",
        icon: Send,
        external: true,
      },
    ],
    
  },
];
