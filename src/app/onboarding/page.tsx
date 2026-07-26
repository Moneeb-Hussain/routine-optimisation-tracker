import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { isSupabaseConfigured } from "@/lib/env";
import Link from "next/link";

export default function OnboardingPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="workspace-bg flex min-h-screen items-center justify-center px-4">
        <div className="panel-surface max-w-lg p-8 text-center">
          <h1 className="font-display text-2xl font-semibold">Configure Supabase first</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Onboarding needs Auth + Postgres. Add keys to .env.local and run the Phase 1
            migration.
          </p>
          <Link href="/dashboard" className="mt-4 inline-block text-sm font-semibold text-brand">
            Back to UI preview
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="workspace-bg min-h-screen px-4 py-10">
      <OnboardingForm />
    </div>
  );
}
