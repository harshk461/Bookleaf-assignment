"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Book, BookSale } from "@bookleaf/shared";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { BookStatusBadge } from "@/components/books/BookStatusBadge";
import { BookSalesTable } from "@/components/books/BookSalesTable";
import { ErrorAlert } from "@/components/common/ErrorAlert";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as booksService from "@/services/books.service";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/formatDate";
import { IndianRupee, TrendingUp, Wallet } from "lucide-react";

export function BookDetailPage({ bookId }: { bookId: string }) {
  const router = useRouter();
  const [book, setBook] = useState<Book | null>(null);
  const [sales, setSales] = useState<BookSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [b, s] = await Promise.all([
          booksService.fetchBook(bookId),
          booksService.fetchBookSales(bookId),
        ]);
        setBook(b);
        setSales(s);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load book");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [bookId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !book) return <ErrorAlert message={error ?? "Book not found"} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={book.title}
        description={`${book.bookId} · ${book.isbn}`}
        breadcrumbs={[
          { label: "My Books", href: "/author/books" },
          { label: book.title },
        ]}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Royalty Earned" value={formatCurrency(book.totalRoyaltyEarned)} icon={TrendingUp} accent="primary" />
        <StatCard label="Paid Out" value={formatCurrency(book.royaltyPaid)} icon={Wallet} accent="muted" />
        <StatCard label="Pending" value={formatCurrency(book.royaltyPending)} icon={IndianRupee} accent="accent" />
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions ({sales.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <Card>
            <CardContent className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <div className="mt-1"><BookStatusBadge status={book.status} /></div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Published</p>
                <p className="mt-1 font-medium">{formatDate(book.publicationDate)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Copies Sold</p>
                <p className="mt-1 font-medium">{book.totalCopiesSold}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">MRP</p>
                <p className="mt-1 font-medium">{formatCurrency(book.mrp)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Royalty per Copy</p>
                <p className="mt-1 font-medium">{formatCurrency(book.authorRoyaltyPerCopy)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Platforms</p>
                <p className="mt-1 font-medium">{book.availableOn.length ? book.availableOn.join(", ") : "—"}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-sm text-muted-foreground">Print Partner</p>
                <p className="mt-1 font-medium">{book.printPartner ?? "—"}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="mt-4 space-y-4">
          <BookSalesTable sales={sales} />
        </TabsContent>
      </Tabs>

      <button
        type="button"
        onClick={() => router.back()}
        className="text-sm text-primary hover:underline"
      >
        ← Back to my books
      </button>
    </div>
  );
}
