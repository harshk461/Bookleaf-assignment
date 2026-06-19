import { pgTable, uuid, varchar, boolean, timestamp } from 'drizzle-orm/pg-core';

export const authors = pgTable('authors', {
  id: uuid('id').primaryKey().defaultRandom(),
  authorId: varchar('author_id', { length: 20 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: varchar('role', { length: 20 }).notNull(),
  authorRef: uuid('author_ref').references(() => authors.id),
  name: varchar('name', { length: 255 }).notNull(),
  isActive: boolean('is_active').notNull().default(true),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

export const books = pgTable('books', {
  id: uuid('id').primaryKey().defaultRandom(),
  bookId: varchar('book_id', { length: 20 }).notNull().unique(),
  authorRef: uuid('author_ref').notNull().references(() => authors.id),
  title: varchar('title', { length: 500 }).notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

export const tickets = pgTable('tickets', {
  id: uuid('id').primaryKey().defaultRandom(),
  ticketNumber: varchar('ticket_number', { length: 20 }).notNull().unique(),
  authorRef: uuid('author_ref').notNull().references(() => authors.id),
  bookRef: uuid('book_ref').references(() => books.id),
  subject: varchar('subject', { length: 500 }).notNull(),
  status: varchar('status', { length: 20 }).notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});
