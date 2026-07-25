"use client";

import { Menu, Search, Plus, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-background/80 backdrop-blur-md">
      <div className="flex items-center justify-between gap-4 px-4 py-3 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-foreground md:hidden"
            onClick={() =>
              document.dispatchEvent(new Event("toggle-mobile-sidebar"))
            }
            aria-label="Open navigation"
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <h1 className="truncate font-display text-lg font-semibold tracking-tight text-foreground md:text-xl">
              {title}
            </h1>
            {subtitle ? (
              <p className="truncate text-xs text-muted-foreground md:text-sm">
                {subtitle}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="hidden h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-xs text-muted-foreground shadow-sm transition hover:border-border-strong hover:text-foreground md:inline-flex"
            aria-label="Search"
          >
            <Search className="h-3.5 w-3.5" />
            <span>Search</span>
            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
              ⌘K
            </kbd>
          </button>
          <Button size="sm" variant="secondary" className="hidden sm:inline-flex">
            <Timer className="h-3.5 w-3.5" />
            Focus
          </Button>
          <Button size="sm">
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Quick add</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
