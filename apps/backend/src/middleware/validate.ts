import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { AppError } from '../utils/errors.js';

export function validateBody<T extends z.ZodType>(schema: T) {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError(400, parsed.error.errors[0]?.message ?? 'Invalid request body');
    }
    (request as FastifyRequest & { validatedBody: z.infer<T> }).validatedBody = parsed.data;
  };
}

export function validateQuery<T extends z.ZodType>(schema: T) {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    const parsed = schema.safeParse(request.query);
    if (!parsed.success) {
      throw new AppError(400, parsed.error.errors[0]?.message ?? 'Invalid query');
    }
    (request as FastifyRequest & { validatedQuery: z.infer<T> }).validatedQuery = parsed.data;
  };
}
