import type { Book } from "@bookleaf/shared";
import { BookStatusBadge } from "./BookStatusBadge";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/formatDate";

export function BookCard({ book }: { book: Book }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold">{book.title}</h3>
          <p className="text-sm text-slate-500">{book.bookId} · {book.isbn}</p>
        </div>
        <BookStatusBadge status={book.status} />
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div><dt className="text-slate-500">Genre</dt><dd>{book.genre ?? "—"}</dd></div>
        <div><dt className="text-slate-500">Published</dt><dd>{formatDate(book.publicationDate)}</dd></div>
        <div><dt className="text-slate-500">MRP</dt><dd>{formatCurrency(book.mrp)}</dd></div>
        <div><dt className="text-slate-500">Copies Sold</dt><dd>{book.totalCopiesSold}</dd></div>
        <div><dt className="text-slate-500">Royalty Earned</dt><dd>{formatCurrency(book.totalRoyaltyEarned)}</dd></div>
        <div><dt className="text-slate-500">Pending</dt><dd>{formatCurrency(book.royaltyPending)}</dd></div>
        <div className="col-span-2"><dt className="text-slate-500">Platforms</dt><dd>{book.availableOn.length ? book.availableOn.join(", ") : "—"}</dd></div>
        <div className="col-span-2"><dt className="text-slate-500">Print Partner</dt><dd>{book.printPartner ?? "—"}</dd></div>
      </dl>
    </article>
  );
}
