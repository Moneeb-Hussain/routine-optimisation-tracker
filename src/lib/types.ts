import { z } from "zod";

export const strongestProjectSchema = z.object({
  name: z.string().min(1),
  bullets: z.array(z.string()),
});

export const profileSchema = z.object({
  full_name: z.string().min(1, "Name is required"),
  degree: z.string().min(1),
  university: z.string().min(1),
  cgpa: z.coerce.number().min(0).max(4).optional().nullable(),
  ielts_academic: z.coerce.number().min(0).max(9).optional().nullable(),
  target_primary: z.string().min(1),
  target_secondary: z.string().min(1),
  target_intake: z.string().min(1),
  timezone: z.string().min(1),
  research_interests: z.array(z.string()),
  strongest_project: strongestProjectSchema,
  achievements: z.array(z.string()),
  onboarding_completed: z.boolean().optional(),
});

export const taskInputSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  category: z.string().default("personal"),
  priority: z.enum(["critical", "high", "medium", "low"]).default("medium"),
  is_must_do: z.boolean().default(false),
  estimated_minutes: z.coerce.number().int().positive().optional().nullable(),
  scheduled_date: z.string().optional().nullable(),
  due_date: z.string().optional().nullable(),
  goal_id: z.string().uuid().optional().nullable(),
});

export const goalInputSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  horizon: z
    .enum(["long_term", "quarterly", "monthly", "weekly", "daily"])
    .default("long_term"),
  category: z.string().default("admissions"),
  target_date: z.string().optional().nullable(),
  parent_id: z.string().uuid().optional().nullable(),
});

export const dailyPlanInputSchema = z.object({
  plan_date: z.string().min(1),
  primary_goal: z.string().min(1, "Primary goal is required"),
  why_it_matters: z.string().optional(),
  available_hours: z.coerce.number().positive().optional().nullable(),
  estimated_energy: z.coerce.number().int().min(1).max(5).optional().nullable(),
  important_deadline: z.string().optional(),
  current_blocker: z.string().optional(),
  notes: z.string().optional(),
});

export const sleepLogInputSchema = z.object({
  log_date: z.string().min(1),
  sleep_start: z.string().optional().nullable(),
  wake_time: z.string().optional().nullable(),
  duration_hours: z.coerce.number().min(0).max(24).optional().nullable(),
  quality: z.coerce.number().int().min(1).max(5).optional().nullable(),
  awakenings: z.coerce.number().int().min(0).default(0),
  energy_level: z.coerce.number().int().min(1).max(5).optional().nullable(),
  stress_level: z.coerce.number().int().min(1).max(5).optional().nullable(),
  caffeine_note: z.string().optional(),
  exercised: z.boolean().default(false),
  notes: z.string().optional(),
});

export type Profile = z.infer<typeof profileSchema> & {
  id: string;
  onboarding_completed: boolean;
};

export type Task = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  priority: "critical" | "high" | "medium" | "low";
  status: "todo" | "in_progress" | "blocked" | "done" | "cancelled";
  is_must_do: boolean;
  estimated_minutes: number | null;
  actual_minutes: number | null;
  due_date: string | null;
  scheduled_date: string | null;
  goal_id: string | null;
  completed_at: string | null;
  created_at: string;
};

export type Goal = {
  id: string;
  user_id: string;
  parent_id: string | null;
  title: string;
  description: string;
  horizon: "long_term" | "quarterly" | "monthly" | "weekly" | "daily";
  category: string;
  status: "active" | "paused" | "completed" | "cancelled";
  target_date: string | null;
  progress_percent: number;
  created_at: string;
};

export type DailyPlan = {
  id: string;
  user_id: string;
  plan_date: string;
  primary_goal: string;
  why_it_matters: string;
  available_hours: number | null;
  estimated_energy: number | null;
  important_deadline: string;
  current_blocker: string;
  notes: string;
};

export type SleepLog = {
  id: string;
  user_id: string;
  log_date: string;
  sleep_start: string | null;
  wake_time: string | null;
  duration_hours: number | null;
  quality: number | null;
  awakenings: number;
  energy_level: number | null;
  stress_level: number | null;
  caffeine_note: string;
  exercised: boolean;
  notes: string;
};

export type FocusSession = {
  id: string;
  user_id: string;
  task_id: string | null;
  planned_minutes: number;
  actual_minutes: number | null;
  started_at: string;
  ended_at: string | null;
  interruption_count: number;
  focus_quality: number | null;
  status: "running" | "paused" | "completed" | "abandoned";
};
