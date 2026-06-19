"use client";

import { useMemo } from "react";
import { BookOpen, IndianRupee, Library } from "lucide-react";
import { useBooks } from "@/hooks/useBooks";
import { BookCard } from "@/components/books/BookCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorAlert } from "@/components/common/ErrorAlert";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/utils/formatCurrency";

function BookGridSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="p-4 space-y-3">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-8" />
            <Skeleton className="h-8" />
            <Skeleton className="h-8" />
            <Skeleton className="h-8" />
          </div>
        </Card>
      ))}
    </div>
  );
}

export function MyBooksPage() {
  const { books, loading, error } = useBooks();

  const stats = useMemo(() => {
    return books.reduce(
      (acc, b) => ({
        earned: acc.earned + b.totalRoyaltyEarned,
        pending: acc.pending + b.royaltyPending,
      }),
      { earned: 0, pending: 0 },
    );
  }, [books]);

  if (loading) {
    return (
      <div>
        <PageHeader title="My Books" description="Your published catalogue and royalties" />
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <BookGridSkeleton />
      </div>
    );
  }

  if (error) return <ErrorAlert message={error} />;

  return (
    <div>
      <PageHeader
        title="My Books"
        description={`${books.length} book${books.length === 1 ? "" : "s"} in your catalogue`}
      />

      {books.length > 0 && (
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <StatCard label="Total Books" value={String(books.length)} icon={Library} />
          <StatCard label="Total Earned" value={formatCurrency(stats.earned)} icon={IndianRupee} accent="primary" />
          <StatCard label="Total Pending" value={formatCurrency(stats.pending)} icon={BookOpen} accent="accent" />
        </div>
      )}

      {books.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No books yet"
          description="Your published books will appear here once they are added to your account."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {books.map((book) => (
            <BookCard key={book.bookId} book={book} />
          ))}
        </div>
      )}
    </div>
  );
}
