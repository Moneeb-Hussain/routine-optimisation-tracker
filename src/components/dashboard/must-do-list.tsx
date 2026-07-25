import { CheckCircle2, Circle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Task = {
  id: string;
  title: string;
  minutes: number;
  category: string;
  done: boolean;
};

export function MustDoList({ tasks }: { tasks: readonly Task[] }) {
  return (
    <div className="panel-surface p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Must-do today</h3>
          <p className="text-xs text-muted-foreground">Highest-impact items only</p>
        </div>
        <Badge tone="brand">
          {tasks.filter((t) => t.done).length}/{tasks.length}
        </Badge>
      </div>

      <ul className="space-y-2.5">
        {tasks.map((task) => (
          <li
            key={task.id}
            className={cn(
              "flex items-start gap-3 rounded-xl border border-border bg-slate-50/60 px-3 py-3",
              task.done && "opacity-70",
            )}
          >
            {task.done ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
            ) : (
              <Circle className="mt-0.5 h-5 w-5 shrink-0 text-slate-300" />
            )}
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "text-sm font-medium text-foreground",
                  task.done && "line-through",
                )}
              >
                {task.title}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                <span>{task.category}</span>
                <span>·</span>
                <span className="metric">{task.minutes} min</span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
