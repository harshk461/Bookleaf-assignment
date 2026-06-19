import type { CreateTicketInput, Ticket } from "@bookleaf/shared";
import { API_PATHS } from "@bookleaf/shared";
import { api } from "./api";

export async function fetchTickets() {
  return api<Ticket[]>(API_PATHS.author.tickets);
}

export async function fetchTicket(id: string) {
  return api<Ticket>(API_PATHS.author.ticket(id));
}

export async function createTicket(input: CreateTicketInput) {
  return api<Ticket>(API_PATHS.author.tickets, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function fetchAdminTickets(params?: Record<string, string>) {
  const qs = params ? `?${new URLSearchParams(params)}` : "";
  return api<Ticket[]>(`${API_PATHS.admin.tickets}${qs}`);
}

export async function fetchAdminTicket(id: string) {
  return api<Ticket & { aiDraft?: string }>(API_PATHS.admin.ticket(id));
}

export async function patchAdminTicket(id: string, body: Record<string, unknown>) {
  return api<Ticket>(API_PATHS.admin.ticket(id), {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function sendAdminResponse(id: string, content: string) {
  return api<Ticket>(API_PATHS.admin.ticketResponses(id), {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

export async function fetchNotes(id: string) {
  return api<Array<{ id: string; content: string; adminName: string; createdAt: string }>>(
    API_PATHS.admin.ticketNotes(id),
  );
}

export async function addNote(id: string, content: string) {
  return api<{ id: string; content: string }>(API_PATHS.admin.ticketNotes(id), {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}
