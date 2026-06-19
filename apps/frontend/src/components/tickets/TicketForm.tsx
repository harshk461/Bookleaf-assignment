"use client";

import { useState } from "react";
import type { Book } from "@bookleaf/shared";
import { Input } from "@/components/common/Input";
import { Select } from "@/components/common/Select";
import { Button } from "@/components/common/Button";

interface TicketFormProps {
  books: Book[];
  onSubmit: (data: { bookId: string | null; subject: string; description: string }) => Promise<void>;
}

export function TicketForm({ books, onSubmit }: TicketFormProps) {
  const [bookId, setBookId] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        bookId: bookId || null,
        subject,
        description,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium">Book (optional)</label>
        <Select value={bookId} onChange={(e) => setBookId(e.target.value)}>
          <option value="">General / Account Level</option>
          {books.map((b) => (
            <option key={b.bookId} value={b.bookId}>
              {b.title} ({b.bookId})
            </option>
          ))}
        </Select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Subject</label>
        <Input value={subject} onChange={(e) => setSubject(e.target.value)} required />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Description</label>
        <textarea
          className="min-h-32 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-500">Attachment (UI only)</label>
        <Input type="file" disabled className="cursor-not-allowed opacity-60" />
      </div>
      <Button type="submit" disabled={submitting}>
        {submitting ? "Submitting..." : "Submit Ticket"}
      </Button>
    </form>
  );
}
