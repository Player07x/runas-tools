import type { CharacterAttributes, CharacterInfo, CharacterStats } from "@/types/character"

function finite(value: number): number {
  return Number.isFinite(value) ? value : 0
}

function nonNegative(value: number): number {
  return Math.max(0, finite(value))
}

function parseLevel(value: string): number {
  const match = value.match(/\((-?\d+)\)\s*$/)
  return match ? Math.abs(Number(match[1])) : 0
}

function parseDecimal(value: string): number {
  const parsed = Number(value.trim().replace(",", "."))
  return Number.isFinite(parsed) ? parsed : 0
}

export interface CharacterStatSnapshot {
  pvMax: number
  paMax: number
  peMax: number
  paExtraMax: number
  determinationMax: number
  casualtyMax: number
  loadCapacity: number
  overweightLevel: number
  physicalPenalty: number
  movementPenalty: number
  overweightWarnings: string[]
  willTest: number
  chanceTest: number
  perceptionTest: number
  movement: number
  totalRdf: number
  totalRdm: number
}

export function calculateCharacterStatSnapshot(
  attributes: CharacterAttributes,
  info: CharacterInfo,
  stats: CharacterStats,
): CharacterStatSnapshot {
  const affinityLevel = parseLevel(info.affinity)
  const alignmentLevel = parseLevel(info.alignment)
  const karma = parseDecimal(info.karma)
  const karmaDirection = karma > 0 ? 1 : karma < 0 ? -1 : 0

  const pvMax = Math.max(0, attributes.physical + 2 * attributes.vitality + finite(stats.pvBonus))
  const paMax = Math.max(
    0,
    attributes.mystic + affinityLevel * Math.ceil(attributes.power / 2) + finite(stats.paBonus),
  )
  const peMax = Math.max(
    0,
    Math.ceil(attributes.mystic / 2) + affinityLevel * Math.ceil(attributes.power / 4) + finite(stats.peBonus),
  )
  const determinationMax = Math.max(
    0,
    Math.ceil((attributes.mystic + attributes.faith) / 2) +
      finite(stats.determinationBonus) +
      karmaDirection * alignmentLevel,
  )
  const casualtyMax = Math.max(
    0,
    Math.ceil((attributes.mystic + attributes.luck) / 2) +
      finite(stats.casualtyBonus) -
      karmaDirection * alignmentLevel,
  )

  const loadCapacity = Math.max(0, parseDecimal(info.loadBase) + finite(stats.loadBonus))
  const currentLoad = nonNegative(stats.currentLoad)
  const overweightLevel = currentLoad > 0 && loadCapacity > 0 ? Math.ceil(currentLoad / loadCapacity) : 0
  const physicalPenalty = overweightLevel * 2
  const mt = finite(stats.mt)
  const movementPenalty = Math.max(
    0,
    mt > 0
      ? Math.ceil(physicalPenalty * (mt === 1 ? 1.5 : mt))
      : mt < 0
        ? physicalPenalty + mt
        : physicalPenalty,
  )
  const overweightWarnings: string[] = []
  if (physicalPenalty >= attributes.physical + attributes.strength) overweightWarnings.push("Esmagado")
  if (physicalPenalty >= attributes.physical + attributes.dexterity) overweightWarnings.push("Imóvel")
  if (physicalPenalty >= attributes.physical + attributes.vitality) overweightWarnings.push("Desmaiado")

  return {
    pvMax,
    paMax,
    peMax,
    paExtraMax: Math.ceil(paMax / 2),
    determinationMax,
    casualtyMax,
    loadCapacity,
    overweightLevel,
    physicalPenalty,
    movementPenalty,
    overweightWarnings,
    willTest: Math.max(0, attributes.mystic + attributes.faith + finite(stats.willBonus)),
    chanceTest: Math.max(0, attributes.mystic + attributes.luck + finite(stats.chanceBonus)),
    perceptionTest: Math.max(0, attributes.mental + attributes.knowledge + finite(stats.perceptionBonus)),
    movement: Math.max(
      0,
      Math.ceil((attributes.physical + attributes.strength + attributes.dexterity + attributes.vitality) / 3) +
        finite(stats.movementBonus) -
        movementPenalty,
    ),
    totalRdf: nonNegative(stats.armorRdf) + nonNegative(stats.naturalRdf),
    totalRdm: nonNegative(stats.armorRdm) + nonNegative(stats.naturalRdm),
  }
}
