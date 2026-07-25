export function ScoreBreakdown({
  items,
}: {
  items: readonly { label: string; weight: number; value: number }[];
}) {
  return (
    <div className="panel-surface p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground">Score breakdown</h3>
        <p className="text-xs text-muted-foreground">
          Transparent weighting — sleep adjusts readiness, never punishes.
        </p>
      </div>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.label}>
            <div className="mb-1 flex items-center justify-between gap-2 text-xs">
              <span className="text-muted-foreground">
                {item.label}{" "}
                <span className="text-slate-400">({item.weight}%)</span>
              </span>
              <span className="metric font-semibold text-foreground">{item.value}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-brand/80"
                style={{ width: `${item.value}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
