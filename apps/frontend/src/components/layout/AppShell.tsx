import type { ReactNode } from "react";
import { BookOpen } from "lucide-react";
import { APP_NAME } from "@/utils/constants";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-4">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BookOpen className="size-5" />
          </div>
          <div>
            <span className="text-lg font-semibold">{APP_NAME}</span>
            <p className="text-xs text-muted-foreground">Author Support Portal</p>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
