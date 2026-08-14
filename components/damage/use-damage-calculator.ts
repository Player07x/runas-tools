"use client"

import { useCallback, useState } from "react"
import type { AttributeKey } from "@/types/character"
import type { DamageConfig, DamageResult, ParsedDamage } from "@/types/damage"
import { damageTypes } from "@/data/damageTypes"
import { useCharacter } from "@/components/character/character-provider"
import { calculateDamage, rollDice } from "@/lib/damageCalculator"
import { isAttributeKey } from "@/lib/attributeOptions"

function defaultConfig(): DamageConfig {
  return {
    numDice: 1,
    damageTypeId: damageTypes[0]?.id ?? "",
    attributeKey: "none",
    otherModifier: 0,
    mtEnabled: false,
    mtValue: 0,
    otherMultiplier: "1x",
    rdf: 0,
    rdm: 0,
  }
}

export function useDamageCalculator() {
  const { character } = useCharacter()
  const [config, setConfig] = useState<DamageConfig>(defaultConfig)
  const [result, setResult] = useState<DamageResult | null>(null)

  /** Valor atual do atributo selecionado, lido da ficha (0 se nenhum). */
  const getAttributeValue = useCallback(
    (key: AttributeKey | "none"): number => {
      if (key === "none") return 0
      return character.attributes[key] ?? 0
    },
    [character.attributes],
  )

  const update = useCallback(<K extends keyof DamageConfig>(key: K, value: DamageConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
  }, [])

  /** Ativa o MT e carrega o valor inicial da ficha. */
  const setMtEnabled = useCallback(
    (enabled: boolean) => {
      setConfig((prev) => ({
        ...prev,
        mtEnabled: enabled,
        mtValue: enabled ? (prev.mtValue || character.stats.mt || 0) : prev.mtValue,
      }))
    },
    [character.stats.mt],
  )

  /** Aplica um resultado de parser aos campos. */
  const applyParsed = useCallback((parsed: ParsedDamage) => {
    setConfig((prev) => {
      const next: DamageConfig = { ...prev }
      if (parsed.numDice > 0) next.numDice = parsed.numDice
      next.otherModifier = parsed.bonus
      if (parsed.damageTypeId) next.damageTypeId = parsed.damageTypeId
      next.attributeKey = parsed.attributeKey && isAttributeKey(parsed.attributeKey) ? parsed.attributeKey : "none"
      return next
    })
  }, [])

  const roll = useCallback(() => {
    const diceRolls = rollDice(config.numDice)
    const attributeValue = getAttributeValue(config.attributeKey)
    setResult(calculateDamage({ config, diceRolls, attributeValue }))
  }, [config, getAttributeValue])

  return {
    config,
    result,
    update,
    setMtEnabled,
    applyParsed,
    roll,
    attributeValue: getAttributeValue(config.attributeKey),
  }
}
