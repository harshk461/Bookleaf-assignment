import { AuthorTicketDetailPage } from "@/views/author/AuthorTicketDetailPage";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AuthorTicketDetailPage ticketId={id} />;
}
