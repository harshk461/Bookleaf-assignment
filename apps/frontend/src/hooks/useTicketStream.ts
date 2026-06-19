"use client";

import { useEffect } from "react";
import { API_PATHS } from "@bookleaf/shared";
import { API_URL } from "@/services/api";
import type { Ticket } from "@bookleaf/shared";

export function useTicketStream(onUpdate: (tickets: Ticket[]) => void) {
  useEffect(() => {
    const token = localStorage.getItem("bookleaf_token");
    if (!token) return;

    const source = new EventSource(
      `${API_URL}${API_PATHS.author.ticketStream}?token=${encodeURIComponent(token)}`,
    );

    // Note: EventSource cannot send Authorization header; backend should also accept cookie/query in production.
    // For assignment scaffold, polling fallback is used via useTickets refresh.
    source.addEventListener("tickets", (event) => {
      try {
        onUpdate(JSON.parse((event as MessageEvent).data) as Ticket[]);
      } catch {
        /* ignore parse errors */
      }
    });

    source.onerror = () => source.close();
    return () => source.close();
  }, [onUpdate]);
}
