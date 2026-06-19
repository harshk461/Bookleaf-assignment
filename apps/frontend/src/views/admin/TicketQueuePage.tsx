"use client";

import { useState } from "react";
import { useTickets } from "@/hooks/useTickets";
import { TicketFilters } from "@/components/admin/TicketFilters";
import { TicketList } from "@/components/tickets/TicketList";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorAlert } from "@/components/common/ErrorAlert";

export function TicketQueuePage() {
  const [filters, setFilters] = useState<{ status?: string; category?: string; priority?: string }>({});
  const { tickets, loading, error, refresh } = useTickets(true);

  function handleFilterChange(values: typeof filters) {
    setFilters(values);
    void refresh(values);
  }

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error} />;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Ticket Queue</h1>
      <TicketFilters values={filters} onChange={handleFilterChange} />
      <TicketList tickets={tickets} admin />
    </div>
  );
}
