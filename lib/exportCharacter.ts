import type { Character } from "@/types/character"
import { CHARACTER_VERSION } from "@/types/character"
import { attributeGroups } from "@/data/attributes"

function downloadBlob(content: string, filename: string, mime: string): void {
  if (typeof window === "undefined") return
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function characterFilename(name: string): string {
  const sanitized = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_-]/g, "")
  return sanitized || "personagem-runas"
}

/** Exporta a ficha como arquivo .json (save manual). */
export function exportCharacterJSON(character: Character): void {
  const file = { version: CHARACTER_VERSION, character }
  downloadBlob(JSON.stringify(file, null, 2), `${characterFilename(character.name)}.json`, "application/json")
}

/** Gera um Markdown legível por humanos a partir da ficha. */
export function characterToMarkdown(character: Character): string {
  const { info, attributes, stats } = character
  const lines: string[] = []

  lines.push(`# ${character.name || "Personagem sem nome"}`)
  lines.push("")
  lines.push("## Informações")
  lines.push("")
  lines.push(`- Ano atual: ${info.currentYear} ${info.calendar === "logi" ? "Logi" : "C.E."}`)
  lines.push(`- Raça: ${info.race}`)
  lines.push(`- Espécie: ${info.species}`)
  lines.push(`- Ofício: ${info.profession}`)
  lines.push(`- Tamanho: ${info.size}`)
  lines.push(`- Modificador de Tamanho (MT): ${info.sizeModifier}`)
  lines.push(`- Peso: ${info.weight}`)
  lines.push(`- Multiplicador de Peso (MP): ${info.weightMultiplier}`)
  lines.push(`- Nascimento: ${info.birthDate}`)
  lines.push(`- Idade: ${info.age}`)
  lines.push(`- Região: ${info.region}`)
  lines.push(`- Classe: ${info.characterClass}`)
  lines.push(`- Arquétipo: ${info.archetype}`)
  lines.push(`- Essências: ${info.essences}`)
  lines.push(`- Carma: ${info.karma}`)
  lines.push(`- Divindade: ${info.deity}`)
  lines.push(`- Legado: ${info.legacy}`)
  lines.push(`- Pontos do Legado: ${info.legacyPoints}`)
  lines.push(`- Afinidade: ${info.affinity}`)
  lines.push(`- Eficiência: ${info.efficiency}`)
  lines.push(`- Alinhamento: ${info.alignment}`)
  lines.push(`- Raridade do Legado: ${info.legacyRarity}`)
  lines.push(`- Base de Carga: ${info.loadBase}`)
  lines.push("")
  lines.push("## Atributos")
  lines.push("")

  for (const group of attributeGroups) {
    lines.push(`### ${group.name}`)
    lines.push(`- ${group.primary.name}: ${attributes[group.primary.key]}`)
    for (const attr of group.attributes) {
      lines.push(`- ${attr.name}: +${attributes[attr.key]}`)
    }
    lines.push("")
  }

  lines.push("## Estatísticas")
  lines.push("")
  lines.push(`- PV: ${stats.pv}`)
  lines.push(`- PA: ${stats.pa}`)
  lines.push(`- PE: ${stats.pe}`)
  lines.push(`- MT: ${stats.mt}`)
  lines.push("")

  return lines.join("\n")
}

/** Baixa a ficha como arquivo .md. */
export function exportCharacterMarkdown(character: Character): void {
  downloadBlob(characterToMarkdown(character), `${characterFilename(character.name)}.md`, "text/markdown")
}
