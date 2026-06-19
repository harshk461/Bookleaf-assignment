"use client";

import type { TicketAttachment } from "@bookleaf/shared";
import { API_PATHS } from "@bookleaf/shared";
import { Paperclip } from "lucide-react";
import { API_URL } from "@/services/api";

interface TicketAttachmentsProps {
  ticketId: string;
  attachments: TicketAttachment[];
  admin?: boolean;
}

export function TicketAttachments({ ticketId, attachments, admin = false }: TicketAttachmentsProps) {
  if (!attachments.length) return null;

  const token = typeof window !== "undefined" ? localStorage.getItem("bookleaf_token") : null;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium flex items-center gap-1.5">
        <Paperclip className="size-4" />
        Attachments
      </p>
      <ul className="space-y-1">
        {attachments.map((a) => {
          const path = admin
            ? API_PATHS.admin.ticketAttachment(ticketId, a.id)
            : API_PATHS.author.ticketAttachment(ticketId, a.id);
          const href = token ? `${API_URL}${path}?token=${encodeURIComponent(token)}` : "#";
          return (
            <li key={a.id}>
              <a
                href={href}
                className="text-sm text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {a.fileName} ({Math.round(a.sizeBytes / 1024)} KB)
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
