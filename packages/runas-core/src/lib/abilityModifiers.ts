import type { CharacterAbility } from "../types/character"

export interface AbilityModifierTotals {
  pv: number
  pa: number
  pe: number
  paExtra: number
  peTemporary: number
  focus: number
  movement: number
  firstImpressions: number
  determination: number
  casualty: number
  load: number
}

const emptyTotals: AbilityModifierTotals = {
  pv: 0,
  pa: 0,
  pe: 0,
  paExtra: 0,
  peTemporary: 0,
  focus: 0,
  movement: 0,
  firstImpressions: 0,
  determination: 0,
  casualty: 0,
  load: 0,
}

const aliases: Record<string, keyof AbilityModifierTotals> = {
  vida: "pv",
  pv: "pv",
  aura: "pa",
  pa: "pa",
  energia: "pe",
  pe: "pe",
  "aura extra": "paExtra",
  "pa extra": "paExtra",
  "energia temporaria": "peTemporary",
  "energia temporario": "peTemporary",
  "energia temp": "peTemporary",
  "pe temporario": "peTemporary",
  "pe temporaria": "peTemporary",
  "pe temp": "peTemporary",
  foco: "focus",
  "tempo de foco": "focus",
  desl: "movement",
  deslocamento: "movement",
  impressoes: "firstImpressions",
  "primeiras impressoes": "firstImpressions",
  determinacao: "determination",
  det: "determination",
  casualidade: "casualty",
  cas: "casualty",
  carga: "load",
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase("pt-BR")
    .replace(/\s+/g, " ")
}

export function parsePermanentModifiers(value: string): AbilityModifierTotals {
  const totals = { ...emptyTotals }
  for (const item of value.split(/[,;\n]+/)) {
    const match = item.trim().match(/^(.+?)\s*([+-])\s*(\d+)\s*$/)
    if (!match) continue
    const key = aliases[normalize(match[1])]
    if (!key) continue
    const amount = Number(match[3]) * (match[2] === "-" ? -1 : 1)
    totals[key] += amount
  }
  return totals
}

export function sumAbilityModifiers(abilities: CharacterAbility[] = []): AbilityModifierTotals {
  return abilities.reduce((totals, ability) => {
    const parsed = parsePermanentModifiers(ability.permanentModifiers)
    for (const key of Object.keys(totals) as (keyof AbilityModifierTotals)[]) {
      totals[key] += parsed[key]
    }
    return totals
  }, { ...emptyTotals })
}
