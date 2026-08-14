"use client"

import { useRef, useState } from "react"
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
    <div className="mt-2 flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2.5">
        <button type="button" onClick={() => exportCharacterJSON(character)} className="h-11 rounded-[24px] bg-[#5d6a91] px-5 text-base text-white transition hover:bg-[#6b789f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d3cdff]">
          Exportar JSON
        </button>
        <button type="button" onClick={() => fileInputRef.current?.click()} className="h-11 rounded-[24px] bg-[#5d6a91] px-5 text-base text-white transition hover:bg-[#6b789f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d3cdff]">
          Importar JSON
        </button>
        <button type="button" onClick={() => exportCharacterMarkdown(character)} className="h-11 rounded-[24px] bg-[#5d6a91] px-5 text-base text-white transition hover:bg-[#6b789f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d3cdff]">
          Baixar Markdown
        </button>
        <button type="button" onClick={handleReset} className="h-11 px-2 text-base text-[#acbfd1] transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d3cdff]">
          Limpar ficha
        </button>
        <input ref={fileInputRef} type="file" accept="application/json,.json" onChange={handleImport} className="hidden" />
      </div>
      {error && <p role="alert" className="text-xs text-[#ffb4b4]">{error}</p>}
    </div>
  )
}
