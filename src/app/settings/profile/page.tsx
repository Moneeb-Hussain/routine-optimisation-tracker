import { AppShell } from "@/components/layout/app-shell";
import { getCurrentProfile } from "@/lib/data/command-center";
import { isSupabaseConfigured } from "@/lib/env";
import { signOutAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default async function SettingsProfilePage() {
  const configured = isSupabaseConfigured();
  const profile = configured ? await getCurrentProfile() : null;

  return (
    <AppShell title="Settings" subtitle="Profile and account">
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="panel-surface space-y-3 p-5 lg:col-span-7">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold">Profile</h2>
            {!configured && <Badge tone="watch">Setup required</Badge>}
          </div>
          {!profile ? (
            <p className="text-sm text-muted-foreground">
              {configured ? (
                <>
                  <Link href="/login" className="font-semibold text-brand">
                    Sign in
                  </Link>{" "}
                  or complete{" "}
                  <Link href="/onboarding" className="font-semibold text-brand">
                    onboarding
                  </Link>
                  .
                </>
              ) : (
                "Configure Supabase to load your profile."
              )}
            </p>
          ) : (
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Name</dt>
                <dd className="font-medium">{profile.full_name}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Degree</dt>
                <dd className="text-right font-medium">{profile.degree}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">University</dt>
                <dd className="font-medium">{profile.university}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Target intake</dt>
                <dd className="font-medium">{profile.target_intake}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Timezone</dt>
                <dd className="font-medium">{profile.timezone}</dd>
              </div>
              <div className="pt-2">
                <Link href="/onboarding" className="text-sm font-semibold text-brand">
                  Edit via onboarding form
                </Link>
              </div>
            </dl>
          )}
        </div>

        <div className="panel-surface space-y-3 p-5 lg:col-span-5">
          <h2 className="text-sm font-semibold">Account</h2>
          <p className="text-sm text-muted-foreground">
            Sign out clears the session cookies on this device.
          </p>
          <form action={signOutAction}>
            <Button type="submit" variant="secondary" disabled={!configured}>
              Sign out
            </Button>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
