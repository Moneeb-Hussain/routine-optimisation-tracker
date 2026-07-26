import { NextResponse } from "next/server";
import {
  isCronSecretConfigured,
  isResendConfigured,
  isServiceRoleConfigured,
  verifyCronSecret,
} from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendReminderEmail } from "@/lib/email/resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function inQuietHours(
  now: Date,
  timeZone: string,
  start: string | null,
  end: string | null,
): boolean {
  if (!start || !end) return false;
  const local = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);
  const [h, m] = local.split(":").map(Number);
  const mins = (h || 0) * 60 + (m || 0);
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const startMins = (sh || 0) * 60 + (sm || 0);
  const endMins = (eh || 0) * 60 + (em || 0);
  if (startMins === endMins) return false;
  if (startMins < endMins) return mins >= startMins && mins < endMins;
  // wraps midnight
  return mins >= startMins || mins < endMins;
}

/**
 * POST /api/cron/reminders
 * Authorization: Bearer $CRON_SECRET
 *
 * Sends due email reminders (channel email|both) via Resend.
 * Schedule with Vercel Cron or any external cron hitting this URL every 15m.
 */
export async function POST(request: Request) {
  if (!isCronSecretConfigured() || !verifyCronSecret(request.headers.get("authorization"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isServiceRoleConfigured()) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY is required for cron." },
      { status: 500 },
    );
  }

  if (!isResendConfigured()) {
    return NextResponse.json(
      { error: "RESEND_API_KEY and RESEND_FROM_EMAIL required." },
      { status: 500 },
    );
  }

  const admin = createAdminClient();
  const now = new Date();
  const nowIso = now.toISOString();

  const { data: due, error } = await admin
    .from("reminders")
    .select(
      "id, user_id, title, body, due_at, channel, status, last_notified_at",
    )
    .in("status", ["pending", "snoozed"])
    .in("channel", ["email", "both"])
    .lte("due_at", nowIso)
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const reminder of due || []) {
    // Avoid re-sending within 12h
    if (reminder.last_notified_at) {
      const last = new Date(reminder.last_notified_at).getTime();
      if (now.getTime() - last < 12 * 60 * 60 * 1000) {
        skipped += 1;
        continue;
      }
    }

    const [{ data: prefs }, { data: profile }, { data: authUser }] =
      await Promise.all([
        admin
          .from("notification_preferences")
          .select(
            "email_enabled, quiet_hours_start, quiet_hours_end, max_emails_per_day",
          )
          .eq("user_id", reminder.user_id)
          .maybeSingle(),
        admin
          .from("profiles")
          .select("timezone, full_name")
          .eq("id", reminder.user_id)
          .maybeSingle(),
        admin.auth.admin.getUserById(reminder.user_id),
      ]);

    const email = authUser.user?.email;
    if (!email || prefs?.email_enabled === false) {
      skipped += 1;
      await admin.from("reminder_email_logs").insert({
        user_id: reminder.user_id,
        reminder_id: reminder.id,
        to_email: email || "",
        subject: reminder.title,
        status: "skipped",
        error_message: !email ? "No email on account" : "Email disabled in prefs",
      });
      continue;
    }

    const timezone = profile?.timezone || "Asia/Karachi";
    if (
      inQuietHours(
        now,
        timezone,
        prefs?.quiet_hours_start || null,
        prefs?.quiet_hours_end || null,
      )
    ) {
      skipped += 1;
      continue;
    }

    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);
    const { count } = await admin
      .from("reminder_email_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", reminder.user_id)
      .eq("status", "sent")
      .gte("created_at", dayStart.toISOString());

    const maxPerDay = prefs?.max_emails_per_day ?? 5;
    if ((count || 0) >= maxPerDay) {
      skipped += 1;
      await admin.from("reminder_email_logs").insert({
        user_id: reminder.user_id,
        reminder_id: reminder.id,
        to_email: email,
        subject: reminder.title,
        status: "skipped",
        error_message: "max_emails_per_day reached",
      });
      continue;
    }

    const result = await sendReminderEmail({
      to: email,
      subject: `[Mission USA AI] ${reminder.title}`,
      title: reminder.title,
      body: reminder.body || "",
      dueAt: new Date(reminder.due_at).toLocaleString("en-US", {
        timeZone: timezone,
      }),
    });

    if (!result.ok) {
      failed += 1;
      await admin.from("reminder_email_logs").insert({
        user_id: reminder.user_id,
        reminder_id: reminder.id,
        to_email: email,
        subject: reminder.title,
        status: "failed",
        error_message: result.error,
      });
      continue;
    }

    sent += 1;
    await admin
      .from("reminders")
      .update({ last_notified_at: nowIso, status: "pending" })
      .eq("id", reminder.id);

    await admin.from("reminder_email_logs").insert({
      user_id: reminder.user_id,
      reminder_id: reminder.id,
      to_email: email,
      subject: reminder.title,
      status: "sent",
    });
  }

  return NextResponse.json({
    ok: true,
    checked: due?.length || 0,
    sent,
    skipped,
    failed,
  });
}

export async function GET(request: Request) {
  // Allow GET for simple cron providers that only support GET
  return POST(request);
}
