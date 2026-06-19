"use client";

import { API_PATHS } from "@bookleaf/shared";
import type { Ticket } from "@bookleaf/shared";
import { buildSseUrl, useSseStream } from "./useSseStream";

function filtersToQuery(filters?: Record<string, string | undefined>): string {
  if (!filters) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function useTicketStream(onUpdate: (tickets: Ticket[]) => void) {
  const url = buildSseUrl(API_PATHS.author.ticketStream);
  useSseStream<Ticket[]>(url, "tickets", onUpdate);
}

export function useAuthorTicketDetailStream(
  ticketId: string,
  onUpdate: (ticket: Ticket) => void,
) {
  const url = buildSseUrl(API_PATHS.author.ticketStreamDetail(ticketId));
  useSseStream<Ticket>(url, "ticket", onUpdate);
}

export function useAdminTicketStream(
  onUpdate: (tickets: Ticket[]) => void,
  filters?: Record<string, string | undefined>,
) {
  const filterQuery = filtersToQuery(filters);
  const url = buildSseUrl(`${API_PATHS.admin.ticketStream}${filterQuery}`);
  useSseStream<Ticket[]>(url, "tickets", onUpdate);
}
