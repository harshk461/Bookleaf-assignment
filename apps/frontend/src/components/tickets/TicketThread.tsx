import type { TicketMessage } from "@bookleaf/shared";
import { cn } from "@/lib/utils";
import { formatDate } from "@/utils/formatDate";

export function TicketThread({ messages }: { messages: TicketMessage[] }) {
  if (!messages?.length) {
    return <p className="text-sm text-muted-foreground">No messages yet.</p>;
  }

  return (
    <div className="space-y-4">
      {messages.map((msg) => {
        const isAdmin = msg.senderType === "admin";
        return (
          <div
            key={msg.id}
            className={cn("flex", isAdmin ? "justify-start" : "justify-end")}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm",
                isAdmin
                  ? "rounded-tl-sm bg-primary/10 text-foreground"
                  : "rounded-tr-sm bg-muted text-foreground",
              )}
            >
              <div className="mb-1.5 text-xs font-medium text-muted-foreground">
                {isAdmin
                  ? "BookLeaf Support"
                  : msg.isInitial
                    ? "You · Original request"
                    : "You"}{" "}
                · {formatDate(msg.createdAt)}
              </div>
              <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
