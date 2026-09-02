import { describe, expect, it } from "vitest"
import { calculateAttributeBonus, calculateAttributeMaximum, calculateCronosStats, calculateFameLevel, calculateFameProgress } from "../src/lib/calculations"
import { normalizeCronosCharacter } from "../src/lib/characterStorage"

describe("Cronos calculations", () => {
  it("applies synchronization attribute limits and the level-five specialization", () => {
    expect(calculateAttributeMaximum(1, "strength", null)).toBe(14)
    expect(calculateAttributeMaximum(4, "strength", null)).toBe(20)
    expect(calculateAttributeMaximum(5, "strength", "strength")).toBe(24)
    expect(calculateAttributeMaximum(5, "mind", "strength")).toBe(20)
  })

  it("uses attribute minus ten as its bonus", () => {
    expect(calculateAttributeBonus(7)).toBe(-3)
    expect(calculateAttributeBonus(14)).toBe(4)
  })

  it("derives Cronos resources with optional evolution", () => {
    const attributes = { strength: 14, dexterity: 12, mind: 11, will: 9, spirit: 13 }
    expect(calculateCronosStats(attributes, 2, false)).toMatchObject({ lifeMaximum: 14, manaMaximum: 13, sanityMaximum: 11, mentalResistance: 8, movement: 6.5, perception: 11, reflexes: 9 })
    expect(calculateCronosStats(attributes, 2, true)).toMatchObject({ lifeMaximum: 32, manaMaximum: 29 })
  })

  it("derives fame from scope thresholds", () => {
    expect(calculateFameLevel("local", 0)).toBe("Esquecido")
    expect(calculateFameLevel("local", 200)).toBe("Adorado")
    expect(calculateFameLevel("global", 8_000_000_000)).toBe("Venerado")
    expect(calculateFameProgress(999)).toEqual({ scope: "local", level: "Venerado" })
    expect(calculateFameProgress(1_000)).toEqual({ scope: "municipal", level: "Desconhecido" })
    expect(calculateFameProgress(500_000)).toEqual({ scope: "state", level: "Conhecido" })
  })

  it("clears attributes from another ruleset while migrating skills", () => {
    const character = normalizeCronosCharacter({
      skills: [{ id: "legacy-skill", name: "Acaso", attributeKey: "luck", points: 10, modifier: 0, locked: false }],
    } as never)
    expect(character.skills[0]).toMatchObject({ id: "legacy-skill", attributeKey: "", points: 10 })
  })
})
