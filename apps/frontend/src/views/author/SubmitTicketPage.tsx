"use client";

import { useRouter } from "next/navigation";
import { useBooks } from "@/hooks/useBooks";
import { TicketForm } from "@/components/tickets/TicketForm";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import * as ticketsService from "@/services/tickets.service";

export function SubmitTicketPage() {
  const { books, loading } = useBooks();
  const router = useRouter();

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Submit Support Query</h1>
      <TicketForm
        books={books}
        onSubmit={async (data) => {
          await ticketsService.createTicket(data);
          router.push("/author/tickets");
        }}
      />
    </div>
  );
}
