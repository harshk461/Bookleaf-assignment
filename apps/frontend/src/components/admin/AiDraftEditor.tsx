"use client";

interface AiDraftEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  sending?: boolean;
}

export function AiDraftEditor({ value, onChange, onSend, sending }: AiDraftEditorProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium">AI Draft Response</label>
      <textarea
        className="min-h-40 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button
        type="button"
        onClick={onSend}
        disabled={sending || !value.trim()}
        className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
      >
        {sending ? "Sending..." : "Send Response"}
      </button>
    </div>
  );
}
