"use client";

import { useState } from "react";
import { UserPlus, Shield, Search, MoreVertical, Check } from "lucide-react";
import { repositories } from "@/src/application/services/container";
import { useAsync } from "@/src/application/hooks/use-async";
import { relativeTime, formatDate } from "@/src/application/services/formatting";
import { ROLE_PERMISSIONS, type User, type UserRole } from "@/src/domain/entities/user";
import { PageHeader } from "../components/ui/page-header";
import { Card, CardHeader } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge, type BadgeTone } from "../components/ui/badge";
import { Modal } from "../components/ui/modal";
import { Select, TextInput, Label } from "../components/ui/field";
import { TableSkeleton } from "../components/ui/skeleton";
import { DataTable, type Column } from "../components/ui/data-table";
import { useToast } from "../components/ui/toast";

const ROLES: UserRole[] = ["Administrator", "Analyst", "Reviewer", "Viewer"];

const ROLE_TONES: Record<UserRole, BadgeTone> = {
  Administrator: "danger", Analyst: "accent", Reviewer: "info", Viewer: "neutral",
};

const STATUS_TONES: Record<User["status"], BadgeTone> = {
  active: "success", suspended: "danger", invited: "warning",
};

const ALL_PERMISSIONS = ["read", "write", "validate", "publish", "manage-users", "configure"];

export function UsersView() {
  const { notify } = useToast();
  const { data, loading, setData } = useAsync(() => repositories.users.list(), []);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selected, setSelected] = useState<User | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);

  const users = data ?? [];
  const visible = users.filter(
    (u) =>
      (roleFilter === "all" || u.role === roleFilter) &&
      (search === "" ||
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())),
  );

  async function changeRole(user: User, role: UserRole) {
    const updated = await repositories.users.updateRole(user.id, role);
    setData(users.map((u) => (u.id === user.id ? updated : u)));
    setSelected(updated);
    notify({ tone: "success", title: "Role updated", description: `${user.name} is now ${role}` });
  }

  async function toggleStatus(user: User) {
    const next = user.status === "active" ? "suspended" : "active";
    const updated = await repositories.users.setStatus(user.id, next);
    setData(users.map((u) => (u.id === user.id ? updated : u)));
    setSelected(updated);
    notify({
      tone: next === "suspended" ? "warning" : "success",
      title: next === "suspended" ? "User suspended" : "User reactivated",
      description: user.name,
    });
  }

  const columns: Column<User>[] = [
    {
      key: "name", header: "User", sortValue: (u) => u.name,
      render: (u) => (
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-navy-900 text-[10px] font-semibold text-white">
            {u.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium text-navy-900">{u.name}</p>
            <p className="truncate text-[11px] text-navy-400">{u.email}</p>
          </div>
        </div>
      ),
    },
    { key: "designation", header: "Designation", sortValue: (u) => u.designation, render: (u) => <span className="text-navy-600">{u.designation}</span> },
    { key: "subsidiary", header: "Subsidiary", sortValue: (u) => u.subsidiary, render: (u) => u.subsidiary },
    { key: "role", header: "Role", sortValue: (u) => u.role, render: (u) => <Badge tone={ROLE_TONES[u.role]}>{u.role}</Badge> },
    { key: "status", header: "Status", sortValue: (u) => u.status, render: (u) => <Badge tone={STATUS_TONES[u.status]}>{u.status}</Badge> },
    {
      key: "lastActive", header: "Last active", sortValue: (u) => u.lastActive,
      render: (u) => <span className="whitespace-nowrap text-navy-500">{relativeTime(u.lastActive)}</span>,
    },
    {
      key: "actions", header: "", align: "right",
      render: (u) => (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setSelected(u); }}
          aria-label={`Manage ${u.name}`}
          className="rounded-md p-1.5 text-navy-400 hover:bg-navy-50 hover:text-navy-700"
        >
          <MoreVertical className="size-3.5" aria-hidden />
        </button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="User & Role Management"
        description="Manage platform access, roles and permissions across CIL subsidiaries."
        breadcrumbs={[{ label: "Administration" }, { label: "User Management" }]}
        action={
          <Button onClick={() => setInviteOpen(true)}>
            <UserPlus className="size-4" aria-hidden />
            Invite user
          </Button>
        }
      />

      <div className="space-y-5 p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {ROLES.map((role) => (
            <div key={role} className="rounded-xl border border-navy-100 bg-white p-4">
              <p className="text-xs text-navy-500">{role}s</p>
              <p className="mt-1 font-serif text-2xl font-semibold text-navy-900">
                {users.filter((u) => u.role === role).length}
              </p>
            </div>
          ))}
        </div>

        <Card>
          <CardHeader
            title="Users"
            description={`${visible.length} of ${users.length} accounts`}
            action={
              <div className="flex flex-wrap gap-2">
                <div className="relative">
                  <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-navy-300" aria-hidden />
                  <TextInput
                    aria-label="Search users"
                    placeholder="Search name or email…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-8 w-48 py-0 pl-8 text-xs"
                  />
                </div>
                <Select
                  aria-label="Filter by role"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="h-8 w-auto py-0 text-xs"
                >
                  <option value="all">All roles</option>
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </Select>
              </div>
            }
          />
          {loading ? (
            <TableSkeleton rows={8} cols={6} />
          ) : (
            <DataTable
              columns={columns}
              rows={visible}
              onRowClick={setSelected}
              caption="Platform users and their assigned roles"
              emptyMessage="No users match the current filters."
            />
          )}
        </Card>

        <Card>
          <CardHeader
            title="Permission matrix"
            description="Capabilities granted by each role"
            action={<Shield className="size-4 text-navy-400" aria-hidden />}
          />
          <div className="scrollbar-thin overflow-x-auto">
            <table className="w-full min-w-[40rem] text-sm">
              <thead>
                <tr className="bg-navy-50/80">
                  <th scope="col" className="border-b border-navy-100 px-3 py-2.5 pl-4 text-left text-[11px] font-semibold tracking-wide text-navy-600 uppercase">
                    Role
                  </th>
                  {ALL_PERMISSIONS.map((permission) => (
                    <th
                      key={permission}
                      scope="col"
                      className="border-b border-navy-100 px-3 py-2.5 text-center text-[11px] font-semibold tracking-wide text-navy-600 uppercase last:pr-4"
                    >
                      {permission.replace("-", " ")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROLES.map((role) => (
                  <tr key={role} className="border-b border-navy-50 last:border-0">
                    <td className="px-3 py-2.5 pl-4">
                      <Badge tone={ROLE_TONES[role]}>{role}</Badge>
                    </td>
                    {ALL_PERMISSIONS.map((permission) => (
                      <td key={permission} className="px-3 py-2.5 text-center last:pr-4">
                        {ROLE_PERMISSIONS[role].includes(permission) ? (
                          <Check className="mx-auto size-4 text-emerald-600" aria-label="Granted" />
                        ) : (
                          <span className="text-navy-200" aria-label="Not granted">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.name ?? ""}
        description={selected?.email}
        size="sm"
        footer={
          selected ? (
            <>
              <Button variant="secondary" onClick={() => setSelected(null)}>Close</Button>
              <Button
                variant={selected.status === "active" ? "danger" : "primary"}
                onClick={() => void toggleStatus(selected)}
              >
                {selected.status === "active" ? "Suspend account" : "Reactivate account"}
              </Button>
            </>
          ) : null
        }
      >
        {selected ? (
          <div className="space-y-4">
            <dl className="grid grid-cols-2 gap-3">
              {[
                ["Designation", selected.designation],
                ["Subsidiary", selected.subsidiary],
                ["Status", selected.status],
                ["Member since", formatDate(selected.createdAt)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-navy-50 px-3 py-2">
                  <dt className="text-[10px] text-navy-400">{label}</dt>
                  <dd className="mt-0.5 truncate text-xs font-medium text-navy-800">{value}</dd>
                </div>
              ))}
            </dl>

            <div>
              <Label htmlFor="user-role">Role</Label>
              <Select
                id="user-role"
                value={selected.role}
                onChange={(e) => void changeRole(selected, e.target.value as UserRole)}
              >
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </Select>
              <p className="mt-2 text-[11px] text-navy-500">
                Grants: {ROLE_PERMISSIONS[selected.role].join(", ")}
              </p>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Invite user"
        description="Send a platform invitation to a CIL employee."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                setInviteOpen(false);
                notify({ tone: "success", title: "Invitation sent", description: "The user will receive an email shortly." });
              }}
            >
              Send invitation
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="invite-email">Official email address</Label>
            <TextInput id="invite-email" type="email" placeholder="name@coalindia.co.in" />
          </div>
          <div>
            <Label htmlFor="invite-role">Role</Label>
            <Select id="invite-role" defaultValue="Viewer">
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </Select>
          </div>
          <div>
            <Label htmlFor="invite-subsidiary">Subsidiary</Label>
            <Select id="invite-subsidiary" defaultValue="CMPDI">
              {["CMPDI", "ECL", "BCCL", "CCL", "NCL", "WCL", "SECL", "MCL", "NEC"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
          </div>
        </div>
      </Modal>
    </>
  );
}
