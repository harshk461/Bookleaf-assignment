"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/common/Button";
import { AppShell } from "./AppShell";

export function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <nav>
          <Link
            href="/admin/tickets"
            className={`rounded-md px-3 py-2 text-sm ${
              pathname.startsWith("/admin/tickets")
                ? "bg-emerald-100 font-medium text-emerald-900"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Ticket Queue
          </Link>
        </nav>
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <span>{user?.name} (Admin)</span>
          <Button variant="ghost" onClick={logout}>
            Logout
          </Button>
        </div>
      </div>
      {children}
    </AppShell>
  );
}
