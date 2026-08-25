import type { AttributeDef } from "@runas/core/data/attributes"
import type { SecondaryAttributeKey } from "@runas/core/types/character"

export interface ImportedSkill {
  name: string
  attributeKey: SecondaryAttributeKey
  points: number
}

export interface SkillImportResult {
  skills: ImportedSkill[]
  errors: string[]
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

function splitColumns(line: string): string[] {
  if (line.includes("|")) return line.split("|").map((column) => column.trim()).filter(Boolean)
  if (line.includes("\t")) return line.split(/\t+/).map((column) => column.trim()).filter(Boolean)
  return line.split(/\s{2,}/).map((column) => column.trim()).filter(Boolean)
}

function structuredColumns(line: string): string[] | null {
  const fiveColumns = line.match(/^(.+?)\s+(-?\d+(?:[.,]\d+)?)\s+([+-]?\d+)\s+([\p{L}]+)\s+(-?\d+)$/u)
  if (fiveColumns) return fiveColumns.slice(1)

  const threeColumns = line.match(/^(.+?)\s+([\p{L}]+)\s+(-?\d+)$/u)
  return threeColumns ? threeColumns.slice(1) : null
}

function resolveAttribute(value: string, attributes: AttributeDef[]): SecondaryAttributeKey | null {
  const normalized = normalize(value)
  const match = attributes.find((attribute) => (
    [attribute.name, attribute.abbr, ...attribute.aliases].some((candidate) => normalize(candidate) === normalized)
  ))
  return match?.key as SecondaryAttributeKey | null
}

function isHeader(columns: string[]): boolean {
  const normalized = columns.map(normalize)
  return normalized.some((column) => column === "nome" || column === "nome da pericia")
    && normalized.includes("atributo")
    && normalized.some((column) => column === "ponto" || column === "pontos")
}

export function parseSkillImport(text: string, attributes: AttributeDef[]): SkillImportResult {
  const skills: ImportedSkill[] = []
  const errors: string[] = []

  text.split(/\r?\n/).forEach((sourceLine, index) => {
    const line = sourceLine.trim()
    if (!line) return
    const normalizedLine = normalize(line)
    if (normalizedLine.startsWith("nome da pericia") && normalizedLine.includes("atributo") && normalizedLine.includes("ponto")) return

    let columns = splitColumns(line)
    if (columns.length !== 3 && columns.length < 5) columns = structuredColumns(line) ?? columns
    if (isHeader(columns)) return

    const selected = columns.length >= 5
      ? { name: columns[0], attribute: columns[3], points: columns[4] }
      : columns.length === 3
        ? { name: columns[0], attribute: columns[1], points: columns[2] }
        : null

    if (!selected) {
      errors.push(`Linha ${index + 1}: use Nome | Atributo | Ponto ou Nome | Teste | Nível | Atributo | Ponto.`)
      return
    }

    const name = selected.name.trim().slice(0, 30)
    const attributeKey = resolveAttribute(selected.attribute, attributes)
    const points = Number(selected.points.replace(",", "."))
    if (!name) {
      errors.push(`Linha ${index + 1}: informe o nome da perícia.`)
    } else if (!attributeKey) {
      errors.push(`Linha ${index + 1}: atributo “${selected.attribute}” não reconhecido.`)
    } else if (!Number.isInteger(points) || points < 0) {
      errors.push(`Linha ${index + 1}: pontos devem ser um número inteiro igual ou maior que zero.`)
    } else {
      skills.push({ name, attributeKey, points })
    }
  })

  return { skills, errors }
}
