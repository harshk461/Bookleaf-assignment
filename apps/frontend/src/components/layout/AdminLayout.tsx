"use client";

import { Inbox } from "lucide-react";
import type { ReactNode } from "react";
import { PortalLayout } from "./PortalLayout";

const links = [{ href: "/admin/tickets", label: "Ticket Queue", icon: Inbox }];

export function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <PortalLayout subtitle="Admin Console" links={links} requiredRole="admin">
      {children}
    </PortalLayout>
  );
}
