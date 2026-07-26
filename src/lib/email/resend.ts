import { Resend } from "resend";
import {
  getResendFromEmail,
  isResendConfigured,
} from "@/lib/env";

export async function sendReminderEmail(params: {
  to: string;
  subject: string;
  title: string;
  body: string;
  dueAt: string;
}): Promise<{ ok: true; id?: string } | { ok: false; error: string }> {
  if (!isResendConfigured()) {
    return { ok: false, error: "Resend is not configured." };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = getResendFromEmail();

  const { data, error } = await resend.emails.send({
    from,
    to: params.to,
    subject: params.subject,
    text: [
      params.title,
      "",
      params.body || "You have a reminder in Mission USA AI.",
      "",
      `Due: ${params.dueAt}`,
      "",
      "Open the app → /reminders",
    ].join("\n"),
    html: `
      <div style="font-family: system-ui, sans-serif; line-height: 1.5; color: #0f172a;">
        <h2 style="margin:0 0 8px;">${escapeHtml(params.title)}</h2>
        <p>${escapeHtml(params.body || "You have a reminder in Mission USA AI.")}</p>
        <p style="color:#64748b;font-size:14px;">Due: ${escapeHtml(params.dueAt)}</p>
        <p style="font-size:14px;">Open Mission USA AI → Reminders</p>
      </div>
    `,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true, id: data?.id };
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
