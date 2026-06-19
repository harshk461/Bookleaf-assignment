"use client";

import { TICKET_CATEGORIES, TICKET_PRIORITIES, TICKET_STATUSES } from "@bookleaf/shared";
import { TICKET_CATEGORY_LABELS, TICKET_PRIORITY_LABELS, TICKET_STATUS_LABELS } from "@/utils/constants";
import { FormSelect } from "@/components/common/FormSelect";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface TicketFilterValues {
  status?: string;
  category?: string;
  priority?: string;
  from?: string;
  to?: string;
}

interface TicketFiltersProps {
  values: TicketFilterValues;
  onChange: (values: TicketFilterValues) => void;
}

export function TicketFilters({ values, onChange }: TicketFiltersProps) {
  return (
    <Card className="mb-4">
      <CardContent className="grid gap-3 p-4 sm:grid-cols-3 lg:grid-cols-5">
        <FormSelect
          label="Status"
          value={values.status}
          onChange={(v) => onChange({ ...values, status: v })}
          placeholder="All statuses"
          emptyLabel="All statuses"
          options={TICKET_STATUSES.map((s) => ({
            value: s,
            label: TICKET_STATUS_LABELS[s],
          }))}
        />
        <FormSelect
          label="Category"
          value={values.category}
          onChange={(v) => onChange({ ...values, category: v })}
          placeholder="All categories"
          emptyLabel="All categories"
          options={TICKET_CATEGORIES.map((c) => ({
            value: c,
            label: TICKET_CATEGORY_LABELS[c],
          }))}
        />
        <FormSelect
          label="Priority"
          value={values.priority}
          onChange={(v) => onChange({ ...values, priority: v })}
          placeholder="All priorities"
          emptyLabel="All priorities"
          options={TICKET_PRIORITIES.map((p) => ({
            value: p,
            label: TICKET_PRIORITY_LABELS[p],
          }))}
        />
        <div className="space-y-2">
          <Label htmlFor="filter-from">From date</Label>
          <Input
            id="filter-from"
            type="date"
            value={values.from ?? ""}
            onChange={(e) => onChange({ ...values, from: e.target.value || undefined })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="filter-to">To date</Label>
          <Input
            id="filter-to"
            type="date"
            value={values.to ?? ""}
            onChange={(e) => onChange({ ...values, to: e.target.value || undefined })}
          />
        </div>
      </CardContent>
    </Card>
  );
}
