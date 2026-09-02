"use client"

import { useId } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

export interface SelectOption {
  value: string
  label: string
}

interface SelectFieldProps {
  label?: string
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  className?: string
  disabled?: boolean
}

export function SelectField({ label, value, onChange, options, className, disabled = false }: SelectFieldProps) {
  const id = useId()
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label htmlFor={id} className="text-xs font-medium text-muted-foreground">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={id}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-full appearance-none rounded-xl border border-input bg-background/70 px-3.5 pr-10 text-sm text-foreground outline-none transition-all focus-visible:border-ring focus-visible:bg-background focus-visible:ring-3 focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:border-border/70 disabled:bg-muted/75 disabled:text-muted-foreground disabled:opacity-100"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      </div>
    </div>
  )
}
