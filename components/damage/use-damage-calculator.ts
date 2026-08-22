"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import type { AttributeKey } from "@/types/character"
import type { DamageConfig, DamageResult, ParsedDamage } from "@/types/damage"
import { damageTypes } from "@/data/damageTypes"
import { useCharacter } from "@/components/character/character-provider"
import { calculateDamage, convertDamageBonusesToDice, rollDice } from "@/lib/damageCalculator"
import { isAttributeKey } from "@/lib/attributeOptions"
import { parseDamageExpression } from "@/lib/damageParser"

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

function configWithParsed(previous: DamageConfig, parsed: ParsedDamage): DamageConfig {
  const next: DamageConfig = { ...previous }
  if (parsed.hasDamageValue) {
    const conversion = convertDamageBonusesToDice(parsed.numDice, [parsed.bonus])
    next.numDice = conversion.numDice
    next.otherModifier = conversion.modifier
  } else {
    next.otherModifier = parsed.bonus
  }
  if (parsed.damageTypeId) next.damageTypeId = parsed.damageTypeId
  next.attributeKey = parsed.attributeKey && isAttributeKey(parsed.attributeKey) ? parsed.attributeKey : "none"
  return next
}

export function useDamageCalculator() {
  const { character } = useCharacter()
  const searchParams = useSearchParams()
  const [config, setConfig] = useState<DamageConfig>(defaultConfig)
  const [result, setResult] = useState<DamageResult | null>(null)
  const handledRollToken = useRef<string | null>(null)
  const requestedDamage = searchParams.get("damage") ?? ""
  const requestedRollToken = searchParams.get("roll")
  const requestedApplyMt = searchParams.get("applyMt") === "yes"

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
    setConfig((prev) => configWithParsed(prev, parsed))
  }, [])

  useEffect(() => {
    if (!requestedDamage || !requestedRollToken || handledRollToken.current === requestedRollToken) return
    handledRollToken.current = requestedRollToken
    const next = configWithParsed(config, parseDamageExpression(requestedDamage))
    if (requestedApplyMt) {
      next.mtEnabled = true
      next.mtValue = character.stats.mt || 0
    }
    const attributeValue = next.attributeKey === "none" ? 0 : character.attributes[next.attributeKey] ?? 0
    const conversion = convertDamageBonusesToDice(next.numDice, [attributeValue, next.otherModifier])
    setConfig(next)
    setResult(calculateDamage({ config: next, diceRolls: rollDice(conversion.numDice), attributeValue }))
  }, [character.attributes, character.stats.mt, config, requestedApplyMt, requestedDamage, requestedRollToken])

  const roll = useCallback(() => {
    const attributeValue = getAttributeValue(config.attributeKey)
    const conversion = convertDamageBonusesToDice(config.numDice, [attributeValue, config.otherModifier])
    const diceRolls = rollDice(conversion.numDice)
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
    requestedDamage,
  }
}
