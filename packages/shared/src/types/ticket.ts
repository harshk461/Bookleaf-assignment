import type { TicketCategory } from '../enums/ticket-category';
import type { TicketPriority } from '../enums/ticket-priority';
import type { TicketStatus } from '../enums/ticket-status';

export interface TicketMessage {
  id: string;
  senderType: 'author' | 'admin';
  content: string;
  createdAt: string;
  isInitial?: boolean;
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  bookId: string | null;
  bookTitle?: string | null;
  subject: string;
  description: string;
  status: TicketStatus;
  category: TicketCategory | null;
  priority: TicketPriority | null;
  aiClassificationFailed?: boolean;
  assignedAdminName?: string | null;
  createdAt: string;
  updatedAt: string;
  messages?: TicketMessage[];
}

export interface CreateTicketInput {
  bookId: string | null;
  subject: string;
  description: string;
}
