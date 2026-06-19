import type { FastifyRequest } from 'fastify';

export interface JwtUser {
  sub: string;
  email: string;
  role: 'author' | 'admin';
  authorRef?: string | null;
  name: string;
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtUser;
    user: JwtUser;
  }
}

declare module 'fastify' {
  interface FastifyRequest {
    user: JwtUser;
  }
}

export function getUser(request: FastifyRequest): JwtUser {
  return request.user;
}
