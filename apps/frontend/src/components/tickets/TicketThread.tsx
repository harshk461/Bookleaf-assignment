import type { TicketMessage } from "@bookleaf/shared";
import { cn } from "@/lib/utils";
import { formatDate } from "@/utils/formatDate";

interface TicketThreadProps {
  messages: TicketMessage[];
  viewer?: "author" | "admin";
  authorLabel?: string;
}

function senderLabel(
  msg: TicketMessage,
  viewer: "author" | "admin",
  authorLabel: string,
): string {
  const isAdmin = msg.senderType === "admin";

  if (viewer === "author") {
    if (isAdmin) return "BookLeaf Support";
    return msg.isInitial ? "You · Original request" : "You";
  }

  if (isAdmin) return "You";
  return msg.isInitial ? `${authorLabel} · Original request` : authorLabel;
}

export function TicketThread({
  messages,
  viewer = "author",
  authorLabel = "Author",
}: TicketThreadProps) {
  if (!messages?.length) {
    return <p className="text-sm text-muted-foreground">No messages yet.</p>;
  }

  return (
    <div className="space-y-4">
      {messages.map((msg) => {
        const isAdmin = msg.senderType === "admin";
        const isSelf = viewer === "author" ? !isAdmin : isAdmin;

        return (
          <div
            key={msg.id}
            className={cn("flex", isSelf ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm",
                isSelf
                  ? "rounded-tr-sm bg-muted text-foreground"
                  : "rounded-tl-sm bg-primary/10 text-foreground",
              )}
            >
              <div className="mb-1.5 text-xs font-medium text-muted-foreground">
                {senderLabel(msg, viewer, authorLabel)} · {formatDate(msg.createdAt)}
              </div>
              <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
