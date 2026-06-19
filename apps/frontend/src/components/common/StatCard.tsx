import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  accent?: "primary" | "accent" | "muted";
}

const accentStyles = {
  primary: "border-l-primary",
  accent: "border-l-accent",
  muted: "border-l-muted-foreground/30",
};

export function StatCard({ label, value, icon: Icon, accent = "primary" }: StatCardProps) {
  return (
    <Card className={cn("border-l-4 transition-shadow hover:shadow-md", accentStyles[accent])}>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="text-xl font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
