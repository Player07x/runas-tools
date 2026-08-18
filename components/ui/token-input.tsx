"use client"

import { useId, useState } from "react"
import { Plus, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface TokenInputProps {
  label: string
  values: string[]
  suggestions: string[]
  onChange: (values: string[]) => void
  emptyText?: string
  className?: string
}

function normalize(value: string): string {
  return value.trim().replace(/\s+/g, " ")
}

export function TokenInput({
  label,
  values,
  suggestions,
  onChange,
  emptyText = "Nenhum",
  className,
}: TokenInputProps) {
  const id = useId()
  const listId = `${id}-options`
  const [draft, setDraft] = useState("")

  function addDraft() {
    const next = normalize(draft).slice(0, 50)
    if (!next) return
    if (!values.some((value) => value.toLocaleLowerCase("pt-BR") === next.toLocaleLowerCase("pt-BR"))) {
      onChange([...values, next])
    }
    setDraft("")
  }

  return (
    <div className={cn("min-w-0", className)}>
      <label htmlFor={id} className="mb-1.5 block px-2 text-sm font-medium text-muted-foreground">
        {label}
      </label>
      <div className="rounded-[18px] border border-input bg-background/65 p-2 transition focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/25">
        <div className="flex min-h-8 flex-wrap items-center gap-1.5">
          {values.length === 0 && <span className="px-2 text-sm text-muted-foreground">{emptyText}</span>}
          {values.map((value) => (
            <span key={value} className="inline-flex max-w-full items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">
              <span className="truncate">{value}</span>
              <button
                type="button"
                onClick={() => onChange(values.filter((item) => item !== value))}
                aria-label={`Remover ${value}`}
                className="rounded-full p-0.5 transition hover:bg-background/70"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="mt-2 flex items-center gap-1.5 border-t border-border/70 pt-2">
          <input
            id={id}
            list={listId}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === ",") {
                event.preventDefault()
                addDraft()
              }
            }}
            placeholder="Adicionar dano…"
            maxLength={50}
            className="h-8 min-w-0 flex-1 bg-transparent px-2 text-sm text-foreground outline-none placeholder:text-muted-foreground/70"
          />
          <datalist id={listId}>
            {suggestions.map((suggestion) => <option key={suggestion} value={suggestion} />)}
          </datalist>
          <button
            type="button"
            onClick={addDraft}
            disabled={!draft.trim()}
            aria-label={`Adicionar em ${label}`}
            className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground transition hover:brightness-105 disabled:opacity-40"
          >
            <Plus className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
