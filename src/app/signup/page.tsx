import { AuthForm } from "@/components/auth/auth-form";
import { signUpAction } from "@/lib/actions/auth";
import { isSupabaseConfigured } from "@/lib/env";

export default function SignupPage() {
  return (
    <div className="workspace-bg flex min-h-screen items-center justify-center px-4 py-10">
      <AuthForm
        mode="signup"
        action={signUpAction}
        setupNeeded={!isSupabaseConfigured()}
      />
    </div>
  );
}
