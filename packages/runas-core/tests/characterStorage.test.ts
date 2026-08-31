import { describe, expect, it } from "vitest"
import { CHARACTER_VERSION } from "../src/types/character"
import { createEmptyCharacter, normalizeCharacter, parseCharacterFile } from "../src/lib/characterStorage"

describe("characterStorage compartilhado", () => {
  it("preserva ids e vínculos ao normalizar uma exportação do Runas Tools", () => {
    const character = createEmptyCharacter()
    character.name = "Importável"
    character.skills.push({ id: "skill-custom", name: "Lâminas", attributeKey: "dexterity", points: 10, modifier: 2, locked: false })
    character.inventory.push({ id: "weapon", usage: "equipped", name: "Espada", type: "weapon", affinity: 1, bondPoints: 4, baseWeight: 2, quantity: 1, applyScaleWeight: false, damage: "2D cortante", rdf: 0, rdm: 0, equippedAsArmor: false, prCurrent: null, prMaximum: null, enchantmentSpellId: "", bondId: "", bondAbilityId: "", skillId: "skill-custom", description: "" })

    const normalized = normalizeCharacter(character)

    expect(normalized.skills.find((skill) => skill.id === "skill-custom")?.name).toBe("Lâminas")
    expect(normalized.inventory[0]?.skillId).toBe("skill-custom")
    expect(normalized.version).toBe(CHARACTER_VERSION)
  })

  it("migra envelopes antigos e completa coleções ausentes", () => {
    const parsed = parseCharacterFile(JSON.stringify({ version: 4, character: { version: 4, name: "Legado", info: { race: "Humano" }, attributes: { physical: 8 }, stats: { pv: 12 } } }))
    expect(parsed.name).toBe("Legado")
    expect(parsed.info.race).toBe("Humano")
    expect(parsed.skills.length).toBeGreaterThan(0)
    expect(parsed.inventory).toEqual([])
  })

  it("preserva peso zero e impede item Inato armazenado", () => {
    const character = createEmptyCharacter()
    character.inventory.push({ id: "innate", usage: "stored", name: "Garras", type: "innate", affinity: 0, bondPoints: 0, baseWeight: 0, quantity: 1, applyScaleWeight: false, damage: "2D cortante", rdf: 0, rdm: 0, equippedAsArmor: false, prCurrent: null, prMaximum: null, enchantmentSpellId: "", bondId: "", bondAbilityId: "", skillId: "", description: "" })
    const normalized = normalizeCharacter(character)
    expect(normalized.inventory[0]).toMatchObject({ type: "innate", usage: "equipped", baseWeight: 0 })
  })
})
