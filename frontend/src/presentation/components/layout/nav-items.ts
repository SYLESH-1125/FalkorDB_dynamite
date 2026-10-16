import {
  LayoutDashboard, Upload, Cpu, CheckSquare, MessageSquareText, FileBarChart,
  LayoutTemplate, Cloud, Archive, Landmark, TrendingUp, Users, ScrollText,
  Settings, Bell, LifeBuoy, type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  group: string;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, group: "Overview" },
  { href: "/upload", label: "Document Upload", icon: Upload, group: "Data Pipeline" },
  { href: "/processing", label: "Processing Status", icon: Cpu, group: "Data Pipeline" },
  { href: "/validation", label: "Data Validation", icon: CheckSquare, group: "Data Pipeline" },
  { href: "/query", label: "AI Query System", icon: MessageSquareText, group: "Intelligence" },
  { href: "/topics", label: "Word Cloud & Topics", icon: Cloud, group: "Intelligence" },
  { href: "/analytics", label: "Analytics & Insights", icon: TrendingUp, group: "Intelligence" },
  { href: "/reports", label: "Report Generation", icon: FileBarChart, group: "Reporting" },
  { href: "/templates", label: "Report Templates", icon: LayoutTemplate, group: "Reporting" },
  { href: "/archive", label: "Report Archive", icon: Archive, group: "Reporting" },
  { href: "/parliamentary", label: "Parliamentary Tracker", icon: Landmark, group: "Reporting" },
  { href: "/users", label: "User Management", icon: Users, group: "Administration" },
  { href: "/audit", label: "Audit Log", icon: ScrollText, group: "Administration" },
  { href: "/settings", label: "Integrations & Settings", icon: Settings, group: "Administration" },
  { href: "/notifications", label: "Notifications", icon: Bell, group: "General" },
  { href: "/help", label: "Help & Training", icon: LifeBuoy, group: "General" },
];

export const NAV_GROUPS = ["Overview", "Data Pipeline", "Intelligence", "Reporting", "Administration", "General"];

// visible only to Administrator accounts — kept out of the sidebar for every other role
export const ADMIN_ONLY_GROUPS = new Set(["Data Pipeline", "Administration"]);
