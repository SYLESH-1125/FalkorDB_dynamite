"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Eye, EyeOff, AlertCircle } from "lucide-react";
import { repositories } from "@/src/application/services/container";
import { Button } from "../ui/button";
import { Label, TextInput } from "../ui/field";

export function LoginForm() {
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!employeeId.trim() || !password) {
      setError("Enter both your employee ID and password.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await repositories.auth.signIn({ employeeId: employeeId.trim(), password });
      router.push("/dashboard");
    } catch {
      setError("Sign-in failed. Check your credentials and try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-7 space-y-4" noValidate>
      {error ? (
        <p role="alert" className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-xs text-red-700">
          <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      ) : null}

      <div>
        <Label htmlFor="employeeId">Employee ID</Label>
        <TextInput
          id="employeeId"
          name="employeeId"
          autoComplete="username"
          placeholder="e.g. CMPDI/2019/4471"
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
            autoComplete="current-password"
            placeholder="Enter your password"
            className="pr-10"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1.5 text-ink-300 hover:text-ink-600"
          >
            {showPassword ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-xs text-ink-500">
          <input type="checkbox" className="size-3.5 rounded border-sand-500 accent-clay-500" />
          Keep me signed in
        </label>
        <a href="#" className="text-xs font-medium text-clay-600 hover:underline">
          Forgot password?
        </a>
      </div>

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Signing in…
          </>
        ) : (
          "Sign in"
        )}
      </Button>

      <div className="flex items-center gap-3 pt-1">
        <span className="h-px flex-1 bg-sand-300" aria-hidden />
        <span className="text-[10px] tracking-wider text-sand-500 uppercase">or</span>
        <span className="h-px flex-1 bg-sand-300" aria-hidden />
      </div>

      <Button
        type="button"
        variant="secondary"
        className="w-full"
        onClick={() => router.push("/dashboard")}
      >
        Continue with NIC Single Sign-On
      </Button>

      <p className="pt-2 text-center text-[11px] text-ink-300">
        Demo build — any credentials will sign you in.
      </p>
    </form>
  );
}
