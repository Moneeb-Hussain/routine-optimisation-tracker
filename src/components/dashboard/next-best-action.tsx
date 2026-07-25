"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export function NextBestActionCard({
  title,
  reason,
  minutes,
}: {
  title: string;
  reason: string;
  minutes: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="relative overflow-hidden rounded-[var(--radius)] border border-cyan-200/60 bg-gradient-to-br from-cyan-50 via-white to-sky-50 p-5 shadow-[var(--shadow-card)]"
    >
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-cyan-200/30 blur-2xl" />
      <div className="relative">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-brand shadow-sm">
          <Sparkles className="h-3.5 w-3.5" />
          Next best action
        </div>
        <h3 className="font-display text-lg font-semibold tracking-tight text-foreground">
          {title}
        </h3>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {reason}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button size="sm">
            Start now
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
          <span className="text-xs font-medium text-muted-foreground">
            ~{minutes} focused minutes
          </span>
        </div>
      </div>
    </motion.div>
  );
}
