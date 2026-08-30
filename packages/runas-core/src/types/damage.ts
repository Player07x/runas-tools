import type { AttributeKey } from "./character"

export type DamageCategory = "physical" | "magical" | "special"

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
  hasDamageValue: boolean
  damageTypeId: string | null
  attributeKey: AttributeKey | null
}

/** Um componente de uma expressão que pode causar vários danos em ordem. */
export interface ParsedDamagePart extends ParsedDamage {
  /** Trecho original, útil para mensagens e edição na interface. */
  source: string
  /** O primeiro dano é o principal; os seguintes são adicionais. */
  additional: boolean
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
  /** Total antes de RDF/RDM, usado ao transferir a rolagem para a aplicação no alvo. */
  totalBeforeReduction: number
  diceRolls: number[]
  diceSum: number
  breakdown: DamageBreakdownItem[]
  damageTypeName: string
  damageTypeId: string
  /** Parcela de RDF/RDM efetivamente consumida por este dano. */
  reductionApplied?: number
}

export interface DamageSequenceResult {
  results: DamageResult[]
  total: number
  totalBeforeReduction: number
  remainingRdf: number
  remainingRdm: number
}

export type DamageResourceKey = "pv" | "pa" | "paExtra" | "pe" | "peTemporary"

export interface AppliedDamageChange {
  resource: DamageResourceKey
  amount: number
  note?: string
}

export type SpecialDamageTestKind = "vitality" | "sanity"

export interface SpecialDamageTest {
  kind: SpecialDamageTestKind
  label: string
  penalty: number
}
