"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface FormSelectOption {
  value: string;
  label: string;
}

interface FormSelectProps {
  id?: string;
  label?: string;
  value?: string;
  onChange: (value: string | undefined) => void;
  placeholder: string;
  options: FormSelectOption[];
  allowEmpty?: boolean;
  emptyLabel?: string;
  className?: string;
}

export function FormSelect({
  id,
  label,
  value,
  onChange,
  placeholder,
  options,
  allowEmpty = true,
  emptyLabel = "None",
  className,
}: FormSelectProps) {
  const selectValue = value ?? (allowEmpty ? "__empty__" : options[0]?.value ?? "");

  return (
    <div className={className}>
      {label && (
        <Label htmlFor={id} className="mb-1.5 block">
          {label}
        </Label>
      )}
      <Select
        value={selectValue}
        onValueChange={(v) => onChange(!v || v === "__empty__" ? undefined : v)}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {allowEmpty && <SelectItem value="__empty__">{emptyLabel}</SelectItem>}
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
