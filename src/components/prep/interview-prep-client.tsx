"use client";

import { useActionState, useTransition } from "react";
import Link from "next/link";
import {
  createPrepTrackAction,
  addPrepItemAction,
  togglePrepItemDoneAction,
  addQuestionAction,
  saveQuestionAttemptAction,
  type ActionState,
} from "@/lib/actions/prep";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export type PrepTrack = {
  id: string;
  title: string;
  track_type: string;
  description: string;
  status: string;
  completion_percent: number;
};

export type PrepItem = {
  id: string;
  track_id: string;
  title: string;
  status: string;
  estimated_minutes: number | null;
  day_number: number | null;
};

export type QuestionRow = {
  id: string;
  question: string;
  category: string;
  difficulty: string;
  expected_answer?: string;
};

export function InterviewPrepClient({
  tracks,
  items,
  questions,
}: {
  tracks: PrepTrack[];
  items: PrepItem[];
  questions: QuestionRow[];
}) {
  const [trackState, trackAction, trackPending] = useActionState(
    createPrepTrackAction,
    {} as ActionState,
  );
  const [itemState, itemAction, itemPending] = useActionState(
    addPrepItemAction,
    {} as ActionState,
  );
  const [qState, qAction, qPending] = useActionState(
    addQuestionAction,
    {} as ActionState,
  );
  const [attemptState, attemptAction, attemptPending] = useActionState(
    saveQuestionAttemptAction,
    {} as ActionState,
  );

  const activeTrack = tracks[0];
  const activeItems = items.filter((i) => i.track_id === activeTrack?.id);
  const practiceQuestion = questions[0];

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <form action={trackAction} className="panel-surface space-y-3 p-5 lg:col-span-4">
        <h2 className="text-sm font-semibold">New prep track</h2>
        <p className="text-xs text-muted-foreground">
          Creates a track with 5 starter drills ready for morning practice.
        </p>
        <input
          name="title"
          required
          placeholder="e.g. Graduate admissions interview"
          className="h-11 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none ring-brand focus:ring-2"
        />
        <select
          name="track_type"
          defaultValue="graduate_admissions"
          className="h-11 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none ring-brand focus:ring-2"
        >
          <option value="graduate_admissions">Graduate admissions</option>
          <option value="professor_meeting">Professor meeting</option>
          <option value="behavioral">Behavioral</option>
          <option value="ai_ml">AI / ML</option>
          <option value="computer_vision">Computer vision</option>
          <option value="robotics">Robotics</option>
          <option value="visa">Visa</option>
        </select>
        <textarea
          name="description"
          rows={2}
          placeholder="Focus for this track"
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none ring-brand focus:ring-2"
        />
        {trackState.error && <p className="text-sm text-danger">{trackState.error}</p>}
        {trackState.success && (
          <p className="text-sm text-success">{trackState.success}</p>
        )}
        <Button type="submit" disabled={trackPending} className="w-full">
          {trackPending ? "Creating…" : "Create track"}
        </Button>
      </form>

      <div className="space-y-4 lg:col-span-8">
        <div className="panel-surface p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">Your tracks</h2>
            <Badge tone="brand">{tracks.length} active</Badge>
          </div>
          {tracks.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Create a track to unlock morning interview drills.
            </p>
          ) : (
            <ul className="space-y-2">
              {tracks.map((t) => (
                <li
                  key={t.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-slate-50/70 px-3 py-2.5"
                >
                  <div>
                    <p className="text-sm font-medium">{t.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.track_type.replaceAll("_", " ")} · {t.status}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={t.completion_percent >= 70 ? "good" : "watch"}>
                      {t.completion_percent}%
                    </Badge>
                    <Link
                      href={`/interview-prep/${t.id}`}
                      className="text-xs font-semibold text-brand"
                    >
                      Open
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {activeTrack && (
          <div className="panel-surface p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">
                Next items · {activeTrack.title}
              </h2>
              <Badge tone="neutral">{activeTrack.completion_percent}%</Badge>
            </div>
            <ul className="space-y-2">
              {activeItems.map((item) => (
                <PrepItemRow key={item.id} item={item} />
              ))}
            </ul>

            <form action={itemAction} className="mt-4 flex flex-col gap-2 border-t border-border pt-4 sm:flex-row">
              <input type="hidden" name="track_id" value={activeTrack.id} />
              <input
                name="title"
                required
                placeholder="Add prep item"
                className="h-11 flex-1 rounded-lg border border-border bg-card px-3 text-sm outline-none ring-brand focus:ring-2"
              />
              <input
                name="estimated_minutes"
                type="number"
                defaultValue={20}
                className="h-11 w-24 rounded-lg border border-border bg-card px-3 text-sm outline-none ring-brand focus:ring-2"
              />
              <Button type="submit" disabled={itemPending} variant="secondary">
                Add
              </Button>
            </form>
            {itemState.error && (
              <p className="mt-2 text-sm text-danger">{itemState.error}</p>
            )}
          </div>
        )}

        <div className="panel-surface p-5">
          <h2 className="mb-3 text-sm font-semibold">Question bank</h2>
          <ul className="mb-4 space-y-2">
            {questions.slice(0, 8).map((q) => (
              <li
                key={q.id}
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
              >
                <span className="text-xs text-muted-foreground">
                  {q.category} · {q.difficulty}
                </span>
                <p className="mt-0.5">{q.question}</p>
              </li>
            ))}
            {questions.length === 0 && (
              <p className="text-sm text-muted-foreground">No questions yet.</p>
            )}
          </ul>
          <form action={qAction} className="space-y-2">
            {activeTrack && (
              <input type="hidden" name="track_id" value={activeTrack.id} />
            )}
            <textarea
              name="question"
              required
              rows={2}
              placeholder="Add an interview question"
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none ring-brand focus:ring-2"
            />
            <div className="flex flex-wrap gap-2">
              <select
                name="category"
                defaultValue="general"
                className="h-10 rounded-lg border border-border bg-card px-3 text-sm"
              >
                <option value="general">General</option>
                <option value="research">Research</option>
                <option value="behavioral">Behavioral</option>
                <option value="motivation">Motivation</option>
              </select>
              <select
                name="difficulty"
                defaultValue="medium"
                className="h-10 rounded-lg border border-border bg-card px-3 text-sm"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
              <Button type="submit" disabled={qPending} size="sm">
                Save question
              </Button>
            </div>
            {qState.error && <p className="text-sm text-danger">{qState.error}</p>}
            {qState.success && (
              <p className="text-sm text-success">{qState.success}</p>
            )}
          </form>
        </div>

        {practiceQuestion && (
          <div className="panel-surface p-5">
            <h2 className="mb-2 text-sm font-semibold">Practice attempt</h2>
            <p className="mb-3 text-sm text-foreground">{practiceQuestion.question}</p>
            {practiceQuestion.expected_answer && (
              <p className="mb-3 text-xs text-muted-foreground">
                Hint on file — answer first, then self-score.
              </p>
            )}
            <form action={attemptAction} className="space-y-2">
              <input type="hidden" name="question_id" value={practiceQuestion.id} />
              <textarea
                name="user_answer"
                required
                rows={4}
                placeholder="Speak it out loud, then type your answer here"
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none ring-brand focus:ring-2"
              />
              <div className="flex flex-wrap gap-2">
                <label className="text-xs text-muted-foreground">
                  Confidence
                  <input
                    name="confidence"
                    type="number"
                    min={1}
                    max={5}
                    defaultValue={3}
                    className="ml-2 h-9 w-16 rounded-lg border border-border bg-card px-2 text-sm"
                  />
                </label>
                <label className="text-xs text-muted-foreground">
                  Self-score %
                  <input
                    name="score"
                    type="number"
                    min={0}
                    max={100}
                    defaultValue={70}
                    className="ml-2 h-9 w-20 rounded-lg border border-border bg-card px-2 text-sm"
                  />
                </label>
                <Button type="submit" disabled={attemptPending} size="sm">
                  {attemptPending ? "Saving…" : "Log attempt"}
                </Button>
              </div>
              {attemptState.error && (
                <p className="text-sm text-danger">{attemptState.error}</p>
              )}
              {attemptState.success && (
                <p className="text-sm text-success">{attemptState.success}</p>
              )}
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

function PrepItemRow({ item }: { item: PrepItem }) {
  const [pending, startTransition] = useTransition();
  const done = item.status === "done";

  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border border-border bg-slate-50/70 px-3 py-2">
      <div>
        <p className={`text-sm ${done ? "text-muted-foreground line-through" : ""}`}>
          {item.title}
        </p>
        <p className="text-xs text-muted-foreground">
          {item.estimated_minutes ? `${item.estimated_minutes}m` : "—"}
          {item.day_number ? ` · day ${item.day_number}` : ""}
        </p>
      </div>
      <Button
        type="button"
        size="sm"
        variant={done ? "secondary" : "primary"}
        disabled={pending}
        onClick={() =>
          startTransition(() =>
            togglePrepItemDoneAction(item.id, item.track_id, !done),
          )
        }
      >
        {pending ? "…" : done ? "Undo" : "Done"}
      </Button>
    </li>
  );
}
