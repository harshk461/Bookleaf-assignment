import { loadEnv } from '../config/env.js';
import { DEFAULT_TICKET_CATEGORY, DEFAULT_TICKET_PRIORITY } from '../config/constants.js';
import type { TicketCategory, TicketPriority } from '@bookleaf/shared';

function aiServiceUrl(): string {
  return loadEnv().AI_SERVICE_URL;
}

export interface ClassifyResult {
  category: TicketCategory;
  priority: TicketPriority;
  failed: boolean;
}

export async function classifyAndPrioritize(input: {
  subject: string;
  description: string;
  bookTitle?: string | null;
}): Promise<ClassifyResult> {
  try {
    const res = await fetch(`${aiServiceUrl()}/classify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error(`AI service returned ${res.status}`);
    const data = (await res.json()) as { category: TicketCategory; priority: TicketPriority };
    return { category: data.category, priority: data.priority, failed: false };
  } catch {
    return {
      category: DEFAULT_TICKET_CATEGORY,
      priority: DEFAULT_TICKET_PRIORITY,
      failed: true,
    };
  }
}

export async function generateDraft(input: {
  subject: string;
  description: string;
  category?: string | null;
  bookTitle?: string | null;
  authorName?: string | null;
}): Promise<{ content: string; failed: boolean }> {
  try {
    const res = await fetch(`${aiServiceUrl()}/draft`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error(`AI service returned ${res.status}`);
    const data = (await res.json()) as { content: string };
    return { content: data.content, failed: false };
  } catch {
    return {
      content: 'Thank you for reaching out to BookLeaf support. We are reviewing your query and will respond shortly.',
      failed: true,
    };
  }
}
