"use client"

import type React from "react"
import { createContext, useCallback, useContext, useEffect, useState } from "react"
import { PanelLeftClose, PanelLeftOpen, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { CharacterSheet } from "./character-sheet"

interface PanelContextValue {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
}

const PanelContext = createContext<PanelContextValue | null>(null)

export function CharacterPanelProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen((v) => !v), [])

  // Fecha com Escape e trava o scroll do body quando aberto.
  useEffect(() => {
    if (!isOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close()
    }
    document.addEventListener("keydown", onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [isOpen, close])

  return (
    <PanelContext.Provider value={{ isOpen, open, close, toggle }}>
      {children}
      <CharacterPanel />
    </PanelContext.Provider>
  )
}

export function useCharacterPanel(): PanelContextValue {
  const ctx = useContext(PanelContext)
  if (!ctx) throw new Error("useCharacterPanel deve ser usado dentro de <CharacterPanelProvider>")
  return ctx
}

function CharacterPanel() {
  const { isOpen, close } = useCharacterPanel()
  const [panelWidth, setPanelWidth] = useState(800)

  return (
    <div className={cn("fixed inset-0 z-50", isOpen ? "pointer-events-auto" : "pointer-events-none")} aria-hidden={!isOpen}>
      {/* Backdrop */}
      <div
        onClick={close}
        className={cn(
          "absolute inset-0 bg-foreground/35 backdrop-blur-sm transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0",
        )}
      />

      {/* Drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Ficha do Personagem"
        style={{ width: `min(${panelWidth}px, 92vw)` }}
        className={cn(
          "absolute inset-y-0 right-0 flex max-w-none flex-col border-l border-border bg-background shadow-2xl transition-transform duration-300 ease-out max-sm:!w-full",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex min-h-20 items-center justify-between border-b border-border bg-card px-5 py-3 sm:px-7">
          <div className="flex items-center gap-4">
            <span className="size-12 rounded-full bg-muted" aria-hidden="true" />
            <h2 className="text-xl font-bold tracking-wide text-foreground">FICHA</h2>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPanelWidth((width) => Math.max(680, width - 120))}
              className="hidden size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground sm:flex"
              aria-label="Diminuir painel"
              title="Diminuir painel"
            >
              <PanelLeftOpen className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => setPanelWidth((width) => Math.min(960, width + 120))}
              className="hidden size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground sm:flex"
              aria-label="Ampliar painel"
              title="Ampliar painel"
            >
              <PanelLeftClose className="size-5" />
            </button>
            <button
              onClick={close}
              className="flex size-12 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Fechar ficha"
            >
              <X className="size-9" strokeWidth={3} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-5 sm:px-7">{isOpen && <CharacterSheet />}</div>
      </aside>
    </div>
  )
}
