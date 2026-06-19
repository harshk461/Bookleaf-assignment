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

export interface TicketAttachment {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
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
  aiCategory?: TicketCategory | null;
  aiPriority?: TicketPriority | null;
  categoryOverridden?: boolean;
  priorityOverridden?: boolean;
  aiClassificationFailed?: boolean;
  assignedAdminName?: string | null;
  authorName?: string | null;
  createdAt: string;
  updatedAt: string;
  messages?: TicketMessage[];
  attachments?: TicketAttachment[];
}

export interface CreateTicketInput {
  bookId: string | null;
  subject: string;
  description: string;
}
