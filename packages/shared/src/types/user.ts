export type UserRole = 'author' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  authorId?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
