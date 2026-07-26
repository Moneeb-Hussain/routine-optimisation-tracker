"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { defaultProfileFields, DEFAULT_GOAL_TREE } from "@/lib/profile-defaults";
import { profileSchema } from "@/lib/types";

export type AuthActionState = {
  error?: string;
  success?: string;
};

function requireConfigured(): AuthActionState | null {
  if (!isSupabaseConfigured()) {
    return {
      error:
        "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.",
    };
  }
  return null;
}

export async function signUpAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const blocked = requireConfigured();
  if (blocked) return blocked;

  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const fullName = String(formData.get("full_name") || defaultProfileFields.full_name).trim();

  if (!email || password.length < 8) {
    return { error: "Use a valid email and a password of at least 8 characters." };
  }

  const supabase = await createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${appUrl}/auth/callback`,
    },
  });

  if (error) return { error: error.message };

  return {
    success:
      "Account created. Check your email to confirm if required, then complete onboarding.",
  };
}

export async function signInAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const blocked = requireConfigured();
  if (blocked) return blocked;

  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "/dashboard");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.onboarding_completed) {
      redirect("/onboarding");
    }
  }

  redirect(next.startsWith("/") ? next : "/dashboard");
}

export async function signInWithMagicLinkAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const blocked = requireConfigured();
  if (blocked) return blocked;

  const email = String(formData.get("email") || "").trim();
  if (!email) return { error: "Email is required." };

  const supabase = await createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${appUrl}/auth/callback` },
  });

  if (error) return { error: error.message };
  return { success: "Magic link sent. Check your inbox." };
}

export async function resetPasswordAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const blocked = requireConfigured();
  if (blocked) return blocked;

  const email = String(formData.get("email") || "").trim();
  if (!email) return { error: "Email is required." };

  const supabase = await createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appUrl}/auth/callback?next=/settings/profile`,
  });

  if (error) return { error: error.message };
  return { success: "Password reset email sent if that account exists." };
}

export async function signOutAction() {
  if (!isSupabaseConfigured()) redirect("/login");
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function completeOnboardingAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const blocked = requireConfigured();
  if (blocked) return blocked;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const researchRaw = String(formData.get("research_interests") || "");
  const achievementsRaw = String(formData.get("achievements") || "");
  const projectBulletsRaw = String(formData.get("project_bullets") || "");

  const parsed = profileSchema.safeParse({
    full_name: formData.get("full_name"),
    degree: formData.get("degree"),
    university: formData.get("university"),
    cgpa: formData.get("cgpa") || null,
    ielts_academic: formData.get("ielts_academic") || null,
    target_primary: formData.get("target_primary"),
    target_secondary: formData.get("target_secondary"),
    target_intake: formData.get("target_intake"),
    timezone: formData.get("timezone"),
    research_interests: researchRaw
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean),
    strongest_project: {
      name: String(formData.get("project_name") || ""),
      bullets: projectBulletsRaw
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
    },
    achievements: achievementsRaw
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean),
    onboarding_completed: true,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid profile data." };
  }

  const { error } = await supabase
    .from("profiles")
    .upsert({
      id: user.id,
      ...parsed.data,
      onboarding_completed: true,
    });

  if (error) return { error: error.message };

  // Seed goal tree once if user has no goals yet
  const { count } = await supabase
    .from("goals")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (!count || count === 0) {
    const root = DEFAULT_GOAL_TREE[0];
    const { data: parent, error: parentError } = await supabase
      .from("goals")
      .insert({
        user_id: user.id,
        title: root.title,
        horizon: root.horizon,
        category: "admissions",
        sort_order: 0,
      })
      .select("id")
      .single();

    if (!parentError && parent) {
      await supabase.from("goals").insert(
        root.children.map((title, index) => ({
          user_id: user.id,
          parent_id: parent.id,
          title,
          horizon: "quarterly" as const,
          category: "admissions",
          sort_order: index + 1,
        })),
      );
    }
  }

  redirect("/dashboard");
}
