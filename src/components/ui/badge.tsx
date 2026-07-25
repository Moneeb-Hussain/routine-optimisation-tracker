import { cn } from "@/lib/utils";

export function Badge({
  className,
  tone = "neutral",
  children,
}: {
  className?: string;
  tone?: "neutral" | "good" | "watch" | "critical" | "brand";
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase",
        tone === "neutral" && "bg-muted text-muted-foreground",
        tone === "good" && "bg-success-soft text-success",
        tone === "watch" && "bg-warning-soft text-warning",
        tone === "critical" && "bg-danger-soft text-danger",
        tone === "brand" && "bg-brand-soft text-brand",
        className,
      )}
    >
      {children}
    </span>
  );
}
