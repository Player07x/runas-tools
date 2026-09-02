export type CronosDamageCategory = "physical" | "magical" | "hybrid"

export interface CronosElement {
  id: string
  name: string
  color: string
  damageCategory: CronosDamageCategory
  resistances: string[]
  weaknesses: string[]
}

const cronosElementDefinitions = [
  { id: "agua", name: "Água", color: "#4f9bd9" },
  { id: "ar", name: "Ar", color: "#9bcbd1" },
  { id: "cristal", name: "Cristal", color: "#b57ddd" },
  { id: "fogo", name: "Fogo", color: "#d85b48" },
  { id: "gelo", name: "Gelo", color: "#80bce6" },
  { id: "luz", name: "Luz", color: "#e4c75b" },
  { id: "metal", name: "Metal", color: "#8a8e99" },
  { id: "natureza", name: "Natureza", color: "#65a55c" },
  { id: "pedra", name: "Pedra", color: "#8e7967" },
  { id: "puro", name: "Puro", color: "#e6e4d9" },
  { id: "raio", name: "Raio", color: "#e5bd3f" },
  { id: "sombra", name: "Sombra", color: "#665578" },
  { id: "terra", name: "Terra", color: "#b47a50" },
  { id: "toxico", name: "Tóxico", color: "#79a849" },
] as const

const damageCategories: Record<string, CronosDamageCategory> = {
  agua: "magical", ar: "magical", cristal: "hybrid", fogo: "magical", gelo: "hybrid", luz: "magical", metal: "physical",
  natureza: "hybrid", pedra: "physical", puro: "hybrid", raio: "magical", sombra: "magical", terra: "physical", toxico: "magical",
}

/** Relações do ponto de vista do dano atacante, conforme a tabela de Cronos. */
const damageMatchups: Record<string, { efficientAgainst: string[]; inefficientAgainst: string[] }> = {
  fogo: { efficientAgainst: ["natureza", "toxico", "gelo"], inefficientAgainst: ["pedra", "terra", "metal", "cristal"] },
  agua: { efficientAgainst: ["fogo", "toxico"], inefficientAgainst: ["gelo", "ar", "cristal"] },
  terra: { efficientAgainst: [], inefficientAgainst: [] },
  ar: { efficientAgainst: ["fogo", "toxico"], inefficientAgainst: ["metal", "natureza", "terra"] },
  natureza: { efficientAgainst: ["terra", "pedra"], inefficientAgainst: ["agua", "ar", "metal"] },
  raio: { efficientAgainst: ["natureza", "agua", "metal", "cristal"], inefficientAgainst: ["terra", "pedra", "gelo"] },
  gelo: { efficientAgainst: ["agua", "ar", "toxico"], inefficientAgainst: ["fogo", "metal", "pedra"] },
  pedra: { efficientAgainst: [], inefficientAgainst: [] },
  puro: { efficientAgainst: [], inefficientAgainst: [] },
  toxico: { efficientAgainst: ["agua", "ar", "natureza", "metal"], inefficientAgainst: ["terra", "pedra", "fogo", "raio", "gelo"] },
  luz: { efficientAgainst: ["sombra"], inefficientAgainst: [] },
  sombra: { efficientAgainst: ["luz"], inefficientAgainst: [] },
  metal: { efficientAgainst: ["natureza", "pedra", "terra", "gelo", "cristal"], inefficientAgainst: ["ar", "agua"] },
  cristal: { efficientAgainst: [], inefficientAgainst: [] },
}

export const cronosElements: CronosElement[] = cronosElementDefinitions.map((element) => ({
  ...element,
  damageCategory: damageCategories[element.id],
  weaknesses: cronosElementDefinitions.filter((attacker) => damageMatchups[attacker.id].efficientAgainst.includes(element.id)).map((attacker) => attacker.name),
  resistances: cronosElementDefinitions.filter((attacker) => damageMatchups[attacker.id].inefficientAgainst.includes(element.id)).map((attacker) => attacker.name),
}))

export const cronosElementOptions = [
  { value: "none", label: "Nenhum" },
  ...cronosElements.map((element) => ({ value: element.id, label: element.name })),
]

export function getCronosElement(id: string): CronosElement | undefined {
  return cronosElements.find((element) => element.id === id)
}
