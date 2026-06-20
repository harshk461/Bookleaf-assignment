import type { CreateTicketInput, Ticket } from "@bookleaf/shared";
import { API_PATHS } from "@bookleaf/shared";
import { api, API_URL } from "./api";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("bookleaf_token");
}

export async function fetchTickets() {
  return api<Ticket[]>(API_PATHS.author.tickets);
}

export async function fetchTicket(id: string) {
  return api<Ticket>(API_PATHS.author.ticket(id));
}

export async function sendAuthorMessage(id: string, content: string) {
  return api<Ticket>(API_PATHS.author.ticketMessages(id), {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

export async function createTicket(
  input: CreateTicketInput & { file?: File | null },
) {
  const token = getToken();
  if (input.file) {
    const form = new FormData();
    form.append("bookId", input.bookId ?? "");
    form.append("subject", input.subject);
    form.append("description", input.description);
    form.append("file", input.file);

    const res = await fetch(`${API_URL}${API_PATHS.author.tickets}`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error((body as { error?: string }).error ?? res.statusText);
    }
    return res.json() as Promise<Ticket>;
  }

  return api<Ticket>(API_PATHS.author.tickets, {
    method: "POST",
    body: JSON.stringify({
      bookId: input.bookId,
      subject: input.subject,
      description: input.description,
    }),
  });
}

export async function fetchAdminTickets(params?: Record<string, string>) {
  const qs = params ? `?${new URLSearchParams(params)}` : "";
  return api<Ticket[]>(`${API_PATHS.admin.tickets}${qs}`);
}

export async function fetchAdminTicket(id: string) {
  return api<Ticket & { aiDraft?: string | null }>(API_PATHS.admin.ticket(id));
}

export async function generateAdminDraft(id: string) {
  return api<{ aiDraft: string; aiDraftFailed?: boolean }>(API_PATHS.admin.ticketDraft(id), {
    method: "POST",
  });
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
