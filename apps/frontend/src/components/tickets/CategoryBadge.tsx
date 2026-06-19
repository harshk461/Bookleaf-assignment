import type { TicketCategory } from "@bookleaf/shared";
import { TICKET_CATEGORY_LABELS } from "@/utils/constants";

export function CategoryBadge({ category }: { category: TicketCategory }) {
  return (
    <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
      {TICKET_CATEGORY_LABELS[category]}
    </span>
  );
}
