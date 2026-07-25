"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { Tone } from "@/lib/fixtures/command-center";

function IconBubble({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: Tone;
}) {
  return (
    <div
      className={cn(
        "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
        tone === "neutral" && "bg-slate-50 text-slate-600",
        tone === "good" && "bg-success-soft text-success",
        tone === "watch" && "bg-warning-soft text-warning",
        tone === "critical" && "bg-danger-soft text-danger",
      )}
    >
      {children}
    </div>
  );
}

export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "neutral",
  badge,
  progress,
  delay = 0,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  tone?: Tone;
  badge?: string;
  progress?: number;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="card-surface card-surface-interactive p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="metric mt-1 text-2xl font-bold tracking-tight text-foreground">
            {value}
          </p>
          {hint ? (
            <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
          ) : null}
        </div>
        <div className="flex flex-col items-end gap-2">
          <IconBubble tone={tone}>
            <Icon className="h-5 w-5" />
          </IconBubble>
          {badge ? <Badge tone={tone === "neutral" ? "brand" : tone}>{badge}</Badge> : null}
        </div>
      </div>
      {typeof progress === "number" ? (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              tone === "good" && "bg-success",
              tone === "watch" && "bg-warning",
              tone === "critical" && "bg-danger",
              tone === "neutral" && "bg-brand",
            )}
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      ) : null}
    </motion.div>
  );
}
