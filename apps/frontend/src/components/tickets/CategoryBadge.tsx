import type { TicketCategory } from "@bookleaf/shared";
import { Badge } from "@/components/ui/badge";
import { ticketCategoryLabel } from "./badge-variants";

export function CategoryBadge({ category }: { category: TicketCategory }) {
  return <Badge variant="outline">{ticketCategoryLabel(category)}</Badge>;
}
