"use client";

import { useCallback, useEffect, useState } from "react";
import type { Ticket } from "@bookleaf/shared";
import * as ticketsService from "@/services/tickets.service";

export function useTickets(admin = false) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(
    async (filters?: Record<string, string | undefined>) => {
      setLoading(true);
      setError(null);
      try {
        const params = filters
          ? Object.fromEntries(
              Object.entries(filters).filter(([, v]) => v !== undefined && v !== ""),
            ) as Record<string, string>
          : undefined;
        const data = admin
          ? await ticketsService.fetchAdminTickets(params)
          : await ticketsService.fetchTickets();
        setTickets(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load tickets");
      } finally {
        setLoading(false);
      }
    },
    [admin],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { tickets, setTickets, loading, error, refresh };
}
