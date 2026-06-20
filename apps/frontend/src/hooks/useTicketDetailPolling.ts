"use client";

import { useEffect } from "react";
import * as ticketsService from "@/services/tickets.service";
import type { Ticket } from "@bookleaf/shared";

export const TICKET_DETAIL_POLL_MS = 3000;

type Role = "author" | "admin";

interface UseTicketDetailPollingOptions {
  ticketId: string;
  role: Role;
  enabled?: boolean;
  onUpdate: (ticket: Ticket & { aiDraft?: string | null }) => void;
}

export function useTicketDetailPolling({
  ticketId,
  role,
  enabled = true,
  onUpdate,
}: UseTicketDetailPollingOptions) {
  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    const poll = async () => {
      if (cancelled || document.visibilityState === "hidden") return;
      try {
        const fetched =
          role === "admin"
            ? await ticketsService.fetchAdminTicket(ticketId)
            : await ticketsService.fetchTicket(ticketId);

        if (!cancelled) onUpdate(fetched);
      } catch {
        /* ignore poll errors */
      }
    };

    void poll();
    const interval = setInterval(poll, TICKET_DETAIL_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [ticketId, role, enabled, onUpdate]);
}
