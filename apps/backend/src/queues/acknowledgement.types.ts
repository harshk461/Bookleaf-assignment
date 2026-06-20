export interface AcknowledgementJobPayload {
  ticketId: string;
  ticketNumber: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  bookTitle?: string | null;
  authorName?: string | null;
}

export function acknowledgementJobId(ticketId: string): string {
  return `ticket-ack:${ticketId}`;
}
