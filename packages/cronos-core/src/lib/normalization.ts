import { calculateAttributeMaximum } from "./calculations"
import { CRONOS_ATTRIBUTE_KEYS, type CronosAttributeKey, type CronosSynchronization } from "../types/character"

export function cronosAttributeMaximumsForCharacter(
  synchronization: CronosSynchronization,
  synchronizationFiveAttribute: CronosAttributeKey | null,
): Record<CronosAttributeKey, number> {
  return Object.fromEntries(
    CRONOS_ATTRIBUTE_KEYS.map((key) => [key, calculateAttributeMaximum(synchronization, key, synchronizationFiveAttribute)]),
  ) as Record<CronosAttributeKey, number>
}
