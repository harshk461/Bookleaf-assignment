"use client";

import { Select } from "@/components/common/Select";

interface AssigneeSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export function AssigneeSelect({ value, onChange }: AssigneeSelectProps) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">Assignee</label>
      <Select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Unassigned</option>
        <option value="self">Assign to me</option>
      </Select>
    </div>
  );
}
