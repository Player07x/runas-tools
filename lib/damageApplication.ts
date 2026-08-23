import { damageTypes, getDamageType } from "@/data/damageTypes"
import { getTargetMtDamageMultiplier } from "@/lib/damageMt"
import type { AppliedDamageChange, DamageResourceKey, SpecialDamageTest } from "@/types/damage"

export interface FixedDamage {
  amount: number
  damageTypeId: string
  variant?: "inhaled" | "ingested" | "contact"
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
  mtEnabled: boolean
  mtValue: number
  rdf: number
  rdm: number
  attributeBonuses?: {
    vitality: number
    power: number
    faith: number
    luck: number
  }
  specialTestSucceeded?: boolean | null
  layers: DamageLayer[]
}

export interface DamageApplicationSimulation {
  changes: AppliedDamageChange[]
  steps: string[]
  resultText: string
  notices: string[]
  specialTest: SpecialDamageTest | null
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
  const typeText = normalize(match[2])
  const toxinVariant = typeText.includes("toxina")
    ? typeText.includes("inalada")
      ? "inhaled"
      : typeText.includes("ingerida")
        ? "ingested"
        : /(^| )(?:por |em )?contato( |$)/.test(typeText)
          ? "contact"
          : undefined
    : undefined
  const damageType = toxinVariant ? getDamageType("toxina") : findDamageType(match[2])
  if (!Number.isSafeInteger(amount) || amount < 0) {
    return { value: null, error: "Informe um dano inteiro igual ou maior que zero." }
  }
  if (!damageType) {
    return { value: null, error: "Tipo de dano não reconhecido. Use o nome ou uma abreviação com ao menos 3 letras." }
  }
  if (damageType.id === "toxina" && !toxinVariant) {
    return {
      value: null,
      error: "Informe a via da toxina: “Toxina Inalada”, “Toxina Ingerida” ou “Toxina por Contato”.",
    }
  }
  return { value: { amount, damageTypeId: damageType.id, variant: toxinVariant }, error: null }
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

  if (damageType.category === "special") return simulateSpecialDamage(config)

  const reduction = Math.max(0, damageType.category === "physical" ? config.rdf : config.rdm)
  const mtMultiplier = config.mtEnabled ? getTargetMtDamageMultiplier(config.mtValue) : 1
  const damageAfterMt = config.damage.amount * mtMultiplier
  let remaining = Math.max(0, damageAfterMt - reduction)
  const formattedAfterMt = damageAfterMt.toFixed(2).replace(/\.00$/, "")
  const formattedRemaining = remaining.toFixed(2).replace(/\.00$/, "")
  const steps = config.mtEnabled
    ? [
        `${config.damage.amount} ${damageType.name} × MT ${mtMultiplier} = ${formattedAfterMt}`,
        `${formattedAfterMt} − ${reduction} ${damageType.category === "physical" ? "RDF" : "RDM"} = ${formattedRemaining}`,
      ]
    : [`${config.damage.amount} ${damageType.name} − ${reduction} ${damageType.category === "physical" ? "RDF" : "RDM"} = ${formattedRemaining}`]
  const changes: AppliedDamageChange[] = []

  for (let layerIndex = 0; layerIndex < config.layers.length; layerIndex += 1) {
    const layer = config.layers[layerIndex]
    if (remaining <= 0) break
    const isPv = layer.resource === "pv"
    const current = Math.max(0, Math.trunc(layer.current))

    // Uma aura zerada não absorve dano e, portanto, também não aciona sua quebra.
    // O dano preservado segue integralmente para a próxima camada.
    if (!isPv && current === 0) {
      steps.push(`${resourceLabels[layer.resource]}: valor atual 0; camada ignorada`)
      continue
    }

    const multiplier = layerMultiplier(layer, damageType.name, damageType.category)
    if (multiplier === null) return { value: null, error: "Revise os multiplicadores. Use valores como 2x, 1,5 ou 1/2." }
    const adjusted = remaining * multiplier
    const loss = isPv ? Math.max(0, Math.round(adjusted)) : Math.min(current, Math.max(0, Math.round(adjusted)))
    let note: string | undefined

    if (!isPv && loss === current && current > 0) note = "quebrou"
    if (isPv && layer.maximum !== undefined && loss >= Math.max(0, Math.trunc(layer.maximum))) note = "FULMINANTE 💀"
    if (loss > 0) changes.push({ resource: layer.resource, amount: -loss, note })
    steps.push(`${resourceLabels[layer.resource]}: ${remaining.toFixed(2).replace(/\.00$/, "")} × ${multiplier} = ${Math.round(adjusted)}; perda ${loss}`)

    if (isPv || adjusted <= current) {
      remaining = 0
      continue
    }

    const normalizedRemainder = Math.max(0, remaining - current / multiplier)
    const nextLayer = config.layers[layerIndex + 1]
    const skipsEmptyCurrentAura =
      layer.resource === "paExtra" &&
      nextLayer?.resource === "pa" &&
      Math.max(0, Math.trunc(nextLayer.current)) === 0 &&
      config.layers[layerIndex + 2]?.resource === "pv"
    const breakMultiplier = parseMultiplier(
      skipsEmptyCurrentAura ? (nextLayer.breakMultiplier ?? "1") : (layer.breakMultiplier ?? "1"),
    )
    if (breakMultiplier === null) return { value: null, error: "Revise os multiplicadores de quebra." }
    remaining = normalizedRemainder * breakMultiplier
    const breakSource = skipsEmptyCurrentAura ? "quebra da PA atual" : "quebra"
    steps.push(`Excedente normalizado ${normalizedRemainder.toFixed(2).replace(/\.00$/, "")} × ${breakSource} ${breakMultiplier} = ${remaining.toFixed(2).replace(/\.00$/, "")}`)
  }

  const resultText = formatAppliedChanges(changes)
  return {
    value: { changes, steps, resultText: resultText || "0 PV", notices: [], specialTest: null },
    error: null,
  }
}

function rounded(value: number): string {
  return value.toFixed(2).replace(/\.00$/, "")
}

function attributeBonus(config: DamageApplicationConfig, key: keyof NonNullable<DamageApplicationConfig["attributeBonuses"]>): number {
  return Math.max(0, Math.trunc(config.attributeBonuses?.[key] ?? 0))
}

function simulateDirectPvDamage(
  config: DamageApplicationConfig,
  amount: number,
  steps: string[],
  note?: string,
): AppliedDamageChange[] {
  const loss = Math.max(0, Math.round(amount))
  steps.push(`Dano direto à vida: perda ${loss} PV`)
  return loss > 0 ? [{ resource: "pv", amount: -loss, note }] : []
}

function directSpecialAmount(config: DamageApplicationConfig, amount: number, steps: string[]): number | null {
  const mtMultiplier = config.mtEnabled ? getTargetMtDamageMultiplier(config.mtValue) : 1
  const pvLayer = config.layers.find((layer) => layer.resource === "pv")
  const otherMultiplier = parseMultiplier(pvLayer?.multiplier ?? "1")
  if (otherMultiplier === null) return null
  const result = amount * mtMultiplier * otherMultiplier
  steps.push(`${amount} × MT ${mtMultiplier} × outro multiplicador ${otherMultiplier} = ${rounded(result)}`)
  return result
}

function simulateStandardSpecialDamage(
  config: DamageApplicationConfig,
  amount: number,
  ignoreAuraBreak: boolean,
  steps: string[],
): { changes: AppliedDamageChange[]; pvLoss: number; auraLoss: number } | { error: string } {
  const damageType = getDamageType(config.damage.damageTypeId)!
  const mtMultiplier = config.mtEnabled ? getTargetMtDamageMultiplier(config.mtValue) : 1
  let remaining = Math.max(0, amount * mtMultiplier)
  steps.push(config.mtEnabled
    ? `${amount} ${damageType.name} × MT ${mtMultiplier} = ${rounded(remaining)}; RD ignorada`
    : `${amount} ${damageType.name}; RD ignorada`)
  const changes: AppliedDamageChange[] = []
  let auraLoss = 0

  for (let layerIndex = 0; layerIndex < config.layers.length; layerIndex += 1) {
    const layer = config.layers[layerIndex]
    if (remaining <= 0) break
    const isPv = layer.resource === "pv"
    const current = Math.max(0, Math.trunc(layer.current))
    if (!isPv && current === 0) {
      steps.push(`${resourceLabels[layer.resource]}: valor atual 0; camada ignorada`)
      continue
    }
    const multiplier = layerMultiplier(layer, damageType.name, damageType.category)
    if (multiplier === null) return { error: "Revise os multiplicadores. Use valores como 2x, 1,5 ou 1/2." }
    const adjusted = remaining * multiplier
    const loss = isPv ? Math.max(0, Math.round(adjusted)) : Math.min(current, Math.max(0, Math.round(adjusted)))
    let note: string | undefined
    if (!isPv && loss === current && current > 0) note = "quebrou"
    if (isPv && layer.maximum !== undefined && loss >= Math.max(0, Math.trunc(layer.maximum))) note = "FULMINANTE 💀"
    if (loss > 0) changes.push({ resource: layer.resource, amount: -loss, note })
    if (!isPv) auraLoss += loss
    steps.push(`${resourceLabels[layer.resource]}: ${rounded(remaining)} × ${multiplier} = ${Math.round(adjusted)}; perda ${loss}`)
    if (isPv || adjusted <= current) {
      remaining = 0
      continue
    }
    const normalizedRemainder = Math.max(0, remaining - current / multiplier)
    const nextLayer = config.layers[layerIndex + 1]
    const skipsEmptyCurrentAura = layer.resource === "paExtra" && nextLayer?.resource === "pa" &&
      Math.max(0, Math.trunc(nextLayer.current)) === 0 && config.layers[layerIndex + 2]?.resource === "pv"
    const breakMultiplier = ignoreAuraBreak
      ? 1
      : parseMultiplier(skipsEmptyCurrentAura ? (nextLayer.breakMultiplier ?? "1") : (layer.breakMultiplier ?? "1"))
    if (breakMultiplier === null) return { error: "Revise os multiplicadores de quebra." }
    remaining = normalizedRemainder * breakMultiplier
    steps.push(`Excedente normalizado ${rounded(normalizedRemainder)} × ${ignoreAuraBreak ? "quebra ignorada" : "quebra"} ${breakMultiplier} = ${rounded(remaining)}`)
  }

  return {
    changes,
    auraLoss,
    pvLoss: Math.max(0, -(changes.find((change) => change.resource === "pv")?.amount ?? 0)),
  }
}

function simulateSpecialDamage(config: DamageApplicationConfig): { value: DamageApplicationSimulation | null; error: string | null } {
  const damageType = getDamageType(config.damage.damageTypeId)!
  const notices: string[] = []
  const steps: string[] = []
  let specialTest: SpecialDamageTest | null = null
  let changes: AppliedDamageChange[] = []
  let pvLoss = 0
  const rawDamage = Math.max(0, config.damage.amount)

  if (damageType.id === "temporal") {
    notices.push(`Seu personagem envelhecerá ${rawDamage} ano(s). Após 1 minuto, se o personagem não morrer de velhice, você volta à sua idade atual.`)
  } else if (damageType.id === "virtual") {
    const adjusted = directSpecialAmount(config, rawDamage, steps)
    if (adjusted === null) return { value: null, error: "Revise o Outro Multiplicador da Vida." }
    const breach = Math.max(0, Math.round(adjusted))
    notices.push(`O personagem receberá “Brecha ${breach}” (se esse efeito tiver um nível igual ou maior que seu PA atual, tanto sua aura extra quanto a atual ficam desativadas até o fim do seu próximo turno; o efeito cai a zero após desativar suas auras).`)
  } else if (damageType.id === "psiquica") {
    const insanity = config.specialTestSucceeded ? Math.floor(rawDamage / 2) : rawDamage
    notices.push(`O personagem receberá “Insanidade ${insanity}”${config.specialTestSucceeded === true ? " após o sucesso no Teste de Sanidade" : config.specialTestSucceeded === false ? " após a falha no Teste de Sanidade" : ", ou metade desse valor (arredondada para baixo) em um sucesso no Teste de Sanidade"}.`)
    specialTest = { kind: "sanity", label: "Teste de Sanidade", penalty: 0 }
  } else if (damageType.id === "toxina") {
    if (!config.damage.variant) return { value: null, error: "Informe a via da toxina." }
    notices.push("O personagem receberá “Envenenado”.")
    const adjusted = directSpecialAmount(config, rawDamage, steps)
    if (adjusted === null) return { value: null, error: "Revise o Outro Multiplicador da Vida." }
    if (config.damage.variant === "contact") {
      const hasAura = config.layers.some((layer) => layer.resource !== "pv" && Math.max(0, layer.current) > 0)
      if (hasAura) changes = simulateDirectPvDamage(config, adjusted, steps)
      else steps.push("Toxina por Contato: PA atual e PA Extra estão em 0; dano causado 0")
    } else {
      const divisor = config.damage.variant === "inhaled" ? 4 : 2
      const penalty = Math.floor(adjusted / divisor)
      const fullLoss = Math.round(adjusted)
      const loss = config.specialTestSucceeded ? Math.floor(fullLoss / 2) : fullLoss
      changes = simulateDirectPvDamage(config, loss, steps)
      notices.unshift(`Em um sucesso no Teste de Vitalidade − ${penalty}, você perderá ${Math.floor(fullLoss / 2)} PV ao invés de ${fullLoss} PV.`)
      specialTest = { kind: "vitality", label: "Teste de Vitalidade", penalty }
    }
    pvLoss = Math.max(0, -(changes.find((change) => change.resource === "pv")?.amount ?? 0))
  } else {
    let amount = rawDamage
    if (damageType.id === "necrotico") amount = Math.max(0, amount - attributeBonus(config, "vitality"))
    if (damageType.id === "espectral") amount = Math.max(0, amount - attributeBonus(config, "power"))
    if (damageType.id === "estelar") amount = Math.max(0, amount - attributeBonus(config, "faith"))
    if (damageType.id === "abissal") amount = Math.max(0, amount - attributeBonus(config, "luck"))
    if (amount !== rawDamage) steps.push(`${rawDamage} − bônus do atributo ${rawDamage - amount} = ${amount}`)
    const standard = simulateStandardSpecialDamage(
      config,
      amount,
      damageType.id === "espectral" || damageType.id === "cosmico",
      steps,
    )
    if ("error" in standard) return { value: null, error: standard.error }
    changes = standard.changes
    pvLoss = standard.pvLoss
    if (damageType.id === "espectral") {
      const extraPvLoss = Math.floor(standard.auraLoss / 2)
      if (extraPvLoss > 0) {
        const currentPvChange = changes.find((change) => change.resource === "pv")
        if (currentPvChange) currentPvChange.amount -= extraPvLoss
        else changes.push({ resource: "pv", amount: -extraPvLoss })
        pvLoss += extraPvLoss
        steps.push(`${standard.auraLoss} PA perdidos causam mais ${extraPvLoss} PV de perda`)
      }
    }
  }

  const currentPv = Math.max(0, config.layers.find((layer) => layer.resource === "pv")?.current ?? 0)
  const maximumPv = config.layers.find((layer) => layer.resource === "pv")?.maximum
  if (damageType.id === "radiacao" && pvLoss > 0) {
    const penalty = Math.floor(pvLoss / 2)
    notices.push(`Faça um Teste de Vitalidade − ${penalty}. Em falha, o personagem recebe a doença “Câncer”.`)
    specialTest = { kind: "vitality", label: "Teste de Vitalidade", penalty }
  }
  if (damageType.id === "absorcao" && pvLoss > 0 && currentPv - pvLoss <= 0) {
    const healing = Math.ceil((maximumPv ?? 0) / 2)
    notices.push(`Ao cair a 0 PV ou menos, o personagem é absorvido. Se alguém causou esse dano, essa pessoa recupera ${healing} PV atuais.`)
  }
  if (damageType.id === "necrotico" && pvLoss > 0) {
    notices.push(`Receba o efeito “Necrosado ${pvLoss}” (para cada 1 PV que o personagem recuperar, remova 1 nível desse efeito em vez de recuperar esse PV).`)
  }
  if (damageType.id === "estelar" && pvLoss > 0 && currentPv - pvLoss <= 0) {
    notices.push("Ao cair a 0 PV ou menos, o personagem é purificado. Um personagem purificado perde qualquer traço de corrupção na alma, mente e corpo.")
  }
  if (damageType.id === "abissal" && pvLoss > 0 && currentPv - pvLoss <= 0) {
    notices.push("Ao cair a 0 PV ou menos, o personagem é corrompido. Verifique a doença “Corrupção” para descobrir os efeitos.")
  }

  const resultText = formatAppliedChanges(changes)
  return {
    value: { changes, steps, resultText, notices, specialTest },
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
