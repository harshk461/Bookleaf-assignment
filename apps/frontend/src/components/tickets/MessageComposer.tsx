"use client";

import { Loader2Icon, Send } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface MessageComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  sending?: boolean;
  disabled?: boolean;
  disabledReason?: string;
  placeholder?: string;
  label?: string;
}

export function MessageComposer({
  value,
  onChange,
  onSend,
  sending,
  disabled,
  disabledReason,
  placeholder = "Write your message...",
  label = "Reply",
}: MessageComposerProps) {
  const isDisabled = disabled || sending;

  return (
    <div className="space-y-3 border-t pt-4">
      <div className="space-y-2">
        <Label htmlFor="message-composer">{label}</Label>
        <Textarea
          id="message-composer"
          className="min-h-24"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={isDisabled}
        />
      </div>
      {disabledReason && (
        <p className="text-sm text-muted-foreground">{disabledReason}</p>
      )}
      <Button
        type="button"
        onClick={onSend}
        disabled={isDisabled || !value.trim()}
      >
        {sending ? <Loader2Icon className="animate-spin" /> : <Send />}
        {sending ? "Sending..." : "Send Message"}
      </Button>
    </div>
  );
}
