import bcrypt from 'bcryptjs';
import { findUserByEmail, findUserById } from '../repositories/authors.repository.js';
import { UnauthorizedError } from '../utils/errors.js';

export async function login(email: string, password: string) {
  const user = await findUserByEmail(email);
  if (!user) throw new UnauthorizedError('Invalid credentials');

  const valid = await bcrypt.compare(password, user.password_hash as string);
  if (!valid) throw new UnauthorizedError('Invalid credentials');

  return {
    id: user.id as string,
    email: user.email as string,
    name: user.name as string,
    role: user.role as 'author' | 'admin',
    authorRef: (user.author_ref as string | null) ?? null,
    authorId: (user.author_id as string | undefined) ?? undefined,
  };
}

export async function getProfile(userId: string) {
  const user = await findUserById(userId);
  if (!user) throw new UnauthorizedError('User not found');
  return {
    id: user.id as string,
    email: user.email as string,
    name: user.name as string,
    role: user.role as 'author' | 'admin',
    authorRef: (user.author_ref as string | null) ?? null,
    authorId: (user.author_id as string | undefined) ?? undefined,
  };
}
