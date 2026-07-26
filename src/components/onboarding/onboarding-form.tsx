"use client";

import { useActionState } from "react";
import { completeOnboardingAction } from "@/lib/actions/auth";
import { defaultProfileFields } from "@/lib/profile-defaults";
import { Button } from "@/components/ui/button";

export function OnboardingForm() {
  const [state, formAction, pending] = useActionState(completeOnboardingAction, {});
  const d = defaultProfileFields;

  return (
    <form action={formAction} className="mx-auto max-w-3xl space-y-6">
      <div className="panel-surface p-6 md:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand">
          Onboarding
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">
          Confirm your academic profile
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Prefills are editable. This becomes structured profile data for AI — not hardcoded
          prompt text.
        </p>
      </div>

      <div className="panel-surface grid gap-4 p-6 md:grid-cols-2">
        {(
          [
            ["full_name", "Full name", d.full_name],
            ["degree", "Degree", d.degree],
            ["university", "University", d.university],
            ["cgpa", "CGPA", String(d.cgpa)],
            ["ielts_academic", "IELTS Academic", String(d.ielts_academic)],
            ["target_intake", "Target intake", d.target_intake],
            ["timezone", "Timezone", d.timezone],
          ] as const
        ).map(([name, label, value]) => (
          <label key={name} className="space-y-1.5">
            <span className="text-xs font-semibold text-muted-foreground">{label}</span>
            <input
              name={name}
              defaultValue={value}
              className="h-11 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none ring-brand focus:ring-2"
            />
          </label>
        ))}
        <label className="space-y-1.5 md:col-span-2">
          <span className="text-xs font-semibold text-muted-foreground">Primary target</span>
          <input
            name="target_primary"
            defaultValue={d.target_primary}
            className="h-11 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none ring-brand focus:ring-2"
          />
        </label>
        <label className="space-y-1.5 md:col-span-2">
          <span className="text-xs font-semibold text-muted-foreground">Secondary target</span>
          <input
            name="target_secondary"
            defaultValue={d.target_secondary}
            className="h-11 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none ring-brand focus:ring-2"
          />
        </label>
      </div>

      <div className="panel-surface grid gap-4 p-6">
        <label className="space-y-1.5">
          <span className="text-xs font-semibold text-muted-foreground">
            Research interests (one per line)
          </span>
          <textarea
            name="research_interests"
            rows={8}
            defaultValue={d.research_interests.join("\n")}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none ring-brand focus:ring-2"
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-semibold text-muted-foreground">Strongest project name</span>
          <input
            name="project_name"
            defaultValue={d.strongest_project.name}
            className="h-11 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none ring-brand focus:ring-2"
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-semibold text-muted-foreground">
            Project bullets (one per line)
          </span>
          <textarea
            name="project_bullets"
            rows={8}
            defaultValue={d.strongest_project.bullets.join("\n")}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none ring-brand focus:ring-2"
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-semibold text-muted-foreground">
            Achievements (one per line)
          </span>
          <textarea
            name="achievements"
            rows={6}
            defaultValue={d.achievements.join("\n")}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none ring-brand focus:ring-2"
          />
        </label>
      </div>

      {state.error && (
        <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>
      )}

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Saving…" : "Save profile & continue"}
      </Button>
    </form>
  );
}
