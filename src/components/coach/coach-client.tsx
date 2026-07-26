"use client";

import { useActionState } from "react";
import {
  askCoachAction,
  type ActionState,
} from "@/lib/actions/coach";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { CoachContext } from "@/lib/data/coach-context";

type Message = {
  id: string;
  role: string;
  content: string;
  created_at: string;
};

export function CoachClient({
  context,
  messages,
}: {
  context: CoachContext;
  messages: Message[];
}) {
  const [state, formAction, pending] = useActionState(
    askCoachAction,
    {} as ActionState,
  );

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <aside className="space-y-4 lg:col-span-4">
        <div className="panel-surface p-5">
          <h2 className="text-sm font-semibold">Live context</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Coach answers use your saved goals, tasks, sleep, follow-ups, and prep — not invented data.
          </p>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-xs font-semibold text-muted-foreground">Primary goal</dt>
              <dd className="mt-0.5">{context.primaryGoal || "Not set — open Today"}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-muted-foreground">Must-dos today</dt>
              <dd className="mt-0.5">
                {context.mustDos.length === 0
                  ? "None scheduled"
                  : context.mustDos.map((t) => t.title).join(" · ")}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-muted-foreground">Sleep</dt>
              <dd className="mt-0.5">
                {context.sleep.hours == null
                  ? "Not logged"
                  : `${context.sleep.hours}h / target ${context.sleep.target}h`}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-muted-foreground">Next follow-up</dt>
              <dd className="mt-0.5">
                {context.followUps[0]
                  ? `${context.followUps[0].professor} · ${context.followUps[0].due_on}`
                  : "None pending"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-muted-foreground">Interview next</dt>
              <dd className="mt-0.5">{context.interviewNext || "Create a prep track"}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-muted-foreground">Docs retrieval</dt>
              <dd className="mt-0.5">
                <Badge tone="neutral">{context.retrievalMode}</Badge>
                {context.documentSnippets.length > 0
                  ? ` · ${context.documentSnippets.length} snippet(s)`
                  : " · no doc hits"}
              </dd>
            </div>
          </dl>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {Object.entries(context.pipelineCounts).map(([stage, count]) => (
              <Badge key={stage} tone="neutral">
                {stage}: {count}
              </Badge>
            ))}
          </div>
        </div>

        <div className="panel-surface p-5">
          <h3 className="text-sm font-semibold">Try asking</h3>
          <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
            <li>What should I do in the next 90 minutes?</li>
            <li>My sleep was short — how should I cut today?</li>
            <li>Which professor follow-up matters most?</li>
            <li>Give me one interview drill for today.</li>
          </ul>
        </div>
      </aside>

      <div className="lg:col-span-8">
        <div className="panel-surface flex min-h-[420px] flex-col p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Coach thread</h2>
            <Badge tone="brand">Context-backed</Badge>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto pr-1">
            {messages.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Ask anything about today’s plan. Without OpenAI, you still get a rule-based answer from your data.
              </p>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={
                  m.role === "user"
                    ? "ml-8 rounded-lg border border-border bg-slate-50/80 px-3 py-2 text-sm"
                    : "mr-4 rounded-lg border border-brand/20 bg-cyan-50/50 px-3 py-2 text-sm whitespace-pre-wrap"
                }
              >
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {m.role === "user" ? "You" : "Coach"}
                </p>
                {m.content}
              </div>
            ))}
            {state.reply && (
              <div className="mr-4 rounded-lg border border-brand/20 bg-cyan-50/50 px-3 py-2 text-sm whitespace-pre-wrap">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Latest
                </p>
                {state.reply}
              </div>
            )}
          </div>

          <form action={formAction} className="mt-4 space-y-2 border-t border-border pt-4">
            <textarea
              name="question"
              required
              rows={3}
              placeholder="What should I do next?"
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none ring-brand focus:ring-2"
            />
            {state.error && <p className="text-sm text-danger">{state.error}</p>}
            {state.success && !state.reply && (
              <p className="text-sm text-success">{state.success}</p>
            )}
            <Button type="submit" disabled={pending} className="w-full sm:w-auto">
              {pending ? "Thinking…" : "Ask coach"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
