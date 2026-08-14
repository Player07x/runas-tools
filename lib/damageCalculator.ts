import type { DamageBreakdownItem, DamageConfig, DamageResult } from "@/types/damage"
import { getDamageType } from "@/data/damageTypes"
import { getAttributeDef } from "@/data/attributes"

/** Rola N dados de 6 faces no navegador. */
export function rollDice(numDice: number): number[] {
  const n = Math.max(0, Math.floor(numDice) || 0)
  const rolls: number[] = []
  for (let i = 0; i < n; i++) {
    rolls.push(Math.floor(Math.random() * 6) + 1)
  }
  return rolls
}

/**
 * Normaliza um multiplicador informado como texto.
 * Aceita: "2", "1.5", "1/2", "1/4". Retorna 1 se inválido.
 */
export function normalizeMultiplier(raw: string): number {
  const text = (raw ?? "").trim().replace(/x/gi, "").replace(",", ".")
  if (!text) return 1

  if (text.includes("/")) {
    const [num, den] = text.split("/").map((p) => Number.parseFloat(p.trim()))
    if (!Number.isFinite(num) || !Number.isFinite(den) || den === 0) return 1
    return num / den
  }

  const value = Number.parseFloat(text)
  return Number.isFinite(value) ? value : 1
}

interface CalculateArgs {
  config: DamageConfig
  diceRolls: number[]
  /** Valor do atributo obtido da ficha (0 se "none" ou inexistente). */
  attributeValue: number
}

/**
 * Aplica a fórmula de dano:
 * ( dados + atributo + outroModificador - reduçãoDeDano ) * MT * outroMultiplicador
 */
export function calculateDamage({ config, diceRolls, attributeValue }: CalculateArgs): DamageResult {
  const diceSum = diceRolls.reduce((acc, n) => acc + n, 0)

  const damageType = getDamageType(config.damageTypeId)
  const isPhysical = damageType?.category === "physical"
  const reduction = isPhysical ? config.rdf : config.rdm

  const mtMultiplier = config.mtEnabled ? config.mtValue || 0 : 1
  const otherMultiplier = normalizeMultiplier(config.otherMultiplier)

  const attr = config.attributeKey !== "none" ? attributeValue || 0 : 0
  const modifier = config.otherModifier || 0

  const base = diceSum + attr + modifier - (reduction || 0)
  const rawTotal = base * mtMultiplier * otherMultiplier
  const total = Number.isFinite(rawTotal) ? Math.round(rawTotal) : 0

  const breakdown: DamageBreakdownItem[] = [{ label: `${diceRolls.length} dados`, operator: "+", value: diceSum }]

  if (config.attributeKey !== "none" && attr !== 0) {
    const def = getAttributeDef(config.attributeKey)
    breakdown.push({ label: def?.name ?? "Atributo", operator: "+", value: attr })
  }
  if (modifier !== 0) {
    breakdown.push({
      label: "modificador",
      operator: modifier < 0 ? "-" : "+",
      value: Math.abs(modifier),
    })
  }
  if ((reduction || 0) !== 0) {
    breakdown.push({
      label: isPhysical ? "RDF" : "RDM",
      operator: "-",
      value: reduction,
    })
  }
  if (config.mtEnabled) {
    breakdown.push({ label: "MT", operator: "×", value: mtMultiplier })
  }
  if (otherMultiplier !== 1) {
    breakdown.push({ label: "multiplicador", operator: "×", value: otherMultiplier })
  }

  return {
    total,
    diceRolls,
    diceSum,
    breakdown,
    damageTypeName: damageType?.name ?? "",
  }
}
