"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";

export function AppShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="workspace-bg min-h-screen">
      <Sidebar />
      <div className="transition-[padding] duration-200 md:pl-[var(--sidebar-width,268px)]">
        <Header title={title} subtitle={subtitle} />
        <main className="px-4 pb-24 pt-4 md:px-6 md:pb-8 md:pt-5">{children}</main>
      </div>
      <MobileNav />
    </div>
  );
}
