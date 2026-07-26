"use client";

import { useActionState, useTransition } from "react";
import {
  createReminderAction,
  completeReminderAction,
  dismissReminderAction,
  snoozeReminderAction,
  updateNotificationPrefsAction,
  type ActionState,
} from "@/lib/actions/reminders";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export type ReminderRow = {
  id: string;
  title: string;
  body: string;
  reminder_type: string;
  due_at: string;
  status: string;
  channel: string;
};

export type NotifPrefs = {
  email_enabled: boolean;
  in_app_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  max_emails_per_day: number;
} | null;

export function RemindersClient({
  reminders,
  prefs,
}: {
  reminders: ReminderRow[];
  prefs: NotifPrefs;
}) {
  const [createState, createAction, createPending] = useActionState(
    createReminderAction,
    {} as ActionState,
  );
  const [prefState, prefAction, prefPending] = useActionState(
    updateNotificationPrefsAction,
    {} as ActionState,
  );

  const pending = reminders.filter(
    (r) => r.status === "pending" || r.status === "snoozed",
  );
  const done = reminders.filter((r) => r.status === "done" || r.status === "dismissed");

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <div className="space-y-4 lg:col-span-4">
        <form action={createAction} className="panel-surface space-y-3 p-5">
          <h2 className="text-sm font-semibold">New reminder</h2>
          <input
            name="title"
            required
            placeholder="Title"
            className="h-11 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none ring-brand focus:ring-2"
          />
          <textarea
            name="body"
            rows={2}
            placeholder="Notes"
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none ring-brand focus:ring-2"
          />
          <select
            name="reminder_type"
            defaultValue="general"
            className="h-11 w-full rounded-lg border border-border bg-card px-3 text-sm"
          >
            <option value="general">General</option>
            <option value="follow_up">Professor follow-up</option>
            <option value="deadline">Deadline</option>
            <option value="interview">Interview</option>
            <option value="deep_work">Deep work</option>
            <option value="sleep">Sleep</option>
            <option value="application">Application</option>
          </select>
          <input
            name="due_at"
            type="datetime-local"
            required
            className="h-11 w-full rounded-lg border border-border bg-card px-3 text-sm"
          />
          <select
            name="channel"
            defaultValue="in_app"
            className="h-11 w-full rounded-lg border border-border bg-card px-3 text-sm"
          >
            <option value="in_app">In-app</option>
            <option value="email">Email (prefs)</option>
            <option value="both">Both</option>
          </select>
          {createState.error && (
            <p className="text-sm text-danger">{createState.error}</p>
          )}
          {createState.success && (
            <p className="text-sm text-success">{createState.success}</p>
          )}
          <Button type="submit" disabled={createPending} className="w-full">
            {createPending ? "Saving…" : "Create reminder"}
          </Button>
        </form>

        <form action={prefAction} className="panel-surface space-y-3 p-5">
          <h2 className="text-sm font-semibold">Notification prefs</h2>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="in_app_enabled"
              defaultChecked={prefs?.in_app_enabled ?? true}
            />
            In-app reminders
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="email_enabled"
              defaultChecked={prefs?.email_enabled ?? false}
            />
            Email (requires Resend later)
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              name="quiet_hours_start"
              defaultValue={prefs?.quiet_hours_start || "22:00"}
              placeholder="Quiet start"
              className="h-10 rounded-lg border border-border bg-card px-3 text-sm"
            />
            <input
              name="quiet_hours_end"
              defaultValue={prefs?.quiet_hours_end || "07:00"}
              placeholder="Quiet end"
              className="h-10 rounded-lg border border-border bg-card px-3 text-sm"
            />
          </div>
          <input
            name="max_emails_per_day"
            type="number"
            defaultValue={prefs?.max_emails_per_day ?? 5}
            className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
          />
          {prefState.error && <p className="text-sm text-danger">{prefState.error}</p>}
          {prefState.success && (
            <p className="text-sm text-success">{prefState.success}</p>
          )}
          <Button type="submit" disabled={prefPending} variant="secondary" className="w-full">
            Save prefs
          </Button>
        </form>
      </div>

      <div className="space-y-4 lg:col-span-8">
        <div className="panel-surface p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Upcoming</h2>
            <Badge tone="brand">{pending.length}</Badge>
          </div>
          {pending.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending reminders.</p>
          ) : (
            <ul className="space-y-2">
              {pending.map((r) => (
                <ReminderRowItem key={r.id} reminder={r} />
              ))}
            </ul>
          )}
        </div>
        {done.length > 0 && (
          <div className="panel-surface p-5">
            <h2 className="mb-3 text-sm font-semibold">Closed</h2>
            <ul className="space-y-2">
              {done.slice(0, 8).map((r) => (
                <li
                  key={r.id}
                  className="rounded-lg border border-border bg-slate-50/70 px-3 py-2 text-sm text-muted-foreground"
                >
                  {r.title} · {r.status}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function ReminderRowItem({ reminder }: { reminder: ReminderRow }) {
  const [pending, start] = useTransition();
  const due = new Date(reminder.due_at).toLocaleString();

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-slate-50/70 px-3 py-2.5">
      <div>
        <p className="text-sm font-medium">{reminder.title}</p>
        <p className="text-xs text-muted-foreground">
          {reminder.reminder_type} · {due} · {reminder.status}
        </p>
        {reminder.body && (
          <p className="mt-1 text-xs text-muted-foreground">{reminder.body}</p>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Button
          type="button"
          size="sm"
          disabled={pending}
          onClick={() => start(() => completeReminderAction(reminder.id))}
        >
          Done
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={pending}
          onClick={() => start(() => snoozeReminderAction(reminder.id, 4))}
        >
          Snooze 4h
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={pending}
          onClick={() => start(() => dismissReminderAction(reminder.id))}
        >
          Dismiss
        </Button>
      </div>
    </li>
  );
}
