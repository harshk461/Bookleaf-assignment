import type { FastifyReply, FastifyRequest } from 'fastify';
import * as authService from '../services/auth.service.js';
import type { z } from 'zod';
import type { loginBodySchema } from '../schemas/auth.schema.js';

type LoginBody = z.infer<typeof loginBodySchema>;

export async function login(request: FastifyRequest, reply: FastifyReply) {
  const { email, password } = request.validatedBody as LoginBody;
  const user = await authService.login(email, password);
  const token = await reply.jwtSign({
    sub: user.id,
    email: user.email,
    role: user.role,
    authorRef: user.authorRef,
    name: user.name,
  });
  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      authorId: user.authorId,
    },
  };
}

export async function me(request: FastifyRequest) {
  const profile = await authService.getProfile(request.user.sub);
  return {
    id: profile.id,
    email: profile.email,
    name: profile.name,
    role: profile.role,
    authorId: profile.authorId,
  };
}

export async function logout() {
  return { ok: true };
}
