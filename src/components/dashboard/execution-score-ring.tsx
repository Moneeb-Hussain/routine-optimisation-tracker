"use client";

import { motion } from "framer-motion";

export function ExecutionScoreRing({
  score,
  label = "Daily Execution Score",
}: {
  score: number;
  label?: string;
}) {
  const RADIUS = 54;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const offset = CIRCUMFERENCE * (1 - score / 100);

  let stroke = "#059669";
  let status = "Strong day";
  let statusClass = "text-success";

  if (score < 50) {
    stroke = "#E11D48";
    status = "Needs focus";
    statusClass = "text-danger";
  } else if (score < 70) {
    stroke = "#D97706";
    status = "Building momentum";
    statusClass = "text-warning";
  } else if (score < 85) {
    stroke = "#0E7490";
    status = "On track";
    statusClass = "text-brand";
  }

  return (
    <div className="panel-surface flex h-full flex-col p-5">
      <div className="mb-2">
        <h3 className="text-sm font-semibold text-foreground">{label}</h3>
        <p className="text-xs text-muted-foreground">
          Weighted toward must-dos and deep work — not busywork.
        </p>
      </div>

      <div className="relative mx-auto mt-2 w-full max-w-[180px]">
        <svg viewBox="0 0 128 128" className="w-full drop-shadow-sm">
          <circle
            cx="64"
            cy="64"
            r={RADIUS}
            fill="none"
            stroke="#E2E8F0"
            strokeWidth="10"
          />
          <motion.circle
            cx="64"
            cy="64"
            r={RADIUS}
            fill="none"
            strokeWidth="10"
            strokeLinecap="round"
            stroke={stroke}
            strokeDasharray={CIRCUMFERENCE}
            initial={{ strokeDashoffset: CIRCUMFERENCE }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.4, ease: "easeOut" }}
            transform="rotate(-90 64 64)"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="metric text-4xl font-bold text-foreground">{score}</span>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
            / 100
          </span>
        </div>
      </div>

      <p className={`mt-3 text-center text-sm font-bold uppercase tracking-wider ${statusClass}`}>
        {status}
      </p>
    </div>
  );
}
