import type { AttributeKey } from "./character"

export type DamageCategory = "physical" | "magical"

export interface DamageType {
  id: string
  name: string
  abbreviations: string[]
  category: DamageCategory
}

/**
 * Resultado da interpretação de uma expressão de dano escrita pelo usuário.
 * Ex: "3D+2 queimadura (+poder)"
 */
export interface ParsedDamage {
  numDice: number
  bonus: number
  damageTypeId: string | null
  attributeKey: AttributeKey | null
}

/** Configuração completa usada pela calculadora de dano. */
export interface DamageConfig {
  numDice: number
  damageTypeId: string
  attributeKey: AttributeKey | "none"
  otherModifier: number
  mtEnabled: boolean
  mtValue: number
  otherMultiplier: string
  rdf: number
  rdm: number
}

export interface DamageBreakdownItem {
  label: string
  /** Operador exibido antes do valor: "+", "-", "×" */
  operator: "+" | "-" | "×"
  value: number
}

export interface DamageResult {
  total: number
  diceRolls: number[]
  diceSum: number
  breakdown: DamageBreakdownItem[]
  damageTypeName: string
}
