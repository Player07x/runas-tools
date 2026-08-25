"use client"

import { User } from "lucide-react"
import { ToolCard } from "./tool-card"
import { useCharacterPanel } from "@/components/character/character-panel"

export function FichaToolCard() {
  const { open } = useCharacterPanel()

  return (
    <ToolCard
      title="Ficha do Personagem"
      description="Crie, edite, importe e exporte sua ficha. Ela fica salva automaticamente neste navegador."
      icon={User}
      accent="purple"
      onClick={open}
      actionLabel="Abrir ficha"
    />
  )
}
