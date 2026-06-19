import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { AppError } from '../utils/errors.js';

function attachValidated<T>(
  request: FastifyRequest,
  key: 'validatedBody' | 'validatedQuery' | 'validatedParams',
  schema: z.ZodType<T>,
  data: unknown,
) {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    throw new AppError(400, parsed.error.errors[0]?.message ?? 'Validation failed');
  }
  (request as FastifyRequest & Record<string, unknown>)[key] = parsed.data;
}

export function validateBody<T extends z.ZodType>(schema: T) {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    attachValidated(request, 'validatedBody', schema, request.body);
  };
}

export function validateQuery<T extends z.ZodType>(schema: T) {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    attachValidated(request, 'validatedQuery', schema, request.query);
  };
}

export function validateParams<T extends z.ZodType>(schema: T) {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    attachValidated(request, 'validatedParams', schema, request.params);
  };
}
