import type { CronosAttributeKey, CronosSynchronization } from "../types/character"

export const cronosAttributes: { key: CronosAttributeKey; name: string }[] = [
  { key: "strength", name: "Força" },
  { key: "dexterity", name: "Destreza" },
  { key: "mind", name: "Mente" },
  { key: "will", name: "Vontade" },
  { key: "spirit", name: "Espírito" },
]

export const synchronizationAttributeMaximums: Record<CronosSynchronization, number> = {
  1: 14,
  2: 16,
  3: 18,
  4: 20,
  5: 20,
}
