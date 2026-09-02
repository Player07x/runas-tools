"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface SkillIntegerInputProps {
  value: number
  onChange?: (value: number) => void
  label: string
  min?: number
  max?: number
  readOnly?: boolean
  className?: string
}

export function SkillIntegerInput({
  value,
  onChange,
  label,
  min,
  max,
  readOnly,
  className,
}: SkillIntegerInputProps) {
  const editing = useRef(false)
  const [draft, setDraft] = useState(String(Math.trunc(Number.isFinite(value) ? value : 0)))

  useEffect(() => {
    if (!editing.current) setDraft(String(Math.trunc(Number.isFinite(value) ? value : 0)))
  }, [value])

  function normalize(raw: string): number {
    const parsed = Number(raw)
    const fallback = min && min > 0 ? min : 0
    if (!raw.trim() || !Number.isFinite(parsed)) return fallback
    return Math.min(max ?? Number.POSITIVE_INFINITY, Math.max(min ?? Number.NEGATIVE_INFINITY, Math.trunc(parsed)))
  }

  function commit() {
    editing.current = false
    const next = normalize(draft)
    setDraft(String(next))
    if (onChange && next !== value) onChange(next)
  }

  return (
    <input
      type="number"
      inputMode="numeric"
      aria-label={label}
      value={draft}
      min={min}
      max={max}
      readOnly={readOnly || !onChange}
      onFocus={() => { editing.current = true }}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur()
      }}
      onChange={onChange ? (event) => {
        setDraft(event.target.value)
      } : undefined}
      className={cn(
        "h-10 min-w-0 rounded-xl border border-input bg-background/65 px-2 text-center text-sm tabular-nums text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/25 read-only:cursor-default read-only:text-muted-foreground",
        className,
      )}
    />
  )
}
