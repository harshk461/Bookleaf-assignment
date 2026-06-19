import type { Ticket } from "@bookleaf/shared";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { TicketStatusBadge } from "./TicketStatusBadge";
import { CategoryBadge } from "./CategoryBadge";
import { PriorityBadge } from "./PriorityBadge";
import { formatDate } from "@/utils/formatDate";
import { cn } from "@/lib/utils";

interface TicketListProps {
  tickets: Ticket[];
  admin?: boolean;
}

const MS_PER_DAY = 86_400_000;

function isOlderThanDays(isoDate: string, days: number): boolean {
  const created = new Date(isoDate).getTime();
  return Date.now() - created > days * MS_PER_DAY;
}

function isUrgent(ticket: Ticket): boolean {
  return ticket.priority === "critical" || ticket.priority === "high";
}

export function TicketList({ tickets, admin = false }: TicketListProps) {
  if (!tickets.length) {
    return null;
  }

  return (
    <ul className="space-y-3">
      {tickets.map((ticket) => {
        const href = admin ? `/admin/tickets/${ticket.id}` : `/author/tickets/${ticket.id}`;
        const urgent = admin && isUrgent(ticket);
        const stale =
          admin &&
          isOlderThanDays(ticket.createdAt, 7) &&
          (ticket.status === "open" || ticket.status === "in_progress");

        const content = (
          <Card
            className={cn(
              "transition-shadow hover:shadow-md",
              urgent && "border-destructive/40 bg-destructive/5",
              stale && !urgent && "border-amber-500/40 bg-amber-500/5",
            )}
          >
            <CardContent className="flex flex-wrap items-start justify-between gap-3 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium group-hover:text-primary transition-colors">{ticket.subject}</h3>
                  <ChevronRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {ticket.ticketNumber} · {formatDate(ticket.createdAt)}
                  {ticket.bookTitle ? ` · ${ticket.bookTitle}` : ""}
                  {stale && (
                    <span className="ml-2 text-amber-600 dark:text-amber-400">· Awaiting 7+ days</span>
                  )}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <TicketStatusBadge status={ticket.status} />
                {ticket.category && <CategoryBadge category={ticket.category} />}
                {ticket.priority && <PriorityBadge priority={ticket.priority} />}
              </div>
            </CardContent>
          </Card>
        );

        return (
          <li key={ticket.id}>
            <Link href={href} className="group block">
              {content}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
