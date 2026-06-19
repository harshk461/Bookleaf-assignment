"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { MessageSquare, PlusCircle } from "lucide-react";
import { useTickets } from "@/hooks/useTickets";
import { useTicketStream } from "@/hooks/useTicketStream";
import { TicketList } from "@/components/tickets/TicketList";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorAlert } from "@/components/common/ErrorAlert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { TICKET_STATUSES } from "@bookleaf/shared";
import type { Ticket } from "@bookleaf/shared";
import { TICKET_STATUS_LABELS } from "@/utils/constants";
import { cn } from "@/lib/utils";

function TicketListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="p-4">
          <Skeleton className="h-5 w-2/3 mb-2" />
          <Skeleton className="h-4 w-1/3" />
        </Card>
      ))}
    </div>
  );
}

export function MyTicketsPage() {
  const { tickets, setTickets, loading, error } = useTickets();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();

  const onStream = useCallback(
    (streamed: Ticket[]) => {
      setTickets((prev) => {
        if (JSON.stringify(prev) === JSON.stringify(streamed)) return prev;
        return streamed;
      });
    },
    [setTickets],
  );

  useTicketStream(onStream);

  const filtered = useMemo(() => {
    if (!statusFilter) return tickets;
    return tickets.filter((t) => t.status === statusFilter);
  }, [tickets, statusFilter]);

  if (loading) {
    return (
      <div>
        <PageHeader title="My Tickets" description="Support conversations with BookLeaf" />
        <TicketListSkeleton />
      </div>
    );
  }

  if (error) return <ErrorAlert message={error} />;

  return (
    <div>
      <PageHeader
        title="My Tickets"
        description={`${tickets.length} ticket${tickets.length === 1 ? "" : "s"}`}
        action={
          <Link href="/author/tickets/new">
            <Button>
              <PlusCircle />
              Submit Ticket
            </Button>
          </Link>
        }
      />

      {tickets.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setStatusFilter(undefined)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              !statusFilter ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80",
            )}
          >
            All
          </button>
          {TICKET_STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                statusFilter === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80",
              )}
            >
              {TICKET_STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title={tickets.length === 0 ? "No tickets yet" : "No matching tickets"}
          description={
            tickets.length === 0
              ? "Submit a support ticket and our team will get back to you."
              : "Try a different status filter."
          }
          action={
            tickets.length === 0 ? (
              <Link href="/author/tickets/new">
                <Button>
                  <PlusCircle />
                  Submit Ticket
                </Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <TicketList tickets={filtered} />
      )}
    </div>
  );
}
