"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useBooks } from "@/hooks/useBooks";
import { TicketForm } from "@/components/tickets/TicketForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { ErrorAlert } from "@/components/common/ErrorAlert";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import * as ticketsService from "@/services/tickets.service";

export function SubmitTicketPage() {
  const router = useRouter();
  const { books, loading, error } = useBooks();

  if (loading) {
    return (
      <div>
        <PageHeader title="Submit Ticket" description="Tell us how we can help" />
        <Card className="max-w-xl p-6 space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full" />
        </Card>
      </div>
    );
  }

  if (error) return <ErrorAlert message={error} />;

  return (
    <div>
      <PageHeader
        title="Submit Ticket"
        description="Our team typically responds within 1–2 business days"
        breadcrumbs={[
          { label: "My Tickets", href: "/author/tickets" },
          { label: "New Ticket" },
        ]}
      />
      <TicketForm
        books={books}
        onSubmit={async (data) => {
          const ticket = await ticketsService.createTicket(data);
          toast.success("Ticket submitted successfully");
          router.push(`/author/tickets/${ticket.id}`);
        }}
      />
    </div>
  );
}
