"use client"

import { User } from "lucide-react"
import { ToolCard } from "./tool-card"
import { useCharacterPanel } from "@/components/character/character-panel"
import { useRuleset } from "@/components/rulesets/ruleset-provider"

export function FichaToolCard() {
  const { open } = useCharacterPanel()
  const { activeRulesetId } = useRuleset()

  return (
    <ToolCard
      title="Ficha do Personagem"
      description={activeRulesetId === "cronos" ? "Crie uma ficha de Cronos com Sincronia, Aura e Fama, salva separadamente neste navegador." : "Crie, edite, importe e exporte sua ficha. Ela fica salva automaticamente neste navegador."}
      icon={User}
      accent="purple"
      onClick={open}
      actionLabel="Abrir ficha"
    />
  )
}
