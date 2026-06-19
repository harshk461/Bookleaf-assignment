import type { TicketPriority } from "@bookleaf/shared";
import { TICKET_PRIORITY_LABELS } from "@/utils/constants";

const colors: Record<TicketPriority, string> = {
  critical: "bg-red-100 text-red-800",
  high: "bg-orange-100 text-orange-800",
  medium: "bg-yellow-100 text-yellow-800",
  low: "bg-slate-100 text-slate-700",
};

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  return (
    <span className={`rounded-full px-2 py-1 text-xs font-medium ${colors[priority]}`}>
      {TICKET_PRIORITY_LABELS[priority]}
    </span>
  );
}
