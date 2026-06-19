import type { TicketStatus } from "@bookleaf/shared";
import { Badge } from "@/components/ui/badge";
import { ticketStatusLabel, ticketStatusVariant } from "./badge-variants";

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  return <Badge variant={ticketStatusVariant(status)}>{ticketStatusLabel(status)}</Badge>;
}
