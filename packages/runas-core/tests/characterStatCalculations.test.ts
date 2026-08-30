import { describe, expect, it } from "vitest"
import { calculateCharacterStatSnapshot } from "../src/lib/characterStatCalculations"
import type { CharacterAttributes, CharacterInfo, CharacterStats } from "../src/types/character"

const attributes = {
  physical: 7, mental: 7, mystic: 8,
  strength: 2, dexterity: 2, vitality: 3,
  intelligence: 2, knowledge: 2, social: 2,
  faith: 2, power: 4, luck: 2,
} satisfies CharacterAttributes

const info = {
  affinity: "Afinidade 2 (Incomum)", alignment: "Neutro (0)", karma: "0",
  loadBase: "14", scaleMultiplier: "1.0x",
} as CharacterInfo

function stats(pe: number): CharacterStats {
  return {
    pv: 10, pvBonus: 0, pa: 10, paBonus: 0, pe, peBonus: 0, peTemporary: 0,
    paExtra: 0, paExtraBonus: 0, resistances: [], weaknesses: [], elementId: "none", effects: "",
    determination: 0, determinationBonus: 0, casualty: 0, casualtyBonus: 0,
    focusCurrent: 0, focusModifier: 0, currentLoad: 0, loadBonus: 0,
    willModifier: 0, chanceModifier: 0, perceptionModifier: 0, movementBonus: 0,
    firstImpressionsBonus: 0, armorRdf: 0, armorRdm: 0, naturalRdf: 0, naturalRdm: 0, mt: 0,
    masteryImprovements: { aura: 0, life: 0, energy: 0, determination: 0, casualty: 0 },
  }
}

describe("calculateCharacterStatSnapshot", () => {
  it("limita PE temporário ao PE atual, não ao PE máximo", () => {
    const snapshot = calculateCharacterStatSnapshot(attributes, info, stats(3))
    expect(snapshot.peMax).toBeGreaterThan(3)
    expect(snapshot.peTemporaryMax).toBe(3)
  })

  it("normaliza PE atual acima do máximo ao calcular o teto temporário", () => {
    const snapshot = calculateCharacterStatSnapshot(attributes, info, stats(999))
    expect(snapshot.peTemporaryMax).toBe(snapshot.peMax)
  })

  it("calcula Primeiras Impressões como Mental + Social + modificadores", () => {
    const current = stats(3)
    current.firstImpressionsBonus = 2
    expect(calculateCharacterStatSnapshot(attributes, info, current).firstImpressions).toBe(11)
  })
})
