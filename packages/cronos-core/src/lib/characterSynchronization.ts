import { calculateCronosStats, deriveCronosScaleInfo } from "./calculations"
import { normalizeCronosCharacter } from "./characterStorage"
import type { CronosCharacter } from "../types/character"

export function synchronizeCronosCharacter(character: CronosCharacter): CronosCharacter {
  const normalized = normalizeCronosCharacter(character)
  const info = deriveCronosScaleInfo(normalized.info, normalized.attributes.strength)
  const snapshot = calculateCronosStats(
    normalized.attributes,
    normalized.info.synchronization,
    normalized.info.evolution,
    {
      life: normalized.stats.lifeBonus,
      mana: normalized.stats.manaBonus,
      sanity: normalized.stats.sanityBonus,
      movement: normalized.stats.movementBonus,
    },
    info.sizeModifier,
  )
  return {
    ...normalized,
    info,
    stats: {
      ...normalized.stats,
      lifeCurrent: Math.min(snapshot.lifeMaximum, Math.max(0, normalized.stats.lifeCurrent)),
      manaCurrent: Math.min(snapshot.manaMaximum, Math.max(0, normalized.stats.manaCurrent)),
      sanityCurrent: Math.min(snapshot.sanityMaximum, Math.max(0, normalized.stats.sanityCurrent)),
      auraCurrent: normalized.stats.auraEnabled
        ? Math.min(normalized.stats.auraMaximum, Math.max(0, normalized.stats.auraCurrent))
        : 0,
    },
  }
}
