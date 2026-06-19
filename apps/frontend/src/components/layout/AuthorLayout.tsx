"use client";

import { BookOpen, MessageSquare, PlusCircle } from "lucide-react";
import type { ReactNode } from "react";
import { PortalLayout } from "./PortalLayout";

const links = [
  { href: "/author/books", label: "My Books", icon: BookOpen },
  { href: "/author/tickets", label: "My Tickets", icon: MessageSquare },
  { href: "/author/tickets/new", label: "Submit Ticket", icon: PlusCircle },
];

export function AuthorLayout({ children }: { children: ReactNode }) {
  return (
    <PortalLayout subtitle="Author Portal" links={links} requiredRole="author">
      {children}
    </PortalLayout>
  );
}
