"use client"

import { Check, Loader2 } from "lucide-react"
import { useCharacter } from "./character-provider"

export function SaveIndicator() {
  const { saveStatus } = useCharacter()

  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
      {saveStatus === "saving" ? (
        <>
          <Loader2 className="size-3.5 animate-spin" />
          Salvando…
        </>
      ) : (
        <>
          <Check className="size-3.5 text-primary" />
          Salvo localmente
        </>
      )}
    </span>
  )
}
