import { synchronizationAttributeMaximums } from "../data/attributes"
import { cronosFameScopeMinimums, cronosFameThresholds } from "../data/fame"
import type { CronosAttributeKey, CronosAttributes, CronosFameLevel, CronosFameScope, CronosSynchronization } from "../types/character"

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
    movement: Math.max(0, (attributes.dexterity + attributes.strength) / 4 + (bonuses.movement ?? 0)),
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
