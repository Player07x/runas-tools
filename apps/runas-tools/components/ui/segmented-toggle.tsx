"use client"

import { cn } from "@/lib/utils"

interface SegmentedOption<T extends string> {
  value: T
  label: string
}

interface SegmentedToggleProps<T extends string> {
  label?: string
  value: T
  onChange: (value: T) => void
  options: SegmentedOption<T>[]
  className?: string
}

export function SegmentedToggle<T extends string>({
  label,
  value,
  onChange,
  options,
  className,
}: SegmentedToggleProps<T>) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && <span className="text-xs font-medium text-muted-foreground">{label}</span>}
      <div className="inline-flex rounded-xl border border-input bg-muted/60 p-1">
        {options.map((opt) => {
          const active = opt.value === value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              aria-pressed={active}
              className={cn(
                "flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-all",
                active
                  ? "bg-card text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
