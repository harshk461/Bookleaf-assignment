"use client";

import Link from "next/link";
import type { Book } from "@bookleaf/shared";
import { IndianRupee } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookStatusBadge } from "./BookStatusBadge";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/formatDate";

export function BookCard({ book }: { book: Book }) {
  return (
    <Link href={`/author/books/${book.bookId}`} className="block group">
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base group-hover:text-primary transition-colors">
              {book.title}
            </CardTitle>
            <BookStatusBadge status={book.status} />
          </div>
          <p className="text-sm text-muted-foreground">{book.bookId} · {book.isbn}</p>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div><dt className="text-muted-foreground">Genre</dt><dd>{book.genre ?? "—"}</dd></div>
            <div><dt className="text-muted-foreground">Published</dt><dd>{formatDate(book.publicationDate)}</dd></div>
            <div><dt className="text-muted-foreground">Copies Sold</dt><dd>{book.totalCopiesSold}</dd></div>
            <div><dt className="text-muted-foreground">MRP</dt><dd>{formatCurrency(book.mrp)}</dd></div>
            <div><dt className="text-muted-foreground">Earned</dt><dd className="font-medium">{formatCurrency(book.totalRoyaltyEarned)}</dd></div>
            <div><dt className="text-muted-foreground">Paid</dt><dd>{formatCurrency(book.royaltyPaid)}</dd></div>
            <div className="col-span-2 flex items-center gap-1 rounded-md bg-accent/15 px-2 py-1.5">
              <IndianRupee className="size-3.5 text-accent-foreground" />
              <dt className="text-accent-foreground font-medium">Pending</dt>
              <dd className="ml-auto font-semibold text-accent-foreground">{formatCurrency(book.royaltyPending)}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </Link>
  );
}
