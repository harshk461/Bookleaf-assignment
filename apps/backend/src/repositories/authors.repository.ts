import { getDb } from '../db/index.js';

export async function findUserByEmail(email: string) {
  return getDb().queryOne(
    `SELECT u.id, u.email, u.password_hash, u.role, u.author_ref, u.name, a.author_id
     FROM users u
     LEFT JOIN authors a ON a.id = u.author_ref
     WHERE u.email = $1 AND u.is_active = TRUE AND u.deleted_at IS NULL`,
    [email],
  );
}

export async function findUserById(id: string) {
  return getDb().queryOne(
    `SELECT u.id, u.email, u.role, u.author_ref, u.name, a.author_id
     FROM users u
     LEFT JOIN authors a ON a.id = u.author_ref
     WHERE u.id = $1 AND u.is_active = TRUE AND u.deleted_at IS NULL`,
    [id],
  );
}
