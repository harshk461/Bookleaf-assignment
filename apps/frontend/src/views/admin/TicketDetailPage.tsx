"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AiDraftEditor } from "@/components/admin/AiDraftEditor";
import { AssigneeSelect, CategorySelect, PrioritySelect, StatusSelect } from "@/components/admin/AssigneeSelect";
import { InternalNotesPanel } from "@/components/admin/InternalNotesPanel";
import { TicketThread } from "@/components/tickets/TicketThread";
import { TicketAttachments } from "@/components/tickets/TicketAttachments";
import { TicketStatusBadge } from "@/components/tickets/TicketStatusBadge";
import { CategoryBadge } from "@/components/tickets/CategoryBadge";
import { PriorityBadge } from "@/components/tickets/PriorityBadge";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/PageHeader";
import { ErrorAlert } from "@/components/common/ErrorAlert";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import * as ticketsService from "@/services/tickets.service";
import type { Ticket } from "@bookleaf/shared";

export function TicketDetailPage({ ticketId }: { ticketId: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<(Ticket & { aiDraft?: string | null }) | null>(null);
  const [notes, setNotes] = useState<Array<{ id: string; content: string; adminName: string; createdAt: string }>>([]);
  const [draft, setDraft] = useState("");
  const [assignee, setAssignee] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const t = await ticketsService.fetchAdminTicket(ticketId);
        setTicket(t);
        setDraft(t.aiDraft ?? "");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load ticket");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [ticketId]);

  useEffect(() => {
    async function loadNotes() {
      try {
        const n = await ticketsService.fetchNotes(ticketId);
        setNotes(n);
      } catch {
        // Notes are optional
      }
    }
    void loadNotes();
  }, [ticketId]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const t = await ticketsService.fetchAdminTicket(ticketId);
        setTicket((prev) =>
          prev
            ? {
                ...t,
                aiDraft: prev.aiDraft,
              }
            : t,
        );
      } catch {
        /* ignore poll errors */
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [ticketId]);

  async function handleStatusChange(status: string) {
    try {
      const updated = await ticketsService.patchAdminTicket(ticketId, { status });
      setTicket((prev) => (prev ? { ...prev, ...updated, aiDraft: prev.aiDraft } : updated));
      toast.success("Status updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    }
  }

  async function handleAssigneeChange(value: string) {
    setAssignee(value);
    try {
      const assigned_admin_ref = value === "self" ? user?.id : null;
      const updated = await ticketsService.patchAdminTicket(ticketId, { assigned_admin_ref });
      setTicket((prev) => (prev ? { ...prev, ...updated, aiDraft: prev.aiDraft } : updated));
      toast.success(value ? "Ticket assigned" : "Ticket unassigned");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update assignee");
    }
  }

  async function handleCategoryChange(category: string) {
    try {
      const updated = await ticketsService.patchAdminTicket(ticketId, { category });
      setTicket((prev) => (prev ? { ...prev, ...updated, aiDraft: prev.aiDraft } : updated));
      toast.success("Category updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update category");
    }
  }

  async function handlePriorityChange(priority: string) {
    try {
      const updated = await ticketsService.patchAdminTicket(ticketId, { priority });
      setTicket((prev) => (prev ? { ...prev, ...updated, aiDraft: prev.aiDraft } : updated));
      toast.success("Priority updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update priority");
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-96 lg:col-span-2 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !ticket) return <ErrorAlert message={error ?? "Ticket not found"} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={ticket.subject}
        description={`${ticket.ticketNumber}${ticket.authorName ? ` · ${ticket.authorName}` : ""}`}
        breadcrumbs={[
          { label: "Ticket Queue", href: "/admin/tickets" },
          { label: ticket.ticketNumber },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Conversation</CardTitle>
            </CardHeader>
            <CardContent>
              {!ticket.messages?.length && ticket.description && (
                <div className="mb-4 rounded-lg bg-muted p-3 text-sm">
                  <div className="mb-1 text-xs font-medium text-muted-foreground">Original request</div>
                  <p className="whitespace-pre-wrap">{ticket.description}</p>
                </div>
              )}
              <TicketThread messages={ticket.messages ?? []} />
              {ticket.attachments && ticket.attachments.length > 0 && (
                <div className="mt-4">
                  <TicketAttachments
                    ticketId={ticketId}
                    attachments={ticket.attachments}
                    admin
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <AiDraftEditor
            value={draft}
            onChange={setDraft}
            sending={sending}
            generating={generating}
            hasDraft={Boolean(draft)}
            onGenerate={async () => {
              setGenerating(true);
              try {
                const result = await ticketsService.generateAdminDraft(ticketId);
                setDraft(result.aiDraft);
                toast.success(result.aiDraftFailed ? "Fallback draft loaded" : "Draft generated");
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Failed to generate draft");
              } finally {
                setGenerating(false);
              }
            }}
            onSend={async () => {
              setSending(true);
              try {
                const updated = await ticketsService.sendAdminResponse(ticketId, draft);
                setTicket((prev) => ({ ...updated, aiDraft: prev?.aiDraft }));
                toast.success("Response sent to author");
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Failed to send response");
              } finally {
                setSending(false);
              }
            }}
          />
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Ticket Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <StatusSelect value={ticket.status} onChange={handleStatusChange} />
              <CategorySelect
                value={ticket.category}
                onChange={handleCategoryChange}
              />
              <PrioritySelect
                value={ticket.priority}
                onChange={handlePriorityChange}
              />
              <AssigneeSelect value={assignee} onChange={handleAssigneeChange} />
              <div className="flex flex-wrap gap-2">
                <TicketStatusBadge status={ticket.status} />
                {ticket.category && <CategoryBadge category={ticket.category} />}
                {ticket.priority && <PriorityBadge priority={ticket.priority} />}
                {ticket.categoryOverridden && (
                  <Badge variant="outline" className="text-xs">Category overridden</Badge>
                )}
                {ticket.priorityOverridden && (
                  <Badge variant="outline" className="text-xs">Priority overridden</Badge>
                )}
              </div>
              {ticket.aiCategory && ticket.categoryOverridden && ticket.aiCategory !== ticket.category && (
                <p className="text-xs text-muted-foreground">
                  AI suggested: {ticket.aiCategory.replace(/_/g, " ")}
                </p>
              )}
              {ticket.aiPriority && ticket.priorityOverridden && ticket.aiPriority !== ticket.priority && (
                <p className="text-xs text-muted-foreground">
                  AI suggested priority: {ticket.aiPriority}
                </p>
              )}
              {ticket.assignedAdminName && (
                <p className="text-sm text-muted-foreground">
                  Assigned to: <span className="text-foreground font-medium">{ticket.assignedAdminName}</span>
                </p>
              )}
              {ticket.bookTitle && (
                <p className="text-sm text-muted-foreground">
                  Book: <span className="text-foreground">{ticket.bookTitle}</span>
                </p>
              )}
            </CardContent>
          </Card>

          <InternalNotesPanel
            notes={notes}
            onAdd={async (content) => {
              try {
                await ticketsService.addNote(ticketId, content);
                const n = await ticketsService.fetchNotes(ticketId);
                setNotes(n);
                toast.success("Note added");
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Failed to add note");
              }
            }}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={() => router.back()}
        className="text-sm text-primary hover:underline"
      >
        ← Back to queue
      </button>
    </div>
  );
}
