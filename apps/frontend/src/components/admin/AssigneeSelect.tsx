"use client";

import { TICKET_CATEGORIES, TICKET_PRIORITIES, TICKET_STATUSES } from "@bookleaf/shared";
import {
  TICKET_CATEGORY_LABELS,
  TICKET_PRIORITY_LABELS,
  TICKET_STATUS_LABELS,
} from "@/utils/constants";
import { FormSelect } from "@/components/common/FormSelect";

interface AssigneeSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export function AssigneeSelect({ value, onChange }: AssigneeSelectProps) {
  return (
    <FormSelect
      label="Assignee"
      value={value || undefined}
      onChange={(v) => onChange(v ?? "")}
      placeholder="Unassigned"
      emptyLabel="Unassigned"
      options={[{ value: "self", label: "Assign to me" }]}
    />
  );
}

export function StatusSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <FormSelect
      label="Status"
      value={value}
      onChange={(v) => onChange(v ?? value)}
      placeholder="Select status"
      allowEmpty={false}
      options={TICKET_STATUSES.map((s) => ({
        value: s,
        label: TICKET_STATUS_LABELS[s],
      }))}
    />
  );
}

export function CategorySelect({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (value: string) => void;
}) {
  return (
    <FormSelect
      label="Category"
      value={value ?? undefined}
      onChange={(v) => onChange(v ?? value ?? "")}
      placeholder="Select category"
      allowEmpty={false}
      options={TICKET_CATEGORIES.map((c) => ({
        value: c,
        label: TICKET_CATEGORY_LABELS[c],
      }))}
    />
  );
}

export function PrioritySelect({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (value: string) => void;
}) {
  return (
    <FormSelect
      label="Priority"
      value={value ?? undefined}
      onChange={(v) => onChange(v ?? value ?? "")}
      placeholder="Select priority"
      allowEmpty={false}
      options={TICKET_PRIORITIES.map((p) => ({
        value: p,
        label: TICKET_PRIORITY_LABELS[p],
      }))}
    />
  );
}
