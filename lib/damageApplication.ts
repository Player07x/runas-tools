import { damageTypes, getDamageType } from "@/data/damageTypes"
import type { AppliedDamageChange, DamageResourceKey } from "@/types/damage"

export interface FixedDamage {
  amount: number
  damageTypeId: string
}

export interface DamageLayer {
  resource: "paExtra" | "pa" | "pv"
  current: number
  maximum?: number
  resistances: string[]
  weaknesses: string[]
  multiplier: string
  breakMultiplier?: string
}

export interface DamageApplicationConfig {
  damage: FixedDamage
  rdf: number
  rdm: number
  layers: DamageLayer[]
}

export interface DamageApplicationSimulation {
  changes: AppliedDamageChange[]
  steps: string[]
  resultText: string
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

function findDamageType(value: string) {
  const candidate = normalize(value).replace(/\s+/g, "")
  if (candidate.length < 3) return undefined
  return damageTypes.find((type) => {
    const names = [type.name, type.id, ...type.abbreviations].map((item) => normalize(item).replace(/\s+/g, ""))
    return names.some((name) => candidate === name || (candidate.length >= 3 && name.startsWith(candidate)))
  })
}

export function parseFixedDamage(input: string): { value: FixedDamage | null; error: string | null } {
  const match = input.trim().match(/^(\d+)\s+([^\d]+)$/u)
  if (!match) {
    return { value: null, error: "Use o formato “15 queimadura”, sem dados ou modificadores." }
  }
  const amount = Number.parseInt(match[1], 10)
  const damageType = findDamageType(match[2])
  if (!Number.isSafeInteger(amount) || amount < 0) {
    return { value: null, error: "Informe um dano inteiro igual ou maior que zero." }
  }
  if (!damageType) {
    return { value: null, error: "Tipo de dano não reconhecido. Use o nome ou uma abreviação com ao menos 3 letras." }
  }
  return { value: { amount, damageTypeId: damageType.id }, error: null }
}

function parseMultiplier(value: string): number | null {
  const normalized = value.trim().toLocaleLowerCase("pt-BR").replace(/x/g, "").replace(",", ".")
  if (!normalized) return 1
  const fraction = normalized.match(/^([0-9]+(?:\.[0-9]+)?)\s*\/\s*([0-9]+(?:\.[0-9]+)?)$/)
  if (fraction) {
    const denominator = Number(fraction[2])
    if (denominator === 0) return null
    const result = Number(fraction[1]) / denominator
    return result > 0 && Number.isFinite(result) ? result : null
  }
  const result = Number(normalized)
  return result > 0 && Number.isFinite(result) ? result : null
}

function tokenMatches(token: string, damageName: string, category: "physical" | "magical" | "special"): boolean {
  const value = normalize(token)
  const name = normalize(damageName)
  return value.includes(name) ||
    (category === "physical" && value.includes("todos os fisicos")) ||
    (category === "magical" && value.includes("todos os magicos"))
}

function resistanceMultiplier(tokens: string[], damageName: string, category: "physical" | "magical" | "special"): number {
  const match = tokens.find((token) => tokenMatches(token, damageName, category))
  if (!match) return 1
  if (/¼|1\s*\/\s*4/.test(match)) return 0.25
  return 0.5
}

function layerMultiplier(layer: DamageLayer, damageName: string, category: "physical" | "magical" | "special"): number | null {
  const custom = parseMultiplier(layer.multiplier)
  if (custom === null) return null
  const resistance = resistanceMultiplier(layer.resistances, damageName, category)
  const weakness = layer.weaknesses.some((token) => tokenMatches(token, damageName, category)) ? 2 : 1
  return resistance * weakness * custom
}

const resourceLabels: Record<DamageResourceKey, string> = {
  pv: "PV",
  pa: "PA",
  paExtra: "PA Extra",
  pe: "PE",
  peTemporary: "PE Temporário",
}

export function formatAppliedChanges(changes: AppliedDamageChange[]): string {
  return changes
    .filter((change) => change.amount !== 0)
    .map((change) => `${change.amount > 0 ? "+" : ""}${change.amount} ${resourceLabels[change.resource]}${change.note ? ` (${change.note})` : ""}`)
    .join(", ")
}

export function simulateDamageApplication(config: DamageApplicationConfig): { value: DamageApplicationSimulation | null; error: string | null } {
  const damageType = getDamageType(config.damage.damageTypeId)
  if (!damageType) return { value: null, error: "Tipo de dano inválido." }
  if (damageType.category === "special") {
    return { value: null, error: "Danos especiais ainda não possuem regra automática de aplicação." }
  }

  const reduction = Math.max(0, damageType.category === "physical" ? config.rdf : config.rdm)
  let remaining = Math.max(0, config.damage.amount - reduction)
  const steps = [`${config.damage.amount} ${damageType.name} − ${reduction} ${damageType.category === "physical" ? "RDF" : "RDM"} = ${remaining}`]
  const changes: AppliedDamageChange[] = []

  for (const layer of config.layers) {
    if (remaining <= 0) break
    const multiplier = layerMultiplier(layer, damageType.name, damageType.category)
    if (multiplier === null) return { value: null, error: "Revise os multiplicadores. Use valores como 2x, 1,5 ou 1/2." }
    const current = Math.max(0, Math.trunc(layer.current))
    const adjusted = remaining * multiplier
    const isPv = layer.resource === "pv"
    const loss = isPv ? Math.max(0, Math.round(adjusted)) : Math.min(current, Math.max(0, Math.round(adjusted)))
    let note: string | undefined

    if (!isPv && loss === current && current > 0) note = "quebrou"
    if (isPv && layer.maximum !== undefined && loss === Math.max(0, Math.trunc(layer.maximum))) note = "FULMINANTE 💀"
    if (loss > 0) changes.push({ resource: layer.resource, amount: -loss, note })
    steps.push(`${resourceLabels[layer.resource]}: ${remaining.toFixed(2).replace(/\.00$/, "")} × ${multiplier} = ${Math.round(adjusted)}; perda ${loss}`)

    if (isPv || adjusted <= current) {
      remaining = 0
      continue
    }

    const normalizedRemainder = Math.max(0, remaining - current / multiplier)
    const breakMultiplier = parseMultiplier(layer.breakMultiplier ?? "1")
    if (breakMultiplier === null) return { value: null, error: "Revise os multiplicadores de quebra." }
    remaining = normalizedRemainder * breakMultiplier
    steps.push(`Excedente normalizado ${normalizedRemainder.toFixed(2).replace(/\.00$/, "")} × quebra ${breakMultiplier} = ${remaining.toFixed(2).replace(/\.00$/, "")}`)
  }

  const resultText = formatAppliedChanges(changes)
  return {
    value: { changes, steps, resultText: resultText || "0 PV" },
    error: null,
  }
}

const resourceAliases: Record<string, DamageResourceKey> = {
  pv: "pv",
  pa: "pa",
  "pa extra": "paExtra",
  pe: "pe",
  "pe temporario": "peTemporary",
  "pe temp": "peTemporary",
  "pe extra": "peTemporary",
}

export function parseAppliedChanges(input: string): { value: AppliedDamageChange[] | null; error: string | null } {
  const chunks = input.split(",").map((part) => part.trim()).filter(Boolean)
  if (chunks.length === 0) return { value: null, error: "O resultado não pode ficar vazio." }
  const changes: AppliedDamageChange[] = []
  const used = new Set<DamageResourceKey>()

  for (const chunk of chunks) {
    const match = chunk.match(/^([+-]\d+)\s+(.+?)(?:\s+\(([^)]+)\))?$/u)
    if (!match) return { value: null, error: `Trecho inválido: “${chunk}”.` }
    const resource = resourceAliases[normalize(match[2])]
    if (!resource) return { value: null, error: `Estatística não reconhecida em “${chunk}”.` }
    if (used.has(resource)) return { value: null, error: `${resourceLabels[resource]} aparece mais de uma vez.` }
    used.add(resource)
    changes.push({ resource, amount: Number.parseInt(match[1], 10), note: match[3]?.trim() })
  }
  return { value: changes, error: null }
}

export function getDamageResourceLabel(resource: DamageResourceKey): string {
  return resourceLabels[resource]
}

export function isValidMultiplier(value: string): boolean {
  return parseMultiplier(value) !== null
}
