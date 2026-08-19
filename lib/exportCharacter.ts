import type { Character } from "@/types/character"
import { CHARACTER_VERSION } from "@/types/character"
import { attributeGroups } from "@/data/attributes"
import { getCharacterElement } from "@/data/elements"
import { calculateCharacterStatSnapshot } from "@/lib/characterStatCalculations"

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

function richTextToPlainText(value: string): string {
  return value
    .replace(/<\/?(p|div|li|ol|ul|br)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

/** Exporta a ficha como arquivo .json (save manual). */
export function exportCharacterJSON(character: Character): void {
  const file = { version: CHARACTER_VERSION, character }
  downloadBlob(JSON.stringify(file, null, 2), `${characterFilename(character.name)}.json`, "application/json")
}

/** Gera um Markdown legível por humanos a partir da ficha. */
export function characterToMarkdown(character: Character): string {
  const { info, attributes, stats } = character
  const statSnapshot = calculateCharacterStatSnapshot(attributes, info, stats)
  const element = getCharacterElement(stats.elementId)
  const lines: string[] = []

  lines.push(`# ${character.name || "Personagem sem nome"}`)
  lines.push("")
  lines.push("## Informações")
  lines.push("")
  lines.push(`- Ano atual: ${info.currentYear} ${info.calendar === "logi" ? "Logi" : "C.E."}`)
  lines.push(`- Raça: ${info.race}`)
  lines.push(`- Espécie: ${info.species}`)
  lines.push(`- Ofício: ${info.profession}`)
  lines.push(`- Tamanho Base: ${info.sizeBase} m`)
  lines.push(`- Tamanho Real: ${info.sizeReal} m`)
  lines.push(`- Modificador de Tamanho (MT): ${info.sizeModifier}`)
  lines.push(`- Peso Base: ${info.weightBase} kg`)
  lines.push(`- Bônus de Peso: ${info.weightBonus} kg`)
  lines.push(`- Peso Real: ${info.weightReal} kg`)
  lines.push(`- Multiplicador de Escala (ME): ${info.scaleMultiplier}`)
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
  lines.push(`- PV atual: ${stats.pv}; máximo: ${statSnapshot.pvMax}; bônus: ${stats.pvBonus >= 0 ? "+" : ""}${stats.pvBonus}`)
  lines.push(`- PA atual: ${stats.pa}; máximo: ${statSnapshot.paMax}; bônus: ${stats.paBonus >= 0 ? "+" : ""}${stats.paBonus}`)
  lines.push(`- PA extra: ${Math.min(stats.paExtra, statSnapshot.paExtraMax)}; máximo: ${statSnapshot.paExtraMax}; bônus: ${stats.paExtraBonus >= 0 ? "+" : ""}${stats.paExtraBonus}`)
  lines.push(`- PE atual: ${stats.pe}; máximo: ${statSnapshot.peMax}; bônus: ${stats.peBonus >= 0 ? "+" : ""}${stats.peBonus}`)
  lines.push(`- PE temporário: ${stats.peTemporary}`)
  lines.push(`- MT: ${stats.mt}`)
  lines.push(`- Elemento principal: ${element?.name ?? "Nenhum"}`)
  lines.push(`- Resistências: ${stats.resistances.join(", ") || "Nenhum"}`)
  lines.push(`- Fraquezas: ${stats.weaknesses.join(", ") || "Nenhum"}`)
  lines.push(`- Determinação atual: ${stats.determination}; máxima: ${statSnapshot.determinationMax}; bônus: ${stats.determinationBonus >= 0 ? "+" : ""}${stats.determinationBonus}`)
  lines.push(`- Casualidade atual: ${stats.casualty}; máxima: ${statSnapshot.casualtyMax}; bônus: ${stats.casualtyBonus >= 0 ? "+" : ""}${stats.casualtyBonus}`)
  lines.push(`- Carga atual: ${stats.currentLoad} kg; base: ${statSnapshot.loadCapacity} kg; bônus: ${stats.loadBonus >= 0 ? "+" : ""}${stats.loadBonus}`)
  lines.push(`- Vontade: ${statSnapshot.willTest}; bônus: ${stats.willBonus >= 0 ? "+" : ""}${stats.willBonus}`)
  lines.push(`- Acaso: ${statSnapshot.chanceTest}; bônus: ${stats.chanceBonus >= 0 ? "+" : ""}${stats.chanceBonus}`)
  lines.push(`- Percepção: ${statSnapshot.perceptionTest}; bônus: ${stats.perceptionBonus >= 0 ? "+" : ""}${stats.perceptionBonus}`)
  lines.push(`- Deslocamento: ${statSnapshot.movement} m; bônus: ${stats.movementBonus >= 0 ? "+" : ""}${stats.movementBonus}`)
  if (statSnapshot.overweightLevel > 0) {
    lines.push(`- Sobrepeso ${statSnapshot.overweightLevel}: -${statSnapshot.physicalPenalty} Físico, -${statSnapshot.movementPenalty} Deslocamento`)
    if (statSnapshot.overweightWarnings.length > 0) {
      lines.push(`- Alertas de sobrepeso: ${statSnapshot.overweightWarnings.join(", ")}`)
    }
  }
  lines.push(`- Armadura: RDF ${stats.armorRdf}, RDM ${stats.armorRdm}`)
  lines.push(`- Natural: RDF ${stats.naturalRdf}, RDM ${stats.naturalRdm}`)
  const effects = richTextToPlainText(stats.effects)
  if (effects) {
    lines.push("")
    lines.push("### Efeitos")
    lines.push("")
    lines.push(effects)
  }
  lines.push("")

  return lines.join("\n")
}

/** Baixa a ficha como arquivo .md. */
export function exportCharacterMarkdown(character: Character): void {
  downloadBlob(characterToMarkdown(character), `${characterFilename(character.name)}.md`, "text/markdown")
}
