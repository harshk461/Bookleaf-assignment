import type { TicketStatus } from "@bookleaf/shared";
import { TICKET_STATUS_LABELS } from "@/utils/constants";

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
      {TICKET_STATUS_LABELS[status]}
    </span>
  );
}
