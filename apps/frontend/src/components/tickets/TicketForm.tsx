"use client";

import { useState } from "react";
import type { Book } from "@bookleaf/shared";
import { Loader2Icon, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormSelect } from "@/components/common/FormSelect";

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/gif"];

interface TicketFormProps {
  books: Book[];
  onSubmit: (data: {
    bookId: string | null;
    subject: string;
    description: string;
    file?: File | null;
  }) => Promise<void>;
}

export function TicketForm({ books, onSubmit }: TicketFormProps) {
  const [bookId, setBookId] = useState<string | undefined>();
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    setError(null);
    if (!selected) {
      setFile(null);
      return;
    }
    if (selected.size > MAX_FILE_BYTES) {
      setError("File must be 5 MB or smaller");
      setFile(null);
      return;
    }
    if (!ALLOWED_TYPES.includes(selected.type)) {
      setError("Allowed types: PDF, JPEG, PNG, WebP, GIF");
      setFile(null);
      return;
    }
    setFile(selected);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({
        bookId: bookId ?? null,
        subject,
        description,
        file,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit ticket");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>New support request</CardTitle>
        <CardDescription>Provide as much detail as possible so we can help quickly.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <FormSelect
            id="book"
            label="Book (optional)"
            value={bookId}
            onChange={setBookId}
            placeholder="Select a book"
            emptyLabel="General / Account Level"
            options={books.map((b) => ({
              value: b.bookId,
              label: `${b.title} (${b.bookId})`,
            }))}
          />
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief summary of your issue"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              className="min-h-32"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your issue in detail..."
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="attachment">Attachment (optional, max 5 MB)</Label>
            <Input
              id="attachment"
              type="file"
              accept=".pdf,image/*"
              onChange={handleFileChange}
            />
            {file && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{file.name}</span>
                <button type="button" onClick={() => setFile(null)} aria-label="Remove file">
                  <X className="size-4" />
                </button>
              </div>
            )}
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={submitting}>
            {submitting && <Loader2Icon className="animate-spin" />}
            {submitting ? "Submitting..." : "Submit Ticket"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
