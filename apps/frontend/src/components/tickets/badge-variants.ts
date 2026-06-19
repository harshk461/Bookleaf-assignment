import type { TicketCategory, TicketPriority, TicketStatus } from "@bookleaf/shared";
import {
  TICKET_CATEGORY_LABELS,
  TICKET_PRIORITY_LABELS,
  TICKET_STATUS_LABELS,
} from "@/utils/constants";

export function ticketStatusLabel(status: TicketStatus): string {
  return TICKET_STATUS_LABELS[status];
}

export function ticketStatusVariant(status: TicketStatus): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "open":
      return "default";
    case "in_progress":
      return "secondary";
    case "resolved":
      return "outline";
    case "closed":
      return "outline";
    default:
      return "secondary";
  }
}

export function ticketCategoryLabel(category: TicketCategory): string {
  return TICKET_CATEGORY_LABELS[category];
}

export function ticketPriorityLabel(priority: TicketPriority): string {
  return TICKET_PRIORITY_LABELS[priority];
}

export function ticketPriorityVariant(priority: TicketPriority): "default" | "secondary" | "destructive" | "outline" {
  switch (priority) {
    case "critical":
      return "destructive";
    case "high":
      return "default";
    case "medium":
      return "secondary";
    case "low":
      return "outline";
    default:
      return "secondary";
  }
}

export function payoutStatusVariant(status: string): "default" | "secondary" | "outline" {
  switch (status) {
    case "paid":
      return "default";
    case "pending":
    case "rolled_over":
      return "secondary";
    default:
      return "outline";
  }
}
