"use client";

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Point = { day: string; score: number; deepWork: number };

export function WeeklyProgressChart({ data }: { data: readonly Point[] }) {
  return (
    <div className="panel-surface flex h-full min-h-[320px] flex-col p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Weekly execution</h3>
          <p className="text-xs text-muted-foreground">
            Score trend with deep-work minutes overlay
          </p>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-brand" /> Score
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-3 rounded bg-amber-500" /> Deep work
          </span>
        </div>
      </div>

      <div className="h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={[...data]} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 11, fill: "#94A3B8", fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              dy={8}
            />
            <YAxis
              yAxisId="score"
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: "#94A3B8", fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis yAxisId="deep" orientation="right" hide domain={[0, 160]} />
            <Tooltip
              cursor={{ fill: "rgba(226, 232, 240, 0.45)", radius: 4 }}
              contentStyle={{
                fontSize: 12,
                borderRadius: 12,
                border: "none",
                padding: "10px 14px",
                boxShadow: "0px 18px 40px rgba(112, 144, 176, 0.12)",
              }}
            />
            <Bar
              yAxisId="score"
              dataKey="score"
              name="Execution score"
              barSize={18}
              fill="#0E7490"
              radius={[4, 4, 0, 0]}
            />
            <Line
              yAxisId="deep"
              type="monotone"
              dataKey="deepWork"
              name="Deep work (min)"
              stroke="#D97706"
              strokeWidth={2.5}
              dot={{ fill: "#D97706", r: 3 }}
              activeDot={{ r: 5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <p className="sr-only">
        Weekly chart of daily execution scores and deep-work minutes for the last seven days.
      </p>
    </div>
  );
}
