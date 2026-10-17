import {
  LayoutDashboard, Upload, Cpu, CheckSquare, MessageSquareText, MessagesSquare, FileBarChart,
  LayoutTemplate, Cloud, Archive, Landmark, TrendingUp, Users, ScrollText,
  Settings, Bell, LifeBuoy, Share2, AlertTriangle, Brain, type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  group: string;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/brain", label: "Company Brain", icon: Brain, group: "Overview" },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, group: "Overview" },
  { href: "/problem", label: "The Problem", icon: AlertTriangle, group: "Overview" },
  { href: "/upload", label: "Document Upload", icon: Upload, group: "Data Pipeline" },
  { href: "/processing", label: "Processing Status", icon: Cpu, group: "Data Pipeline" },
  { href: "/validation", label: "Data Validation", icon: CheckSquare, group: "Data Pipeline" },
  { href: "/query", label: "AI Query System", icon: MessageSquareText, group: "Intelligence" },
  { href: "/query/conversations", label: "Conversations", icon: MessagesSquare, group: "Intelligence" },
  { href: "/topics", label: "Word Cloud & Topics", icon: Cloud, group: "Intelligence" },
  { href: "/topics/conversations", label: "Conversations", icon: MessagesSquare, group: "Intelligence" },
  { href: "/analytics", label: "Analytics & Insights", icon: TrendingUp, group: "Intelligence" },
  { href: "/graph", label: "Knowledge Graph", icon: Share2, group: "Intelligence" },
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

// the Parliamentary Response Team role is scoped to the AI Query chatbot plus its own problem-statement page
export const PARLIAMENTARY_ALLOWED_PATHS = new Set(["/brain", "/query", "/query/conversations", "/problem"]);

// visible only to the Parliamentary Response Team — hidden from every other role's sidebar
export const PARLIAMENTARY_ONLY_PATHS = new Set(["/problem"]);

// CMPDI / CIL Domain Officers only need the Word Cloud & Topics intelligence feature
export const DOMAIN_OFFICER_ALLOWED_PATHS = new Set(["/brain", "/topics", "/topics/conversations"]);

// visible only to CMPDI / CIL Domain Officers — hidden from every other role's sidebar
export const DOMAIN_OFFICER_ONLY_PATHS = new Set(["/topics/conversations"]);

// Ministry Policy & Monitoring Officers only need Report Generation and its template library
export const MINISTRY_ALLOWED_PATHS = new Set(["/brain", "/reports", "/templates"]);
