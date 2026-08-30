import type { AttributeKey } from "../types/character"
import type { ParsedDamage, ParsedDamagePart } from "../types/damage"
import { damageTypes } from "../data/damageTypes"
import { damageAttributes } from "../data/attributes"

/** Remove acentos e caracteres especiais, retornando minúsculas. */
function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}

/** Remove tudo que não for letra (para comparar palavras isoladas). */
function lettersOnly(text: string): string {
  return normalize(text).replace(/[^a-z]/g, "")
}

/**
 * Tenta casar uma palavra com um tipo de dano.
 * Aceita nome completo ou abreviação (mínimo 3 caracteres).
 */
function matchDamageType(word: string): string | null {
  const w = lettersOnly(word)
  if (w.length < 3) return null

  for (const dt of damageTypes) {
    const name = lettersOnly(dt.name)
    if (name === w || name.startsWith(w)) return dt.id
    for (const abbr of dt.abbreviations) {
      const a = lettersOnly(abbr)
      if (a.length >= 3 && (a === w || a.startsWith(w) || w.startsWith(a))) {
        return dt.id
      }
    }
  }
  return null
}

/**
 * Tenta casar uma palavra com um atributo.
 * Aceita nome completo, abreviação ou alias (mínimo 2 caracteres).
 */
function matchAttribute(word: string): AttributeKey | null {
  const w = lettersOnly(word)
  if (w.length < 2) return null

  for (const attr of damageAttributes) {
    const candidates = [lettersOnly(attr.name), lettersOnly(attr.abbr), ...attr.aliases.map(lettersOnly)]
    for (const c of candidates) {
      if (c.length >= 2 && (c === w || c.startsWith(w) || w.startsWith(c))) {
        return attr.key
      }
    }
  }
  return null
}

/**
 * Interpreta uma expressão de dano escrita livremente pelo usuário.
 *
 * Formato aproximado: {numDice}D +/- {bonus} {tipo} (+{atributo})
 * Exemplos válidos:
 *   3D+2 queimadura (+poder)
 *   3d + 2 queim (+pod)
 *   3D queimadura poder
 *   3D-1 queimadura (pod)
 *   20 queimadura
 */
export function parseDamageExpression(input: string): ParsedDamage {
  const result: ParsedDamage = {
    numDice: 0,
    bonus: 0,
    hasDamageValue: false,
    damageTypeId: null,
    attributeKey: null,
  }

  if (!input.trim()) return result

  const normalized = normalize(input)

  // 1. Número de dados: número imediatamente antes de "d".
  const diceMatch = normalized.match(/(\d+)\s*d/)
  if (diceMatch) {
    result.numDice = Number.parseInt(diceMatch[1], 10)
    result.hasDamageValue = true
  }

  // 2. Bônus: primeiro número (com sinal opcional) após o "D".
  if (diceMatch) {
    const afterDice = normalized.slice((diceMatch.index ?? 0) + diceMatch[0].length)
    const bonusMatch = afterDice.match(/^\s*([+-]?\s*\d+)/)
    if (bonusMatch) {
      result.bonus = Number.parseInt(bonusMatch[1].replace(/\s+/g, ""), 10)
    }
  } else {
    // Sem "D", um número inicial representa dano fixo já rolado em outro lugar.
    const flatDamageMatch = normalized.match(/^\s*([+-]?\s*\d+)/)
    if (flatDamageMatch) {
      result.bonus = Number.parseInt(flatDamageMatch[1].replace(/\s+/g, ""), 10)
      result.hasDamageValue = true
    }
  }

  // 3. Tipo de dano e atributo: varre as demais palavras.
  const words = input.split(/[\s()]+/).filter(Boolean)
  for (const word of words) {
    if (!result.damageTypeId) {
      const dt = matchDamageType(word)
      if (dt) {
        result.damageTypeId = dt
        continue
      }
    }
    if (!result.attributeKey) {
      const attr = matchAttribute(word)
      if (attr) {
        result.attributeKey = attr
      }
    }
  }

  return result
}

/**
 * Divide uma entrada em danos consecutivos. Vírgulas, a conjunção "e" e a
 * palavra opcional "adicional" são aceitas apenas como separadores humanos;
 * a ordem dos componentes é sempre preservada para o consumo de RDF/RDM.
 */
export function parseDamageExpressions(input: string): ParsedDamagePart[] {
  const starts = [...input.matchAll(/(?:^|[\s,;])([+-]?\s*\d+\s*d(?:\s*[+-]\s*\d+)?|[+-]?\s*\d+)(?=\s|$)/giu)]
    .map((match) => (match.index ?? 0) + match[0].indexOf(match[1]))

  if (starts.length <= 1) {
    const parsed = parseDamageExpression(input)
    return parsed.hasDamageValue ? [{ ...parsed, source: input.trim(), additional: false }] : []
  }

  return starts.flatMap((start, index) => {
    const end = starts[index + 1] ?? input.length
    const source = input
      .slice(start, end)
      .replace(/(?:[,;]|\be\b)\s*$/iu, "")
      .replace(/\badicional\b\s*$/iu, "")
      .trim()
    const parsed = parseDamageExpression(source)
    return parsed.hasDamageValue
      ? [{ ...parsed, source, additional: index > 0 }]
      : []
  })
}
