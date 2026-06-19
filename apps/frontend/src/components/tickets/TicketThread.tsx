import type { TicketMessage } from "@bookleaf/shared";
import { formatDate } from "@/utils/formatDate";

export function TicketThread({ messages }: { messages: TicketMessage[] }) {
  if (!messages?.length) return null;
  return (
    <div className="space-y-3">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`rounded-lg p-3 text-sm ${
            msg.senderType === "admin" ? "bg-emerald-50" : "bg-slate-100"
          }`}
        >
          <div className="mb-1 text-xs font-medium text-slate-500">
            {msg.senderType === "admin" ? "BookLeaf Support" : "You"} · {formatDate(msg.createdAt)}
          </div>
          <p className="whitespace-pre-wrap">{msg.content}</p>
        </div>
      ))}
    </div>
  );
}
