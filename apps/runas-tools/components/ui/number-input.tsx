"use client"

import { useEffect, useId, useRef, useState } from "react"
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
  readOnly?: boolean
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
  readOnly = false,
}: NumberInputProps) {
  const id = useId()
  const effectiveMin = min ?? (allowNegative ? undefined : 0)
  const editing = useRef(false)
  const [draft, setDraft] = useState(() => String(Number.isFinite(value) ? value : 0))

  useEffect(() => {
    if (!editing.current) setDraft(String(Number.isFinite(value) ? value : 0))
  }, [value])

  function normalize(raw: string): number {
    const parsed = Number(raw)
    if (!raw.trim() || !Number.isFinite(parsed)) return effectiveMin && effectiveMin > 0 ? effectiveMin : 0
    let next = parsed
    if (effectiveMin !== undefined) next = Math.max(effectiveMin, next)
    if (max !== undefined) next = Math.min(max, next)
    return next
  }

  function commit() {
    editing.current = false
    const next = normalize(draft)
    setDraft(String(next))
    if (next !== value) onChange(next)
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
        value={draft}
        min={effectiveMin}
        max={max}
        step={step}
        readOnly={readOnly}
        onFocus={() => { if (!readOnly) editing.current = true }}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur()
        }}
        onChange={(event) => {
          setDraft(event.target.value)
        }}
        className={cn(
          "h-11 w-full rounded-xl border border-input bg-background/70 px-3.5 text-sm text-foreground outline-none transition-all focus-visible:border-ring focus-visible:bg-background focus-visible:ring-3 focus-visible:ring-ring/25",
          readOnly && "cursor-not-allowed border-border/70 bg-muted/75 text-muted-foreground focus-visible:border-border focus-visible:bg-muted/75 focus-visible:ring-0",
          inputClassName,
        )}
      />
    </div>
  )
}
