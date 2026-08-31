"use client"

import { useState } from "react"
import { BookOpen, Images, PenTool } from "lucide-react"
import { GameRules } from "@/components/runic-cards/game-rules"
import { RunicCardEditor } from "@/components/runic-cards/runic-card-editor"
import { cn } from "@/lib/utils"

export type RunicCardsView = "create" | "gallery" | "rules"

const views = [
  { value: "create" as const, label: "Criar carta", icon: PenTool },
  { value: "gallery" as const, label: "Galeria", icon: Images },
  { value: "rules" as const, label: "Regras", icon: BookOpen },
]

export function RunicCardsWorkspace() {
  const [view, setView] = useState<RunicCardsView>("create")

  return (
    <div className="space-y-6">
      <nav aria-label="Seções de Cartas Rúnicas" className="grid grid-cols-3 gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm" role="tablist">
        {views.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={view === value}
            aria-controls={`runic-view-${value}`}
            onClick={() => setView(value)}
            className={cn(
              "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold transition-colors",
              view === value ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div id={`runic-view-${view}`} role="tabpanel" aria-label={views.find((item) => item.value === view)?.label}>
        <RunicCardEditor view={view} onOpenCreate={() => setView("create")} />
        {view === "rules" && <GameRules />}
      </div>
    </div>
  )
}
