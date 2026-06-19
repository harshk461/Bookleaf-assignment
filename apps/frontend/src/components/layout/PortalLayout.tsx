"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { BookOpen, LogOut, Menu } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { APP_NAME } from "@/utils/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export interface PortalNavLink {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface PortalLayoutProps {
  children: ReactNode;
  subtitle: string;
  links: PortalNavLink[];
  requiredRole: "author" | "admin";
}

function NavLinks({
  links,
  pathname,
  onNavigate,
}: {
  links: PortalNavLink[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-1">
      {links.map((link) => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "border-l-2 border-primary bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function PortalLayout({ children, subtitle, links, requiredRole }: PortalLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    } else if (!loading && user && user.role !== requiredRole) {
      router.replace(user.role === "admin" ? "/admin/tickets" : "/author/books");
    }
  }, [loading, user, router, requiredRole]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="space-y-3 w-64">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  if (!user || user.role !== requiredRole) return null;

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="border-b border-sidebar-border px-4 py-5">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BookOpen className="size-4" />
          </div>
          <div>
            <p className="font-semibold leading-tight">{APP_NAME}</p>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>
      </div>
      <div className="flex-1 px-3 py-4">
        <NavLinks links={links} pathname={pathname} onNavigate={() => setMobileOpen(false)} />
      </div>
      <div className="border-t border-sidebar-border p-3">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-muted transition-colors outline-none">
            <Avatar className="size-8">
              <AvatarFallback className="bg-primary/10 text-primary text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <Badge variant="secondary" className="mt-0.5 text-[10px] capitalize">
                {user.role}
              </Badge>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem onClick={logout}>
              <LogOut className="size-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>

      <aside className="hidden w-60 shrink-0 border-r border-sidebar-border bg-sidebar md:flex md:flex-col">
        {sidebar}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 md:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={
                <Button variant="outline" size="icon" aria-label="Open menu" />
              }
            >
              <Menu className="size-4" />
            </SheetTrigger>
            <SheetContent side="left" className="w-60 p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>Navigation</SheetTitle>
              </SheetHeader>
              {sidebar}
            </SheetContent>
          </Sheet>
          <span className="font-semibold">{APP_NAME}</span>
        </header>

        <main id="main-content" className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
