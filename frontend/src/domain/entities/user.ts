export type UserRole = "Administrator" | "Analyst" | "Reviewer" | "Viewer";

export type AppRole = "parliamentary" | "ministry" | "domain-officer" | "admin";

export type UserStatus = "active" | "suspended" | "invited";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  subsidiary: string;
  designation: string;
  status: UserStatus;
  lastActive: string;
  createdAt: string;
}

export interface Credentials {
  employeeId: string;
  password: string;
  appRole: AppRole;
}

export interface Session {
  user: User;
  token: string;
  issuedAt: string;
}

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  Administrator: ["read", "write", "validate", "publish", "manage-users", "configure"],
  Analyst: ["read", "write", "validate", "publish"],
  Reviewer: ["read", "validate"],
  Viewer: ["read"],
};
