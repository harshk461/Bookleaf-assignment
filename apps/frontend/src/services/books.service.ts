import type { Book } from "@bookleaf/shared";
import { API_PATHS } from "@bookleaf/shared";
import { api } from "./api";

export async function fetchBooks() {
  return api<Book[]>(API_PATHS.author.books);
}

export async function fetchBook(bookId: string) {
  return api<Book>(API_PATHS.author.book(bookId));
}
