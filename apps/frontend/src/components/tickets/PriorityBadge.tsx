import type { TicketPriority } from "@bookleaf/shared";
import { Badge } from "@/components/ui/badge";
import { ticketPriorityLabel, ticketPriorityVariant } from "./badge-variants";

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  return <Badge variant={ticketPriorityVariant(priority)}>{ticketPriorityLabel(priority)}</Badge>;
}
