import type { CharacterAttributes, CharacterBond, CharacterStats } from "@/types/character"

export interface BondQuality {
  level: number
  name: string
  minimumPoints: number
}

export const bondQualities: BondQuality[] = [
  { level: -5, name: "Ruptura", minimumPoints: Number.NEGATIVE_INFINITY },
  { level: -4, name: "Ódio", minimumPoints: -19 },
  { level: -3, name: "Ressentimento", minimumPoints: -14 },
  { level: -2, name: "Aversão", minimumPoints: -9 },
  { level: -1, name: "Desconfiança", minimumPoints: -4 },
  { level: 0, name: "Indiferença", minimumPoints: 0 },
  { level: 1, name: "Aceitação", minimumPoints: 5 },
  { level: 2, name: "Apreço", minimumPoints: 10 },
  { level: 3, name: "Confiança", minimumPoints: 20 },
  { level: 4, name: "Lealdade", minimumPoints: 30 },
  { level: 5, name: "Devoção", minimumPoints: 40 },
]

export function calculateBondQuality(pointsValue: number): BondQuality {
  const points = Math.trunc(Number.isFinite(pointsValue) ? pointsValue : 0)
  for (let index = bondQualities.length - 1; index >= 0; index -= 1) {
    if (points >= bondQualities[index].minimumPoints) return bondQualities[index]
  }
  return bondQualities[0]
}

export function calculateBondTest(
  attributes: CharacterAttributes,
  stats: CharacterStats,
  bond: Pick<CharacterBond, "points" | "modifier">,
): number {
  const quality = calculateBondQuality(bond.points)
  const firstImpressions = attributes.social + stats.firstImpressionsBonus
  return Math.trunc(attributes.mental + firstImpressions + quality.level + bond.modifier)
}

export function formatSigned(value: number): string {
  const integer = Math.trunc(Number.isFinite(value) ? value : 0)
  return `${integer >= 0 ? "+" : ""}${integer}`
}
