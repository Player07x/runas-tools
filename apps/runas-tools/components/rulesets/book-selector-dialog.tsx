"use client"

import { useEffect } from "react"
import { BookOpen, Check, Eclipse, X } from "lucide-react"
import type { RulesetId } from "@runas/ruleset-contracts"
import { rulesets } from "@/data/rulesets"
import { cn } from "@/lib/utils"

interface BookSelectorDialogProps {
  open: boolean
  activeRulesetId: RulesetId
  onSelect: (id: RulesetId) => void
  onClose: () => void
}

export function BookSelectorDialog({ open, activeRulesetId, onSelect, onClose }: BookSelectorDialogProps) {
  useEffect(() => {
    if (!open) return
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose()
    }
    document.addEventListener("keydown", closeOnEscape)
    return () => document.removeEventListener("keydown", closeOnEscape)
  }, [onClose, open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-[#11131b]/80 p-4 backdrop-blur-sm" role="presentation" onMouseDown={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="book-selector-title"
        onMouseDown={(event) => event.stopPropagation()}
        className="w-full max-w-3xl rounded-[28px] border border-border bg-card p-5 shadow-[0_30px_90px_rgba(9,12,22,0.45)] sm:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Sistema de troca de livros</p>
            <h2 id="book-selector-title" className="mt-1 text-2xl font-bold tracking-tight text-card-foreground">Escolha o livro ativo</h2>
            <p className="mt-1 text-sm text-muted-foreground">Cada livro mantém suas próprias fichas e regras. Cartas Rúnicas permanecem independentes.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar seleção de livro" className="grid size-10 shrink-0 place-items-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-foreground"><X className="size-5" /></button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {rulesets.map((ruleset) => {
            const selected = ruleset.id === activeRulesetId
            const cronos = ruleset.id === "cronos"
            return (
              <button
                key={ruleset.id}
                type="button"
                onClick={() => { onSelect(ruleset.id); onClose() }}
                className={cn(
                  "group relative min-h-72 overflow-hidden rounded-[24px] border-2 p-5 text-left transition hover:-translate-y-1 hover:shadow-xl",
                  selected ? "border-primary shadow-lg" : "border-border hover:border-primary/55",
                  cronos ? "cronos-book-cover" : "bg-gradient-to-br from-[#34415f] via-[#53658e] to-[#282f43] text-white",
                )}
              >
                <span className="absolute inset-x-0 top-0 h-1 bg-white/25" />
                <span className="relative flex items-start justify-between gap-3">
                  <span className="grid size-12 place-items-center rounded-2xl border border-white/20 bg-black/20 text-white backdrop-blur-sm">
                    {cronos ? <Eclipse className="size-6" /> : <BookOpen className="size-6" />}
                  </span>
                  {selected && <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-[#282c3b]"><Check className="size-3.5" /> Ativo</span>}
                </span>
                <span className="relative mt-20 block text-xs font-bold uppercase tracking-[0.18em] text-white/70">Livro de regras</span>
                <strong className="relative mt-1 block text-2xl text-white">{ruleset.name}</strong>
                <span className="relative mt-2 block text-sm leading-relaxed text-white/78">{ruleset.description}</span>
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}
