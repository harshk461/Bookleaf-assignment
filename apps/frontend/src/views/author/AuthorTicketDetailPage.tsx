"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { TicketThread } from "@/components/tickets/TicketThread";
import { MessageComposer } from "@/components/tickets/MessageComposer";
import { TicketAttachments } from "@/components/tickets/TicketAttachments";
import { TicketStatusBadge } from "@/components/tickets/TicketStatusBadge";
import { CategoryBadge } from "@/components/tickets/CategoryBadge";
import { PriorityBadge } from "@/components/tickets/PriorityBadge";
import { PageHeader } from "@/components/layout/PageHeader";
import { ErrorAlert } from "@/components/common/ErrorAlert";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTicketDetailPolling } from "@/hooks/useTicketDetailPolling";
import * as ticketsService from "@/services/tickets.service";
import type { Ticket } from "@bookleaf/shared";

export function AuthorTicketDetailPage({ ticketId }: { ticketId: string }) {
  const router = useRouter();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const t = await ticketsService.fetchTicket(ticketId);
        setTicket(t);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load ticket");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [ticketId]);

  const onPollUpdate = useCallback((updated: Ticket) => {
    setTicket(updated);
  }, []);

  useTicketDetailPolling({ ticketId, role: "author", onUpdate: onPollUpdate });

  async function handleSendReply() {
    if (!reply.trim()) return;
    setSending(true);
    try {
      const updated = await ticketsService.sendAuthorMessage(ticketId, reply.trim());
      setTicket(updated);
      setReply("");
      toast.success("Message sent");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !ticket) return <ErrorAlert message={error ?? "Ticket not found"} />;

  const isClosed = ticket.status === "closed";

  return (
    <div className="space-y-6">
      <PageHeader
        title={ticket.subject}
        description={`${ticket.ticketNumber}${ticket.bookTitle ? ` · ${ticket.bookTitle}` : ""}`}
        breadcrumbs={[
          { label: "My Tickets", href: "/author/tickets" },
          { label: ticket.ticketNumber },
        ]}
      />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Status</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <TicketStatusBadge status={ticket.status} />
          {ticket.category && <CategoryBadge category={ticket.category} />}
          {ticket.priority && <PriorityBadge priority={ticket.priority} />}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conversation</CardTitle>
        </CardHeader>
        <CardContent>
          <TicketThread messages={ticket.messages ?? []} viewer="author" />
          {ticket.attachments && ticket.attachments.length > 0 && (
            <div className="mt-4">
              <TicketAttachments ticketId={ticketId} attachments={ticket.attachments} />
            </div>
          )}
          <MessageComposer
            value={reply}
            onChange={setReply}
            onSend={handleSendReply}
            sending={sending}
            disabled={isClosed}
            disabledReason={isClosed ? "This ticket is closed. You cannot send new messages." : undefined}
            placeholder="Reply to BookLeaf Support..."
          />
        </CardContent>
      </Card>

      <button
        type="button"
        onClick={() => router.back()}
        className="text-sm text-primary hover:underline"
      >
        ← Back to my tickets
      </button>
    </div>
  );
}
