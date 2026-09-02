import { synchronizationAttributeMaximums } from "../data/attributes"
import { cronosFameScopeMinimums, cronosFameThresholds } from "../data/fame"
import { calculateLoadBase, calculateRealWeight, calculateScaleMultiplier, calculateSizeModifier } from "@runas/core/lib/characterCalculations"
import type { CronosAttributeKey, CronosAttributes, CronosCharacterInfo, CronosFameLevel, CronosFameScope, CronosSynchronization } from "../types/character"

export interface CronosStatSnapshot {
  lifeMaximum: number
  manaMaximum: number
  sanityMaximum: number
  mentalResistance: number
  movement: number
  perception: number
  reflexes: number
}

export function calculateAttributeBonus(attribute: number): number {
  return Math.trunc(attribute) - 10
}

export function calculateSynchronization(points: number): CronosSynchronization {
  const safePoints = Math.max(0, Math.trunc(Number.isFinite(points) ? points : 0))
  if (safePoints >= 70_080) return 5
  if (safePoints >= 17_520) return 4
  if (safePoints >= 4_380) return 3
  if (safePoints >= 1_095) return 2
  return 1
}

export function deriveCronosScaleInfo(info: CronosCharacterInfo, strength: number): CronosCharacterInfo {
  const scaleMultiplier = calculateScaleMultiplier(info.sizeReal, info.sizeBase)
  return {
    ...info,
    sizeModifier: calculateSizeModifier(info.sizeReal, info.sizeModifierBonus),
    scaleMultiplier,
    weightReal: calculateRealWeight(info.weightBase, scaleMultiplier, info.weightBonus),
    loadBase: calculateLoadBase(strength, strength, scaleMultiplier),
  }
}

export function calculateAttributeMaximum(
  synchronization: CronosSynchronization,
  key: CronosAttributeKey,
  synchronizationFiveAttribute: CronosAttributeKey | null,
): number {
  const regularMaximum = synchronizationAttributeMaximums[synchronization]
  return synchronization === 5 && synchronizationFiveAttribute === key ? 24 : regularMaximum
}

function evolutionGain(attribute: number, synchronization: CronosSynchronization, enabled: boolean): number {
  if (!enabled) return 0
  return synchronization * Math.max(1, 5 + calculateAttributeBonus(attribute))
}

export function calculateCronosStats(
  attributes: CronosAttributes,
  synchronization: CronosSynchronization,
  evolution: boolean,
  bonuses: { life?: number; mana?: number; sanity?: number; movement?: number } = {},
): CronosStatSnapshot {
  return {
    lifeMaximum: Math.max(0, attributes.strength + evolutionGain(attributes.strength, synchronization, evolution) + (bonuses.life ?? 0)),
    manaMaximum: Math.max(0, attributes.spirit + evolutionGain(attributes.spirit, synchronization, evolution) + (bonuses.mana ?? 0)),
    sanityMaximum: Math.max(0, attributes.mind + (bonuses.sanity ?? 0)),
    mentalResistance: attributes.mind - 3,
    movement: Math.max(0, Math.ceil((attributes.dexterity + attributes.strength) / 4 + (bonuses.movement ?? 0))),
    perception: attributes.mind,
    reflexes: attributes.dexterity - 3,
  }
}

const fameLevels: CronosFameLevel[] = ["Esquecido", "Desconhecido", "Conhecido", "Adorado", "Venerado"]

export function calculateFameLevel(scope: CronosFameScope, points: number): CronosFameLevel {
  const thresholds = cronosFameThresholds[scope] ?? cronosFameThresholds.local
  let result: CronosFameLevel = scope === "local" && points <= 0 ? "Esquecido" : "Desconhecido"
  for (const level of fameLevels) {
    const threshold = thresholds[level]
    if (threshold !== undefined && points >= threshold) result = level
  }
  return result
}

export function calculateFameProgress(points: number): { scope: CronosFameScope; level: CronosFameLevel } {
  const scope = cronosFameScopeMinimums.find((entry) => points >= entry.minimum)?.scope ?? "local"
  return { scope, level: calculateFameLevel(scope, points) }
}
