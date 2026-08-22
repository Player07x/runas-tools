"use client"

import { useEffect, useState } from "react"
import { Wand2 } from "lucide-react"
import type { ParsedDamage } from "@/types/damage"
import { Button } from "@/components/ui/button"
import { SectionCard } from "@/components/ui/section-card"
import { parseDamageExpression } from "@/lib/damageParser"

interface Props {
  onParsed: (parsed: ParsedDamage) => void
  initialText?: string
}

export function QuickDamageInput({ onParsed, initialText = "" }: Props) {
  const [text, setText] = useState("")

  useEffect(() => {
    if (initialText) setText(initialText)
  }, [initialText])

  function fill() {
    if (!text.trim()) return
    onParsed(parseDamageExpression(text))
  }

  return (
    <SectionCard title="Entrada rápida" description="Escreva o dano e preencha os campos automaticamente.">
      <div className="flex flex-col gap-3">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229) fill()
          }}
          placeholder="3D+2 queimadura (+poder)"
          className="h-12 w-full rounded-xl border border-input bg-background/70 px-4 text-base text-foreground placeholder:text-muted-foreground/70 outline-none transition-all focus-visible:border-ring focus-visible:bg-background focus-visible:ring-3 focus-visible:ring-ring/25"
          aria-label="Escreva o dano"
        />
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <p className="text-xs text-muted-foreground">{"Exemplo: 3D+2 queimadura (+poder)"}</p>
          <Button className="w-full sm:w-auto" onClick={fill}>
            <Wand2 />
            Preencher campos
          </Button>
        </div>
      </div>
    </SectionCard>
  )
}
