"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AiDraftEditor } from "@/components/admin/AiDraftEditor";
import { InternalNotesPanel } from "@/components/admin/InternalNotesPanel";
import { TicketThread } from "@/components/tickets/TicketThread";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorAlert } from "@/components/common/ErrorAlert";
import * as ticketsService from "@/services/tickets.service";
import type { Ticket } from "@bookleaf/shared";

export function TicketDetailPage({ ticketId }: { ticketId: string }) {
  const router = useRouter();
  const [ticket, setTicket] = useState<(Ticket & { aiDraft?: string }) | null>(null);
  const [notes, setNotes] = useState<Array<{ id: string; content: string; adminName: string; createdAt: string }>>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [t, n] = await Promise.all([
          ticketsService.fetchAdminTicket(ticketId),
          ticketsService.fetchNotes(ticketId),
        ]);
        setTicket(t);
        setDraft(t.aiDraft ?? "");
        setNotes(n);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load ticket");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [ticketId]);

  if (loading) return <LoadingSpinner />;
  if (error || !ticket) return <ErrorAlert message={error ?? "Ticket not found"} />;

  return (
    <div className="space-y-6">
      <button type="button" onClick={() => router.back()} className="text-sm text-emerald-700 hover:underline">
        ← Back to queue
      </button>
      <div>
        <h1 className="text-2xl font-semibold">{ticket.subject}</h1>
        <p className="text-sm text-slate-500">{ticket.ticketNumber}</p>
      </div>
      <TicketThread messages={ticket.messages ?? []} />
      <AiDraftEditor
        value={draft}
        onChange={setDraft}
        sending={sending}
        onSend={async () => {
          setSending(true);
          try {
            const updated = await ticketsService.sendAdminResponse(ticketId, draft);
            setTicket(updated);
          } finally {
            setSending(false);
          }
        }}
      />
      <InternalNotesPanel
        notes={notes}
        onAdd={async (content) => {
          await ticketsService.addNote(ticketId, content);
          const n = await ticketsService.fetchNotes(ticketId);
          setNotes(n);
        }}
      />
    </div>
  );
}
