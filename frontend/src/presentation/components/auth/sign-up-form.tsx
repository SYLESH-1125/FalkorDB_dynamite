"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, AlertCircle } from "lucide-react";
import { repositories } from "@/src/application/services/container";
import { ROLE_LANDING_ROUTE } from "@/src/application/services/role-catalog";
import type { AppRole } from "@/src/domain/entities/user";
import { Button } from "../ui/button";
import { Label, TextInput } from "../ui/field";

const SUBSIDIARIES = ["ECL", "BCCL", "CCL", "NCL", "WCL", "SECL", "MCL", "NEC"] as const;

const APP_ROLES: { id: AppRole; label: string }[] = [
  { id: "parliamentary", label: "Parliamentary Response" },
  { id: "ministry", label: "Ministry Policy & Monitoring" },
  { id: "domain-officer", label: "CMPDI / CIL Domain Officer" },
];

export function SignUpForm({ defaultRole }: { defaultRole?: AppRole }) {
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [appRole, setAppRole] = useState<AppRole>(defaultRole ?? "domain-officer");
  const [subsidiary, setSubsidiary] = useState<string>(SUBSIDIARIES[0]);
  const [designation, setDesignation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const mail = email.trim();
    if (!employeeId.trim() || !name.trim() || !mail || password.length < 8) {
      setError("Fill all fields. Password must be at least 8 characters.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
      setError("Enter a valid work email address.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const session = await repositories.auth.signUp({
        employeeId: employeeId.trim(),
        name: name.trim(),
        email: email.trim(),
        password,
        appRole,
        subsidiary,
        designation: designation.trim() || undefined,
      });
      router.push(ROLE_LANDING_ROUTE[session.user.appRole] ?? "/brain");
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Sign up failed. Try a different employee ID.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-7 space-y-4" noValidate>
      {error ? (
        <p role="alert" className="flex items-start gap-2 rounded-lg bg-danger/10 px-3 py-2.5 text-[12.5px] text-danger">
          <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      ) : null}

      <div>
        <Label htmlFor="signup-employeeId">Employee ID</Label>
        <TextInput
          id="signup-employeeId"
          placeholder="e.g. BHUMI/2026/1042"
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="signup-name">Full name</Label>
        <TextInput id="signup-name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div>
        <Label htmlFor="signup-email">Work email</Label>
        <TextInput
          id="signup-email"
          type="email"
          placeholder="name@subsidiary.gov.in"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="signup-password">Password</Label>
        <TextInput
          id="signup-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="signup-role">Role</Label>
        <select
          id="signup-role"
          value={appRole}
          onChange={(e) => setAppRole(e.target.value as AppRole)}
          className="h-10 w-full rounded-md border border-hairline bg-surface-card px-3 text-[13.5px] text-ink-0"
        >
          {APP_ROLES.map((r) => (
            <option key={r.id} value={r.id}>{r.label}</option>
          ))}
        </select>
      </div>

      <div>
        <Label htmlFor="signup-subsidiary">Subsidiary</Label>
        <select
          id="signup-subsidiary"
          value={subsidiary}
          onChange={(e) => setSubsidiary(e.target.value)}
          className="h-10 w-full rounded-md border border-hairline bg-surface-card px-3 text-[13.5px] text-ink-0"
        >
          {SUBSIDIARIES.map((code) => (
            <option key={code} value={code}>{code}</option>
          ))}
        </select>
      </div>

      <div>
        <Label htmlFor="signup-designation">Designation (optional)</Label>
        <TextInput
          id="signup-designation"
          placeholder="e.g. Senior Mining Analyst"
          value={designation}
          onChange={(e) => setDesignation(e.target.value)}
        />
      </div>

      <Button type="submit" disabled={submitting} className="mt-1 h-11 w-full text-[14px] shadow-sm">
        {submitting ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Connecting to server… (may take up to 2 min on free hosting)
          </>
        ) : (
          "Create account"
        )}
      </Button>

      <p className="text-center text-[12.5px] text-muted">
        Already registered?{" "}
        <Link href="/login" className="font-semibold text-primary-600 hover:underline">Sign in</Link>
      </p>
    </form>
  );
}
