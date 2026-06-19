import { TicketDetailPage } from "@/views/admin/TicketDetailPage";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TicketDetailPage ticketId={id} />;
}
