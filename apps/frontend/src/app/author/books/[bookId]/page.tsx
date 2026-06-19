import { BookDetailPage } from "@/views/author/BookDetailPage";

export default async function Page({ params }: { params: Promise<{ bookId: string }> }) {
  const { bookId } = await params;
  return <BookDetailPage bookId={bookId} />;
}
