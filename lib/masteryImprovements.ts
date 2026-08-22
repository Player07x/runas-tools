import type { CharacterInfo, MasteryImprovements } from "@/types/character"

export type MasteryImprovementKey = keyof MasteryImprovements

export const masteryImprovementOptions: ReadonlyArray<{
  key: MasteryImprovementKey
  name: string
  cost: number
  description: string
  color: string
}> = [
  { key: "aura", name: "Aura", cost: 2, description: "+1 no PA máximo", color: "text-blue-300" },
  { key: "life", name: "Vida", cost: 3, description: "+1 no PV máximo", color: "text-red-300" },
  { key: "energy", name: "Energia", cost: 4, description: "+1 no PE máximo", color: "text-cyan-200" },
  { key: "determination", name: "Determinação", cost: 4, description: "+1 na Determinação máxima", color: "text-amber-200" },
  { key: "casualty", name: "Casualidade", cost: 4, description: "+1 na Casualidade máxima", color: "text-fuchsia-200" },
]

function parseAffinityLevel(value: string): number {
  const match = value.match(/\((-?\d+)\)\s*$/)
  return Math.max(0, Math.min(4, match ? Math.abs(Number(match[1])) : 0))
}

export function calculateMasteryImprovementPoints(info: Pick<CharacterInfo, "affinity" | "efficiency">): number {
  const efficiency = Number(info.efficiency.trim().replace("%", "").replace(",", "."))
  const efficiencyStep = Number.isFinite(efficiency) ? Math.max(0, Math.min(9, Math.floor(efficiency / 10))) : 0
  return parseAffinityLevel(info.affinity) * 10 + efficiencyStep
}

export function calculateSpentMasteryImprovementPoints(improvements: MasteryImprovements): number {
  return masteryImprovementOptions.reduce((total, option) => total + Math.max(0, Math.trunc(improvements[option.key])) * option.cost, 0)
}

export function createEmptyMasteryImprovements(): MasteryImprovements {
  return { aura: 0, life: 0, energy: 0, determination: 0, casualty: 0 }
}
