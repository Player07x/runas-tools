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
    <div className="mt-3 flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
        <button type="button" onClick={() => exportCharacterJSON(character)} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-highlight">
          <Braces className="size-4" />
          Exportar JSON
        </button>
        <button type="button" onClick={() => fileInputRef.current?.click()} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-highlight">
          <Upload className="size-4" />
          Importar JSON
        </button>
        <button type="button" onClick={() => exportCharacterMarkdown(character)} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-highlight">
          <FileDown className="size-4" />
          Baixar Markdown
        </button>
        <button type="button" onClick={handleReset} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold text-panel-muted transition hover:bg-destructive/15 hover:text-[#ffb4b4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-highlight">
          <RotateCcw className="size-4" />
          Limpar ficha
        </button>
        <input ref={fileInputRef} type="file" accept="application/json,.json" onChange={handleImport} className="hidden" />
      </div>
      {error && <p role="alert" className="text-xs text-[#ffb4b4]">{error}</p>}
    </div>
  )
}
