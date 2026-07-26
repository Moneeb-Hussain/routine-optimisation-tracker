import { createClient } from "@/lib/supabase/server";
import { isOpenAIConfigured, isSupabaseConfigured } from "@/lib/env";
import { buildRuleMorningBrief, type MorningBrief } from "@/lib/domain/morning-brief";
import { rankChunksByQuery } from "@/lib/domain/documents";
import { embedQuery, toVectorLiteral } from "@/lib/ai/embeddings";

function todayInTimeZone(timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export type CoachContext = {
  timezone: string;
  today: string;
  profileName: string;
  primaryGoal: string;
  blocker: string;
  mustDos: Array<{ title: string; status: string; minutes: number | null }>;
  overdueMustDos: Array<{ title: string; due_date: string | null }>;
  sleep: { hours: number | null; energy: number | null; target: number };
  followUps: Array<{ professor: string; due_on: string }>;
  pipelineCounts: Record<string, number>;
  interviewNext: string | null;
  interviewProgress: number;
  deadlines: Array<{ name: string; deadline: string | null }>;
  recentWins: string[];
  documentSnippets: Array<{ title: string; content: string }>;
  retrievalMode: "embedding" | "keyword" | "none";
};

export async function getCoachContext(query?: string): Promise<CoachContext | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, timezone")
    .eq("id", user.id)
    .maybeSingle();
  const timezone = profile?.timezone || "Asia/Karachi";
  const today = todayInTimeZone(timezone);
  const yesterday = (() => {
    const d = new Date(`${today}T12:00:00`);
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  })();

  const [
    prefs,
    plan,
    tasks,
    overdue,
    sleep,
    followUps,
    professors,
    prepItems,
    tracks,
    universities,
    doneTasks,
    chunks,
  ] = await Promise.all([
    supabase.from("user_preferences").select("sleep_target_hours, deep_work_target_minutes").eq("user_id", user.id).maybeSingle(),
    supabase.from("daily_plans").select("primary_goal, current_blocker").eq("user_id", user.id).eq("plan_date", today).maybeSingle(),
    supabase.from("tasks").select("title, status, estimated_minutes, is_must_do").eq("user_id", user.id).eq("scheduled_date", today).eq("is_must_do", true),
    supabase.from("tasks").select("title, due_date").eq("user_id", user.id).eq("is_must_do", true).neq("status", "done").lt("due_date", today).limit(5),
    supabase.from("sleep_logs").select("duration_hours, energy_level").eq("user_id", user.id).eq("log_date", yesterday).maybeSingle(),
    supabase.from("outreach_followups").select("due_on, professors(full_name)").eq("user_id", user.id).eq("status", "pending").order("due_on").limit(5),
    supabase.from("professors").select("outreach_stage").eq("user_id", user.id),
    supabase.from("preparation_items").select("title, status, track_id").eq("user_id", user.id).neq("status", "done").order("sort_order").limit(5),
    supabase.from("preparation_tracks").select("id, completion_percent, status").eq("user_id", user.id).eq("status", "active"),
    supabase.from("universities").select("name, deadline").eq("user_id", user.id).not("deadline", "is", null).order("deadline").limit(5),
    supabase.from("tasks").select("title").eq("user_id", user.id).eq("status", "done").order("completed_at", { ascending: false }).limit(3),
    supabase
      .from("document_chunks")
      .select("content, documents(title)")
      .eq("user_id", user.id)
      .limit(60),
  ]);

  const pipelineCounts: Record<string, number> = {};
  for (const p of professors.data || []) {
    const stage = p.outreach_stage || "Discovered";
    pipelineCounts[stage] = (pipelineCounts[stage] || 0) + 1;
  }

  const interviewProgress =
    (tracks.data || []).length === 0
      ? 0
      : Math.round(
          (tracks.data || []).reduce((s, t) => s + (t.completion_percent || 0), 0) /
            (tracks.data || []).length,
        );

  const searchQuery =
    query ||
    [
      plan.data?.primary_goal,
      ...(tasks.data || []).map((t) => t.title),
      "cv research project",
    ]
      .filter(Boolean)
      .join(" ");

  let documentSnippets: Array<{ title: string; content: string }> = [];
  let retrievalMode: CoachContext["retrievalMode"] = "none";

  if (isOpenAIConfigured() && searchQuery.trim()) {
    try {
      const vector = await embedQuery(searchQuery);
      if (vector) {
        const { data: matched, error } = await supabase.rpc(
          "match_document_chunks",
          {
            query_embedding: toVectorLiteral(vector),
            match_user_id: user.id,
            match_count: 4,
          },
        );
        if (!error && matched && matched.length > 0) {
          documentSnippets = matched.map(
            (m: {
              document_title?: string;
              content: string;
            }) => ({
              title: m.document_title || "Document",
              content: (m.content || "").slice(0, 500),
            }),
          );
          retrievalMode = "embedding";
        }
      }
    } catch {
      // fall through to keyword
    }
  }

  if (documentSnippets.length === 0) {
    const ranked = rankChunksByQuery(
      (chunks.data || []).map((c) => {
        const doc = Array.isArray(c.documents) ? c.documents[0] : c.documents;
        return {
          content: c.content,
          document_title: doc?.title || "Document",
        };
      }),
      searchQuery,
      4,
    );
    documentSnippets = ranked.map((r) => ({
      title: r.document_title || "Document",
      content: r.content.slice(0, 500),
    }));
    retrievalMode = documentSnippets.length ? "keyword" : "none";
  }

  return {
    timezone,
    today,
    profileName: profile?.full_name || "there",
    primaryGoal: plan.data?.primary_goal || "",
    blocker: plan.data?.current_blocker || "",
    mustDos: (tasks.data || []).map((t) => ({
      title: t.title,
      status: t.status,
      minutes: t.estimated_minutes,
    })),
    overdueMustDos: (overdue.data || []).map((t) => ({
      title: t.title,
      due_date: t.due_date,
    })),
    sleep: {
      hours: sleep.data?.duration_hours ?? null,
      energy: sleep.data?.energy_level ?? null,
      target: Number(prefs.data?.sleep_target_hours ?? 7.5),
    },
    followUps: (followUps.data || []).map((f) => {
      const prof = Array.isArray(f.professors) ? f.professors[0] : f.professors;
      return {
        professor: prof?.full_name || "Professor",
        due_on: f.due_on,
      };
    }),
    pipelineCounts,
    interviewNext: (prepItems.data || [])[0]?.title || null,
    interviewProgress,
    deadlines: (universities.data || []).map((u) => ({
      name: u.name,
      deadline: u.deadline,
    })),
    recentWins: (doneTasks.data || []).map((t) => t.title),
    documentSnippets,
    retrievalMode,
  };
}

export async function getOrBuildMorningBrief(): Promise<{
  brief: MorningBrief;
  saved: boolean;
  date: string;
} | null> {
  const ctx = await getCoachContext();
  if (!ctx) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: existing } = await supabase
    .from("morning_briefs")
    .select("*")
    .eq("user_id", user.id)
    .eq("brief_date", ctx.today)
    .maybeSingle();

  if (existing) {
    return {
      date: ctx.today,
      saved: true,
      brief: {
        primaryGoal: existing.primary_goal,
        topTasks: Array.isArray(existing.top_tasks)
          ? (existing.top_tasks as string[])
          : [],
        importantDeadline: existing.important_deadline,
        followUpDue: existing.follow_up_due,
        deepWorkBlock: existing.deep_work_block,
        interviewOrLearningAction: existing.interview_or_learning_action,
        sleepAwareWorkload: existing.sleep_aware_workload,
        avoidToday: existing.avoid_today,
        motivation: existing.motivation,
        source: (existing.source as MorningBrief["source"]) || "rule",
      },
    };
  }

  const prefs = await supabase
    .from("user_preferences")
    .select("deep_work_target_minutes")
    .eq("user_id", user.id)
    .maybeSingle();

  const brief = buildRuleMorningBrief({
    firstName: ctx.profileName.split(" ")[0] || "there",
    primaryGoal: ctx.primaryGoal,
    mustDoTitles: ctx.mustDos.map((t) => t.title),
    followUpLabel: ctx.followUps[0]
      ? `${ctx.followUps[0].professor} (due ${ctx.followUps[0].due_on})`
      : null,
    deadlineLabel: ctx.deadlines[0]
      ? `${ctx.deadlines[0].name}${ctx.deadlines[0].deadline ? ` · ${ctx.deadlines[0].deadline}` : ""}`
      : null,
    sleepHours: ctx.sleep.hours,
    sleepTarget: ctx.sleep.target,
    energyLevel: ctx.sleep.energy,
    interviewNextTitle: ctx.interviewNext,
    deepWorkTargetMinutes: Number(prefs.data?.deep_work_target_minutes ?? 120),
  });

  await supabase.from("morning_briefs").upsert(
    {
      user_id: user.id,
      brief_date: ctx.today,
      primary_goal: brief.primaryGoal,
      top_tasks: brief.topTasks,
      important_deadline: brief.importantDeadline,
      follow_up_due: brief.followUpDue,
      deep_work_block: brief.deepWorkBlock,
      interview_or_learning_action: brief.interviewOrLearningAction,
      sleep_aware_workload: brief.sleepAwareWorkload,
      avoid_today: brief.avoidToday,
      motivation: brief.motivation,
      source: brief.source,
    },
    { onConflict: "user_id,brief_date" },
  );

  return { brief, saved: true, date: ctx.today };
}
