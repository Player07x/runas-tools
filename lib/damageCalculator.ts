import type { DamageBreakdownItem, DamageConfig, DamageResult } from "@/types/damage"
import { getDamageType } from "@/data/damageTypes"

/** Rola N dados de 6 faces no navegador. */
export function rollDice(numDice: number): number[] {
  const n = Math.max(0, Math.floor(numDice) || 0)
  const rolls: number[] = []
  for (let i = 0; i < n; i++) {
    rolls.push(Math.floor(Math.random() * 6) + 1)
  }
  return rolls
}

export interface DamageBonusConversion {
  numDice: number
  modifier: number
  convertedDice: number
}

/** Converte cada +4 acumulado entre os bônus positivos em +1D. */
export function convertDamageBonusesToDice(baseDice: number, modifiers: number[]): DamageBonusConversion {
  const normalizedBaseDice = Math.max(0, Math.floor(baseDice) || 0)
  const combinedModifier = modifiers.reduce(
    (total, modifier) => total + (Number.isFinite(modifier) ? modifier : 0),
    0,
  )

  // Com 0D, o valor é dano já rolado e não deve gerar novos dados.
  if (normalizedBaseDice === 0) {
    return { numDice: 0, modifier: combinedModifier, convertedDice: 0 }
  }

  const positiveBonus = modifiers.reduce(
    (total, modifier) => total + (Number.isFinite(modifier) ? Math.max(0, modifier) : 0),
    0,
  )
  const penalties = modifiers.reduce(
    (total, modifier) => total + (Number.isFinite(modifier) ? Math.min(0, modifier) : 0),
    0,
  )
  const convertedDice = Math.floor(positiveBonus / 4)
  const remainingBonus = positiveBonus - convertedDice * 4

  return {
    numDice: normalizedBaseDice + convertedDice,
    modifier: remainingBonus + penalties,
    convertedDice,
  }
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
 * ( dados + bônus restante - reduçãoDeDano ) * MT * outroMultiplicador
 * Cada +4 acumulado entre atributo e outro modificador é convertido em +1D.
 * Danos especiais não recebem redução. MT +1 corresponde a 1,5x.
 */
export function calculateDamage({ config, diceRolls, attributeValue }: CalculateArgs): DamageResult {
  const diceSum = diceRolls.reduce((acc, n) => acc + n, 0)

  const damageType = getDamageType(config.damageTypeId)
  const category = damageType?.category
  const isPhysical = category === "physical"
  const reduction = category === "special" ? 0 : isPhysical ? config.rdf : config.rdm

  const mtMultiplier = config.mtEnabled
    ? config.mtValue === 1
      ? 1.5
      : config.mtValue || 1
    : 1
  const otherMultiplier = normalizeMultiplier(config.otherMultiplier)

  const attr = config.attributeKey !== "none" ? attributeValue || 0 : 0
  const modifier = config.otherModifier || 0
  const bonusConversion = convertDamageBonusesToDice(config.numDice, [attr, modifier])
  const remainingModifier = bonusConversion.modifier

  const base = diceSum + remainingModifier - (reduction || 0)
  const rawTotal = base * mtMultiplier * otherMultiplier
  const total = Number.isFinite(rawTotal) ? Math.round(rawTotal) : 0

  const diceLabel = bonusConversion.convertedDice > 0
    ? `${diceRolls.length} dados (${bonusConversion.convertedDice} de bônus)`
    : `${diceRolls.length} dados`
  const breakdown: DamageBreakdownItem[] = [{ label: diceLabel, operator: "+", value: diceSum }]

  if (remainingModifier !== 0) {
    breakdown.push({
      label: "modificador restante",
      operator: remainingModifier < 0 ? "-" : "+",
      value: Math.abs(remainingModifier),
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
