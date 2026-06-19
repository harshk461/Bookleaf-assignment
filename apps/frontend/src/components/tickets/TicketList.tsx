import type { Ticket } from "@bookleaf/shared";
import Link from "next/link";
import { TicketStatusBadge } from "./TicketStatusBadge";
import { CategoryBadge } from "./CategoryBadge";
import { PriorityBadge } from "./PriorityBadge";
import { formatDate } from "@/utils/formatDate";

interface TicketListProps {
  tickets: Ticket[];
  admin?: boolean;
}

export function TicketList({ tickets, admin = false }: TicketListProps) {
  if (!tickets.length) {
    return <p className="text-sm text-slate-500">No tickets yet.</p>;
  }

  return (
    <ul className="space-y-3">
      {tickets.map((ticket) => (
        <li key={ticket.id} className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              {admin ? (
                <Link href={`/admin/tickets/${ticket.id}`} className="font-medium text-emerald-800 hover:underline">
                  {ticket.subject}
                </Link>
              ) : (
                <h3 className="font-medium">{ticket.subject}</h3>
              )}
              <p className="text-sm text-slate-500">
                {ticket.ticketNumber} · {formatDate(ticket.createdAt)}
                {ticket.bookTitle ? ` · ${ticket.bookTitle}` : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <TicketStatusBadge status={ticket.status} />
              {ticket.category && <CategoryBadge category={ticket.category} />}
              {ticket.priority && <PriorityBadge priority={ticket.priority} />}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
