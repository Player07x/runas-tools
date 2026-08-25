"use client"

import { useRef, useState } from "react"
import { Braces, FileDown, RotateCcw, Upload } from "lucide-react"
import { useCharacter } from "./character-provider"
import { exportCharacterJSON, exportCharacterMarkdown } from "@/lib/exportCharacter"
import { parseCharacterFile } from "@/lib/characterStorage"

export function CharacterActions() {
  const { character, replaceCharacter, resetCharacter } = useCharacter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    try {
      const text = await file.text()
      const imported = parseCharacterFile(text)
      replaceCharacter(imported)
    } catch {
      setError("Não foi possível importar: arquivo inválido.")
    } finally {
      // Permite reimportar o mesmo arquivo novamente.
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  function handleReset() {
    if (window.confirm("Limpar a ficha atual? Isso não pode ser desfeito.")) {
      resetCharacter()
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:mt-3 sm:gap-3">
      <div className="flex items-center gap-1.5 sm:flex-wrap sm:gap-2">
        <button type="button" title="Exportar JSON" aria-label="Exportar JSON" onClick={() => exportCharacterJSON(character)} className="inline-flex size-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-secondary text-sm font-semibold text-secondary-foreground transition hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:h-10 sm:w-auto sm:px-4">
          <Braces className="size-4" aria-hidden="true" />
          <span className="sr-only sm:not-sr-only">Exportar JSON</span>
        </button>
        <button type="button" title="Importar JSON" aria-label="Importar JSON" onClick={() => fileInputRef.current?.click()} className="inline-flex size-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-secondary text-sm font-semibold text-secondary-foreground transition hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:h-10 sm:w-auto sm:px-4">
          <Upload className="size-4" aria-hidden="true" />
          <span className="sr-only sm:not-sr-only">Importar JSON</span>
        </button>
        <button type="button" title="Baixar Markdown" aria-label="Baixar Markdown" onClick={() => exportCharacterMarkdown(character)} className="inline-flex size-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-secondary text-sm font-semibold text-secondary-foreground transition hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:h-10 sm:w-auto sm:px-4">
          <FileDown className="size-4" aria-hidden="true" />
          <span className="sr-only sm:not-sr-only">Baixar Markdown</span>
        </button>
        <button type="button" title="Limpar ficha" aria-label="Limpar ficha" onClick={handleReset} className="inline-flex size-11 shrink-0 items-center justify-center gap-2 rounded-xl text-sm font-semibold text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:h-10 sm:w-auto sm:px-3">
          <RotateCcw className="size-4" aria-hidden="true" />
          <span className="sr-only sm:not-sr-only">Limpar ficha</span>
        </button>
        <input ref={fileInputRef} type="file" accept="application/json,.json" onChange={handleImport} className="hidden" />
      </div>
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
