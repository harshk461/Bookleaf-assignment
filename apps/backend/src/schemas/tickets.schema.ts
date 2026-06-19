import { z } from 'zod';
import {
  isoDateSchema,
  ticketCategorySchema,
  ticketPrioritySchema,
  ticketStatusSchema,
  uuidSchema,
} from './common.js';

export const ticketIdParamsSchema = z.object({
  id: uuidSchema,
});

export const attachmentIdParamsSchema = ticketIdParamsSchema.extend({
  attachmentId: uuidSchema,
});

export const createTicketBodySchema = z.object({
  bookId: z.string().nullable(),
  subject: z.string().min(1, 'Subject is required').max(500),
  description: z.string().min(1, 'Description is required').max(10000),
});

export const adminTicketsQuerySchema = z.object({
  status: ticketStatusSchema.optional(),
  category: ticketCategorySchema.optional(),
  priority: ticketPrioritySchema.optional(),
  from: isoDateSchema.optional(),
  to: isoDateSchema.optional(),
});

export const patchTicketBodySchema = z
  .object({
    status: ticketStatusSchema.optional(),
    category: ticketCategorySchema.optional(),
    priority: ticketPrioritySchema.optional(),
    assigned_admin_ref: uuidSchema.nullable().optional(),
    category_overridden: z.boolean().optional(),
    priority_overridden: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required',
  });

export const messageBodySchema = z.object({
  content: z.string().min(1, 'Content is required').max(10000),
});
