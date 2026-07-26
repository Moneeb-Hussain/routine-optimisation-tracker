import { AuthForm } from "@/components/auth/auth-form";
import {
  resetPasswordAction,
  signInAction,
  signInWithMagicLinkAction,
} from "@/lib/actions/auth";
import { isSupabaseConfigured } from "@/lib/env";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; next?: string }>;
}) {
  const params = await searchParams;
  const mode = params.mode === "magic" || params.mode === "reset" ? params.mode : "login";
  const action =
    mode === "magic"
      ? signInWithMagicLinkAction
      : mode === "reset"
        ? resetPasswordAction
        : signInAction;

  return (
    <div className="workspace-bg flex min-h-screen items-center justify-center px-4 py-10">
      <AuthForm
        mode={mode}
        action={action}
        nextPath={params.next || "/dashboard"}
        setupNeeded={!isSupabaseConfigured()}
      />
    </div>
  );
}
