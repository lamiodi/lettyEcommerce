"use client";

import { useMemo } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSubdivisionConfig } from "@/lib/data/subdivisions";
import { Input } from "@/components/ui/input";

export interface SubdivisionSelectProps {
  id: string;
  country: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  className?: string;
  autoComplete?: string;
}

export function SubdivisionSelect({
  id,
  country,
  value,
  onChange,
  error,
  className,
  autoComplete = "address-level1",
}: SubdivisionSelectProps) {
  const config = useMemo(() => getSubdivisionConfig(country), [country]);
  const hasSubdivisions = config.subdivisions.length > 0;

  if (!hasSubdivisions) {
    return (
      <div className="w-full">
        <Input
          id={id}
          name={id}
          autoComplete={autoComplete}
          placeholder={config.placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(
            "h-11 w-full rounded-[2px] border bg-white px-3.5 text-sm text-ink placeholder:text-stone/40 transition-colors",
            "focus:border-ink focus:ring-1 focus:ring-ink focus:outline-none",
            error ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-stone/20",
            className
          )}
        />
        {error && (
          <p id={`${id}-error`} role="alert" className="mt-1 text-[10px] text-red-600 font-medium">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <div className="relative">
        <select
          id={id}
          name={id}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          aria-label={config.label}
          className={cn(
            "h-11 w-full rounded-[2px] border bg-white px-3.5 pr-9 text-sm appearance-none cursor-pointer transition-colors truncate",
            "focus:border-ink focus:ring-1 focus:ring-ink focus:outline-none",
            !value ? "text-stone/40 font-normal" : "text-ink font-normal",
            error
              ? "border-red-500 focus:border-red-500 focus:ring-red-500"
              : "border-stone/20 hover:border-stone/40",
            className
          )}
        >
          <option value="" disabled={config.required} className="text-stone/40">
            {config.placeholder}
          </option>
          {config.subdivisions.map((s) => (
            <option key={s.code || s.name} value={s.name} className="text-ink py-1">
              {s.name}
              {s.code && s.code.length <= 4 && !s.name.includes(s.code) ? ` (${s.code})` : ""}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone shrink-0" />
      </div>
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-[10px] text-red-600 font-medium">
          {error}
        </p>
      )}
    </div>
  );
}
