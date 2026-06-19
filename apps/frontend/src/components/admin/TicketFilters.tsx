"use client";

import { TICKET_CATEGORIES, TICKET_PRIORITIES, TICKET_STATUSES } from "@bookleaf/shared";
import { TICKET_CATEGORY_LABELS, TICKET_PRIORITY_LABELS, TICKET_STATUS_LABELS } from "@/utils/constants";
import { Select } from "@/components/common/Select";

interface TicketFiltersProps {
  values: { status?: string; category?: string; priority?: string };
  onChange: (values: { status?: string; category?: string; priority?: string }) => void;
}

export function TicketFilters({ values, onChange }: TicketFiltersProps) {
  return (
    <div className="mb-4 grid gap-3 sm:grid-cols-3">
      <Select
        value={values.status ?? ""}
        onChange={(e) => onChange({ ...values, status: e.target.value || undefined })}
      >
        <option value="">All statuses</option>
        {TICKET_STATUSES.map((s) => (
          <option key={s} value={s}>{TICKET_STATUS_LABELS[s]}</option>
        ))}
      </Select>
      <Select
        value={values.category ?? ""}
        onChange={(e) => onChange({ ...values, category: e.target.value || undefined })}
      >
        <option value="">All categories</option>
        {TICKET_CATEGORIES.map((c) => (
          <option key={c} value={c}>{TICKET_CATEGORY_LABELS[c]}</option>
        ))}
      </Select>
      <Select
        value={values.priority ?? ""}
        onChange={(e) => onChange({ ...values, priority: e.target.value || undefined })}
      >
        <option value="">All priorities</option>
        {TICKET_PRIORITIES.map((p) => (
          <option key={p} value={p}>{TICKET_PRIORITY_LABELS[p]}</option>
        ))}
      </Select>
    </div>
  );
}
