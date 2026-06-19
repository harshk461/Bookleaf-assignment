"use client";

import { useState } from "react";
import { Loader2Icon, StickyNote } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/common/EmptyState";
import { formatDate } from "@/utils/formatDate";

interface InternalNotesPanelProps {
  notes: Array<{ id: string; content: string; adminName: string; createdAt: string }>;
  onAdd: (content: string) => Promise<void>;
}

export function InternalNotesPanel({ notes, onAdd }: InternalNotesPanelProps) {
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (!content.trim()) return;
    setSaving(true);
    try {
      await onAdd(content);
      setContent("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="border-accent/30 bg-accent/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Internal Notes</CardTitle>
        <CardDescription>Visible to admins only — not shared with authors</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {notes.length === 0 ? (
          <EmptyState
            icon={StickyNote}
            title="No notes yet"
            description="Add internal notes for your team."
          />
        ) : (
          <ul className="space-y-2">
            {notes.map((note) => (
              <li key={note.id} className="rounded-lg border border-accent/20 bg-card p-3 text-sm">
                <p className="whitespace-pre-wrap">{note.content}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {note.adminName} · {formatDate(note.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
        <div className="space-y-2">
          <Label htmlFor="note">Add note</Label>
          <Textarea
            id="note"
            className="min-h-20 bg-card"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Team-only note..."
          />
          <Button type="button" size="sm" onClick={handleAdd} disabled={saving || !content.trim()}>
            {saving && <Loader2Icon className="animate-spin" />}
            Add Note
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
