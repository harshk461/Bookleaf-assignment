"use client";

import { useCallback } from "react";
import { useTickets } from "@/hooks/useTickets";
import { useTicketStream } from "@/hooks/useTicketStream";
import { TicketList } from "@/components/tickets/TicketList";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorAlert } from "@/components/common/ErrorAlert";

export function MyTicketsPage() {
  const { tickets, loading, error, refresh } = useTickets();
  const onStream = useCallback(() => {
    void refresh();
  }, [refresh]);

  useTicketStream(onStream);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error} />;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">My Tickets</h1>
      <TicketList tickets={tickets} />
    </div>
  );
}
