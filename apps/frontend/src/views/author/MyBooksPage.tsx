"use client";

import { useBooks } from "@/hooks/useBooks";
import { BookCard } from "@/components/books/BookCard";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorAlert } from "@/components/common/ErrorAlert";

export function MyBooksPage() {
  const { books, loading, error } = useBooks();

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error} />;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">My Books</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {books.map((book) => (
          <BookCard key={book.bookId} book={book} />
        ))}
      </div>
    </div>
  );
}
