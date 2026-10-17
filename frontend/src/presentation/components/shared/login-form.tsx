"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Eye, EyeOff, AlertCircle } from "lucide-react";
import { repositories } from "@/src/application/services/container";
import { ROLE_LANDING_ROUTE } from "@/src/application/services/role-catalog";
import type { AppRole } from "@/src/domain/entities/user";
import { Button } from "../ui/button";
import { Label, TextInput } from "../ui/field";

export function LoginForm({
  appRole,
  nextPath,
}: {
  appRole?: AppRole;
  nextPath?: string | null;
}) {
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!appRole) {
      setError("Choose your role above before logging in.");
      return;
    }
    if (!employeeId.trim() || !password) {
      setError("Enter both your employee ID and password.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const session = await repositories.auth.signIn({ employeeId: employeeId.trim(), password, appRole });
      const safeNext = nextPath?.startsWith("/") && !nextPath.startsWith("//") ? nextPath : null;
      router.push(safeNext ?? ROLE_LANDING_ROUTE[session.user.appRole] ?? "/dashboard");
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Login failed. Check your credentials and try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-7 space-y-4" noValidate autoComplete="off">
      {error ? (
        <p role="alert" className="flex items-start gap-2 rounded-lg bg-danger/10 px-3 py-2.5 text-[12.5px] text-danger">
          <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      ) : null}

      <div>
        <Label htmlFor="employeeId">Employee ID</Label>
        <TextInput
          id="employeeId"
          name="employeeId"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          placeholder="e.g. BHUMI/2019/4471"
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <TextInput
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Enter your password"
            className="pr-10"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1.5 text-muted transition-colors hover:text-ink-0"
          >
            {showPassword ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <label className="flex items-center gap-2 text-[12.5px] text-body">
          <input type="checkbox" className="size-3.5 rounded border-hairline-strong accent-primary-500" />
          Keep me signed in
        </label>
        <a href="#" className="text-[12.5px] font-medium text-primary-600 hover:underline">
          Forgot password?
        </a>
      </div>

      <Button type="submit" disabled={submitting} className="mt-1 h-11 w-full text-[14px] shadow-sm">
        {submitting ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Logging in…
          </>
        ) : (
          "Log in"
        )}
      </Button>

      <p className="flex items-center justify-center gap-1.5 pt-1 text-center text-[11.5px] text-muted">
        <span className="size-1 rounded-full bg-hairline-strong" aria-hidden />
        No self-registration — all accounts are provisioned by an Administrator.
      </p>
    </form>
  );
}
