"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

type Slice = { name: string; value: number; fill: string };

export function CategoryMixChart({ data }: { data: readonly Slice[] }) {
  return (
    <div className="panel-surface flex h-full min-h-[280px] flex-col p-5">
      <div className="mb-2">
        <h3 className="text-sm font-semibold text-foreground">Time by category</h3>
        <p className="text-xs text-muted-foreground">This week’s planned effort mix</p>
      </div>

      <div className="grid flex-1 grid-cols-1 items-center gap-2 sm:grid-cols-2">
        <div className="mx-auto h-[180px] w-full max-w-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={[...data]}
                dataKey="value"
                nameKey="name"
                innerRadius={48}
                outerRadius={72}
                paddingAngle={3}
                stroke="none"
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 12,
                  border: "none",
                  boxShadow: "0px 18px 40px rgba(112, 144, 176, 0.12)",
                }}
                formatter={(value) => [`${value}%`, "Share"]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <ul className="space-y-2">
          {data.map((item) => (
            <li key={item.name} className="flex items-center justify-between gap-2 text-xs">
              <span className="inline-flex items-center gap-2 text-muted-foreground">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: item.fill }}
                />
                {item.name}
              </span>
              <span className="metric font-semibold text-foreground">{item.value}%</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
