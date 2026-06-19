import { z } from 'zod';

export const TICKET_CATEGORIES = [
  'royalty_payments',
  'isbn_metadata',
  'printing_quality',
  'distribution_availability',
  'book_status_production',
  'general_inquiry',
] as const;

export const TICKET_PRIORITIES = ['critical', 'high', 'medium', 'low'] as const;
export const TICKET_STATUSES = ['open', 'in_progress', 'resolved', 'closed'] as const;

export const ticketCategorySchema = z.enum(TICKET_CATEGORIES);
export const ticketPrioritySchema = z.enum(TICKET_PRIORITIES);
export const ticketStatusSchema = z.enum(TICKET_STATUSES);

export const uuidSchema = z.string().uuid('Invalid ID format');
export const bookIdParamSchema = z.string().min(1, 'bookId is required');
export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD');
