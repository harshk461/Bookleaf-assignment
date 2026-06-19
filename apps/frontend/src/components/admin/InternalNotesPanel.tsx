"use client";

import { useState } from "react";
import { Button } from "@/components/common/Button";
import { formatDate } from "@/utils/formatDate";

interface Note {
  id: string;
  content: string;
  adminName?: string;
  createdAt: string;
}

interface InternalNotesPanelProps {
  notes: Note[];
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
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <h3 className="mb-3 font-medium text-amber-900">Internal Notes (Admin only)</h3>
      <ul className="mb-4 space-y-2">
        {notes.map((note) => (
          <li key={note.id} className="rounded bg-white p-2 text-sm">
            <div className="text-xs text-slate-500">{note.adminName} · {formatDate(note.createdAt)}</div>
            <p>{note.content}</p>
          </li>
        ))}
      </ul>
      <textarea
        className="mb-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        placeholder="Add internal note..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <Button onClick={handleAdd} disabled={saving}>Add Note</Button>
    </div>
  );
}
