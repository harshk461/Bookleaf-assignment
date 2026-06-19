"use client";

import { Loader2Icon, Send, Sparkles } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AiDraftEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onGenerate?: () => void;
  sending?: boolean;
  generating?: boolean;
  hasDraft?: boolean;
}

export function AiDraftEditor({
  value,
  onChange,
  onSend,
  onGenerate,
  sending,
  generating,
  hasDraft,
}: AiDraftEditorProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">AI Draft Response</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="draft">Edit before sending</Label>
          <Textarea
            id="draft"
            className="min-h-40"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Generate an AI draft or write your response manually..."
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {onGenerate && (
            <Button type="button" variant="outline" onClick={onGenerate} disabled={generating}>
              {generating ? <Loader2Icon className="animate-spin" /> : <Sparkles />}
              {generating ? "Generating..." : hasDraft ? "Regenerate Draft" : "Generate Draft"}
            </Button>
          )}
          <Button type="button" onClick={onSend} disabled={sending || !value.trim()}>
            {sending ? <Loader2Icon className="animate-spin" /> : <Send />}
            {sending ? "Sending..." : "Send Response"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
