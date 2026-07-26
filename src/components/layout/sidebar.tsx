"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  CalendarDays,
  Target,
  CheckSquare,
  Users,
  Mail,
  FolderOpen,
  Mic2,
  BookOpen,
  Moon,
  BarChart3,
  Sparkles,
  Bell,
  Plane,
  Settings,
  ChevronLeft,
  ChevronRight,
  Flag,
} from "lucide-react";
import { cn } from "@/lib/utils";

const COLLAPSE_KEY = "mission-usa-sidebar-collapsed";
const COLLAPSE_EVENT = "mission-usa-sidebar-change";
const MOBILE_EVENT = "toggle-mobile-sidebar";
const MOBILE_STORE_EVENT = "mission-usa-mobile-nav-change";

const sections = [
  {
    title: "Execute",
    items: [
      { label: "Command Center", href: "/dashboard", icon: LayoutDashboard },
      { label: "Today", href: "/today", icon: CalendarDays },
      { label: "Goals", href: "/goals", icon: Target },
      { label: "Tasks", href: "/tasks", icon: CheckSquare },
    ],
  },
  {
    title: "Admissions",
    items: [
      { label: "Professor CRM", href: "/professors", icon: Users },
      { label: "Email Studio", href: "/email-studio", icon: Mail },
      { label: "Document Vault", href: "/documents", icon: FolderOpen },
      { label: "Journey to USA", href: "/journey", icon: Plane },
    ],
  },
  {
    title: "Prepare",
    items: [
      { label: "Interview Prep", href: "/interview-prep", icon: Mic2 },
      { label: "Learning Plans", href: "/learning", icon: BookOpen },
      { label: "Sleep & Energy", href: "/sleep", icon: Moon },
      { label: "AI Coach", href: "/coach", icon: Sparkles },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Analytics", href: "/analytics", icon: BarChart3 },
      { label: "Reminders", href: "/reminders", icon: Bell },
      { label: "Settings", href: "/settings/profile", icon: Settings },
    ],
  },
] as const;

let mobileOpenStore = false;
const mobileListeners = new Set<() => void>();

function setMobileOpenStore(next: boolean) {
  mobileOpenStore = next;
  mobileListeners.forEach((listener) => listener());
  document.documentElement.dispatchEvent(new Event(MOBILE_STORE_EVENT));
}

function subscribeMobile(listener: () => void) {
  mobileListeners.add(listener);
  return () => mobileListeners.delete(listener);
}

function getMobileSnapshot() {
  return mobileOpenStore;
}

function getMobileServerSnapshot() {
  return false;
}

function subscribeCollapsed(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener(COLLAPSE_EVENT, listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener(COLLAPSE_EVENT, listener);
  };
}

function getCollapsedSnapshot() {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === "true";
  } catch {
    return false;
  }
}

function getCollapsedServerSnapshot() {
  return false;
}

function setCollapsed(next: boolean) {
  try {
    localStorage.setItem(COLLAPSE_KEY, String(next));
  } catch {
    // ignore
  }
  window.dispatchEvent(new Event(COLLAPSE_EVENT));
  document.documentElement.style.setProperty(
    "--sidebar-width",
    next ? "76px" : "268px",
  );
}

export function Sidebar() {
  const pathname = usePathname() || "";
  const collapsed = useSyncExternalStore(
    subscribeCollapsed,
    getCollapsedSnapshot,
    getCollapsedServerSnapshot,
  );
  const mobileOpen = useSyncExternalStore(
    subscribeMobile,
    getMobileSnapshot,
    getMobileServerSnapshot,
  );

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar-width",
      collapsed ? "76px" : "268px",
    );
  }, [collapsed]);

  useEffect(() => {
    const handler = () => setMobileOpenStore(!mobileOpenStore);
    document.addEventListener(MOBILE_EVENT, handler);
    return () => document.removeEventListener(MOBILE_EVENT, handler);
  }, []);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard" || pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpenStore(false)}
        />
      )}

      <motion.aside
        animate={{ width: collapsed ? 76 : 268 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen flex-col overflow-hidden border-r border-sidebar-border bg-sidebar transition-transform duration-300 md:translate-x-0",
          mobileOpen ? "translate-x-0 !w-[268px]" : "-translate-x-full md:!w-auto",
        )}
      >
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-sidebar-border px-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-brand text-sidebar shadow-lg shadow-cyan-500/20">
            <Flag className="h-4 w-4" />
          </div>
          {(!collapsed || mobileOpen) && (
            <div className="min-w-0">
              <p className="truncate font-display text-sm font-semibold tracking-tight text-sidebar-active">
                Mission USA AI
              </p>
              <p className="truncate text-[10px] text-sidebar-foreground">
                Admissions OS
              </p>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          {sections.map((section) => (
            <div key={section.title} className="mb-5">
              {(!collapsed || mobileOpen) && (
                <div className="px-4 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  {section.title}
                </div>
              )}
              <div className="space-y-0.5 px-2">
                {section.items.map((item) => {
                  const active = isActive(item.href);
                  const soon =
                    "soon" in item &&
                    Boolean((item as { soon?: boolean }).soon);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpenStore(false)}
                      className={cn(
                        "nav-item relative",
                        active && "active",
                        soon && "opacity-70",
                      )}
                      title={item.label}
                    >
                      <item.icon className="h-[18px] w-[18px] shrink-0" />
                      {(!collapsed || mobileOpen) && (
                        <>
                          <span className="flex-1 truncate">{item.label}</span>
                          {soon && (
                            <span className="rounded bg-sidebar-elevated px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-slate-400">
                              Soon
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="hidden border-t border-sidebar-border p-2 md:block">
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="nav-item w-full justify-center"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </motion.aside>
    </>
  );
}
