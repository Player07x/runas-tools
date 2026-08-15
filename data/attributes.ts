import type { AttributeKey } from "@/types/character"

export type AttributeGroupId = "physical" | "mental" | "mystic"
export type AttributeColor = "yellow" | "blue" | "purple"

export interface AttributeDef {
  key: AttributeKey
  name: string
  abbr: string
  /** Aliases extras aceitos pelo parser (sem acento, minúsculo). */
  aliases: string[]
}

export interface AttributeGroupDef {
  id: AttributeGroupId
  name: string
  color: AttributeColor
  primary: AttributeDef
  attributes: AttributeDef[]
}

export const attributeGroups: AttributeGroupDef[] = [
  {
    id: "physical",
    name: "Físico",
    color: "yellow",
    primary: { key: "physical", name: "Físico", abbr: "FÍS", aliases: ["fis", "fisico"] },
    attributes: [
      { key: "strength", name: "Força", abbr: "FOR", aliases: ["for", "forca"] },
      { key: "dexterity", name: "Destreza", abbr: "DES", aliases: ["des", "destreza"] },
      { key: "vitality", name: "Vitalidade", abbr: "VIT", aliases: ["vit", "vitalidade"] },
    ],
  },
  {
    id: "mental",
    name: "Mental",
    color: "blue",
    primary: { key: "mental", name: "Mental", abbr: "MEN", aliases: ["men", "mental"] },
    attributes: [
      { key: "intelligence", name: "Inteligência", abbr: "INT", aliases: ["int", "inteligencia"] },
      { key: "knowledge", name: "Conhecimento", abbr: "CON", aliases: ["con", "conhecimento"] },
      { key: "social", name: "Social", abbr: "SOC", aliases: ["soc", "social"] },
    ],
  },
  {
    id: "mystic",
    name: "Místico",
    color: "purple",
    primary: { key: "mystic", name: "Místico", abbr: "MÍS", aliases: ["mis", "mistico"] },
    attributes: [
      { key: "faith", name: "Fé", abbr: "FÉ", aliases: ["fe", "fé"] },
      { key: "power", name: "Poder", abbr: "POD", aliases: ["pod", "poder"] },
      { key: "luck", name: "Sorte", abbr: "SOR", aliases: ["sor", "sorte"] },
    ],
  },
]

/** Lista plana de todos os atributos, útil para selects e parser. */
export const allAttributes: AttributeDef[] = attributeGroups.flatMap((g) => [g.primary, ...g.attributes])

/** Atributos que podem ser somados ao dano; exclui os três atributos primários. */
export const damageAttributes: AttributeDef[] = attributeGroups.flatMap((group) => group.attributes)

export function getAttributeDef(key: AttributeKey): AttributeDef | undefined {
  return allAttributes.find((a) => a.key === key)
}
