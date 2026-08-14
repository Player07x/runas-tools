"use client"

import { useState } from "react"
import { Wand2 } from "lucide-react"
import type { ParsedDamage } from "@/types/damage"
import { Button } from "@/components/ui/button"
import { SectionCard } from "@/components/ui/section-card"
import { parseDamageExpression } from "@/lib/damageParser"

interface Props {
  onParsed: (parsed: ParsedDamage) => void
}

export function QuickDamageInput({ onParsed }: Props) {
  const [text, setText] = useState("")

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
          className="w-full rounded-lg border border-input bg-background px-4 py-3 text-base text-foreground placeholder:text-muted-foreground/70 outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
          aria-label="Escreva o dano"
        />
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">{"Exemplo: 3D+2 queimadura (+poder)"}</p>
          <Button size="lg" onClick={fill}>
            <Wand2 />
            Preencher campos
          </Button>
        </div>
      </div>
    </SectionCard>
  )
}
