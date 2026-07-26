"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { AuthActionState } from "@/lib/actions/auth";

type Mode = "login" | "signup" | "magic" | "reset";

export function AuthForm({
  mode,
  action,
  nextPath = "/dashboard",
  setupNeeded = false,
}: {
  mode: Mode;
  action: (prev: AuthActionState, formData: FormData) => Promise<AuthActionState>;
  nextPath?: string;
  setupNeeded?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="panel-surface p-6 md:p-8">
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand">
            Mission USA AI
          </p>
          <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight">
            {mode === "login" && "Welcome back"}
            {mode === "signup" && "Create your account"}
            {mode === "magic" && "Magic link sign-in"}
            {mode === "reset" && "Reset password"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Private admissions operating system — your data stays yours.
          </p>
        </div>

        {setupNeeded && (
          <div className="mb-4 rounded-xl border border-warning/30 bg-warning-soft px-3 py-2 text-sm text-warning">
            Add Supabase keys to <code className="font-mono text-xs">.env.local</code> before
            signing in. UI preview still works on /dashboard.
          </div>
        )}

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="next" value={nextPath} />

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-muted-foreground">Email</span>
            <input
              name="email"
              type="email"
              required
              className="h-11 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none ring-brand focus:ring-2"
              placeholder="you@email.com"
            />
          </label>

          {mode === "signup" && (
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-muted-foreground">Full name</span>
              <input
                name="full_name"
                type="text"
                defaultValue="Moneeb Hussain"
                className="h-11 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none ring-brand focus:ring-2"
              />
            </label>
          )}

          {(mode === "login" || mode === "signup") && (
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-muted-foreground">Password</span>
              <input
                name="password"
                type="password"
                required
                minLength={8}
                className="h-11 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none ring-brand focus:ring-2"
                placeholder="At least 8 characters"
              />
            </label>
          )}

          {state.error && (
            <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
              {state.error}
            </p>
          )}
          {state.success && (
            <p className="rounded-lg bg-success-soft px-3 py-2 text-sm text-success">
              {state.success}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={pending || setupNeeded}>
            {pending
              ? "Please wait…"
              : mode === "signup"
                ? "Create account"
                : mode === "reset"
                  ? "Send reset link"
                  : mode === "magic"
                    ? "Send magic link"
                    : "Sign in"}
          </Button>
        </form>

        <div className="mt-5 space-y-2 text-center text-sm text-muted-foreground">
          {mode === "login" && (
            <>
              <p>
                <Link href="/login?mode=magic" className="text-brand hover:underline">
                  Use magic link
                </Link>
                {" · "}
                <Link href="/login?mode=reset" className="text-brand hover:underline">
                  Forgot password
                </Link>
              </p>
              <p>
                New here?{" "}
                <Link href="/signup" className="font-semibold text-brand hover:underline">
                  Create an account
                </Link>
              </p>
            </>
          )}
          {mode !== "login" && (
            <p>
              <Link href="/login" className="font-semibold text-brand hover:underline">
                Back to sign in
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
