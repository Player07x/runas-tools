"use client"

import { useId } from "react"
import { cn } from "@/lib/utils"

interface NumberInputProps {
  label?: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  /** Permite valores negativos (default true). Ignorado se min definido. */
  allowNegative?: boolean
  className?: string
  inputClassName?: string
}

export function NumberInput({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  allowNegative = true,
  className,
  inputClassName,
}: NumberInputProps) {
  const id = useId()
  const effectiveMin = min ?? (allowNegative ? undefined : 0)

  function handleChange(raw: string) {
    if (raw === "" || raw === "-") {
      onChange(0)
      return
    }
    const parsed = Number(raw)
    if (!Number.isFinite(parsed)) return
    let next = parsed
    if (effectiveMin !== undefined) next = Math.max(effectiveMin, next)
    if (max !== undefined) next = Math.min(max, next)
    onChange(next)
  }

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label htmlFor={id} className="text-xs font-medium text-muted-foreground">
          {label}
        </label>
      )}
      <input
        id={id}
        type="number"
        inputMode="numeric"
        value={Number.isFinite(value) ? value : 0}
        min={effectiveMin}
        max={max}
        step={step}
        onChange={(e) => handleChange(e.target.value)}
        className={cn(
          "h-11 w-full rounded-xl border border-input bg-background/70 px-3.5 text-sm text-foreground outline-none transition-all focus-visible:border-ring focus-visible:bg-background focus-visible:ring-3 focus-visible:ring-ring/25",
          inputClassName,
        )}
      />
    </div>
  )
}
