"use client";

import { useCallback, useMemo, useState } from "react";
import { Inbox } from "lucide-react";
import type { Ticket } from "@bookleaf/shared";
import { useTickets } from "@/hooks/useTickets";
import { useAdminTicketStream } from "@/hooks/useTicketStream";
import { TicketFilters, type TicketFilterValues } from "@/components/admin/TicketFilters";
import { TicketList } from "@/components/tickets/TicketList";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorAlert } from "@/components/common/ErrorAlert";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

function TicketListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i} className="p-4">
          <Skeleton className="h-5 w-2/3 mb-2" />
          <Skeleton className="h-4 w-1/3" />
        </Card>
      ))}
    </div>
  );
}

export function TicketQueuePage() {
  const [filters, setFilters] = useState<TicketFilterValues>({});
  const { tickets, setTickets, loading, error, refresh } = useTickets(true);

  const onStream = useCallback(
    (streamed: Ticket[]) => {
      setTickets((prev) => {
        if (JSON.stringify(prev) === JSON.stringify(streamed)) return prev;
        return streamed;
      });
    },
    [setTickets],
  );

  useAdminTicketStream(onStream, filters);

  const openCount = useMemo(
    () => tickets.filter((t) => t.status === "open" || t.status === "in_progress").length,
    [tickets],
  );

  function handleFilterChange(values: TicketFilterValues) {
    setFilters(values);
    void refresh(values as Record<string, string | undefined>);
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="Ticket Queue" description="Manage author support requests" />
        <Skeleton className="h-24 w-full mb-4 rounded-xl" />
        <TicketListSkeleton />
      </div>
    );
  }

  if (error) return <ErrorAlert message={error} />;

  return (
    <div>
      <PageHeader
        title="Ticket Queue"
        description={`${openCount} open · ${tickets.length} total`}
      />
      <TicketFilters values={filters} onChange={handleFilterChange} />

      {tickets.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Queue is empty"
          description="No tickets match your filters. New author requests will appear here."
        />
      ) : (
        <TicketList tickets={tickets} admin />
      )}
    </div>
  );
}
