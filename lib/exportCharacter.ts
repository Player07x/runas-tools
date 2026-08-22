import type { Character } from "@/types/character"
import { CHARACTER_VERSION } from "@/types/character"
import { attributeGroups } from "@/data/attributes"
import { CORE_SKILL_IDS } from "@/data/skills"
import { getCharacterElement } from "@/data/elements"
import { calculateCharacterStatSnapshot } from "@/lib/characterStatCalculations"
import { calculateAttributeTest, calculateSkillLevel } from "@/lib/skillCalculations"
import { calculateBondQuality, calculateBondTest, formatSigned } from "@/lib/bondCalculations"
import { getAttributeDef } from "@/data/attributes"
import { calculateItemRealWeight, inventoryTypeLabel, inventoryUsageLabel, itemRarity } from "@/lib/inventoryCalculations"

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
  const { info, attributes, stats, skills, bonds, abilities, spells, inventory, notes } = character
  const statSnapshot = calculateCharacterStatSnapshot(attributes, info, stats, skills, abilities)
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
  lines.push(`- Mod. de Peso: ${info.weightBonus} kg`)
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
  lines.push(`- PV atual: ${stats.pv}; máximo: ${statSnapshot.pvMax}; Mod.: ${stats.pvBonus >= 0 ? "+" : ""}${stats.pvBonus}`)
  lines.push(`- PA atual: ${stats.pa}; máximo: ${statSnapshot.paMax}; Mod.: ${stats.paBonus >= 0 ? "+" : ""}${stats.paBonus}`)
  lines.push(`- PA extra: ${Math.min(stats.paExtra, statSnapshot.paExtraMax)}; máximo: ${statSnapshot.paExtraMax}; Mod.: ${stats.paExtraBonus >= 0 ? "+" : ""}${stats.paExtraBonus}`)
  lines.push(`- PE atual: ${stats.pe}; máximo: ${statSnapshot.peMax}; Mod.: ${stats.peBonus >= 0 ? "+" : ""}${stats.peBonus}`)
  lines.push(`- PE temporário: ${stats.peTemporary}`)
  lines.push(`- Melhorias de Maestria: Aura ${stats.masteryImprovements.aura}; Vida ${stats.masteryImprovements.life}; Energia ${stats.masteryImprovements.energy}; Determinação ${stats.masteryImprovements.determination}; Casualidade ${stats.masteryImprovements.casualty}`)
  lines.push(`- MT: ${stats.mt}`)
  lines.push(`- Elemento principal: ${element?.name ?? "Nenhum"}`)
  lines.push(`- Resistências: ${stats.resistances.join(", ") || "Nenhum"}`)
  lines.push(`- Fraquezas: ${stats.weaknesses.join(", ") || "Nenhum"}`)
  lines.push(`- Determinação atual: ${stats.determination}; máxima: ${statSnapshot.determinationMax}; Mod.: ${stats.determinationBonus >= 0 ? "+" : ""}${stats.determinationBonus}`)
  lines.push(`- Casualidade atual: ${stats.casualty}; máxima: ${statSnapshot.casualtyMax}; Mod.: ${stats.casualtyBonus >= 0 ? "+" : ""}${stats.casualtyBonus}`)
  lines.push(`- Tempo de Foco atual: ${stats.focusCurrent}; máximo: ${statSnapshot.focusMaximum}; Mod.: ${stats.focusModifier >= 0 ? "+" : ""}${stats.focusModifier}`)
  lines.push(`- Tempo de Descanso: ${statSnapshot.restMinutes} min.`)
  lines.push(`- Carga atual: ${stats.currentLoad} kg; base: ${statSnapshot.loadCapacity} kg; Mod.: ${stats.loadBonus >= 0 ? "+" : ""}${stats.loadBonus}`)
  lines.push(`- Vontade: ${statSnapshot.willTest}; Mod.: ${stats.willModifier >= 0 ? "+" : ""}${stats.willModifier}`)
  lines.push(`- Acaso: ${statSnapshot.chanceTest}; Mod.: ${stats.chanceModifier >= 0 ? "+" : ""}${stats.chanceModifier}`)
  lines.push(`- Percepção: ${statSnapshot.perceptionTest}; Mod.: ${stats.perceptionModifier >= 0 ? "+" : ""}${stats.perceptionModifier}`)
  lines.push(`- Deslocamento: ${statSnapshot.movement} m; Mod.: ${stats.movementBonus >= 0 ? "+" : ""}${stats.movementBonus}`)
  lines.push(`- Primeiras Impressões: ${statSnapshot.firstImpressions >= 0 ? "+" : ""}${statSnapshot.firstImpressions}; Mod.: ${stats.firstImpressionsBonus >= 0 ? "+" : ""}${stats.firstImpressionsBonus}`)
  if (statSnapshot.overweightLevel > 0) {
    lines.push(`- Sobrepeso ${statSnapshot.overweightLevel}: -${statSnapshot.physicalPenalty} Físico, -${statSnapshot.movementPenalty} Deslocamento`)
    if (statSnapshot.overweightWarnings.length > 0) {
      lines.push(`- Alertas de sobrepeso: ${statSnapshot.overweightWarnings.join(", ")}`)
    }
  }
  const effects = richTextToPlainText(stats.effects)
  if (effects) {
    lines.push("")
    lines.push("### Efeitos")
    lines.push("")
    lines.push(effects)
  }
  lines.push("")

  lines.push("## Perícias")
  lines.push("")
  for (const skill of skills) {
    const level = calculateSkillLevel(skill.points)
    const attribute = skill.attributeKey ? getAttributeDef(skill.attributeKey)?.name ?? skill.attributeKey : "Não definido"
    const test = skill.attributeKey
      ? calculateAttributeTest(attributes, skill.attributeKey) + level + skill.modifier
      : "Indisponível"
    const fixed = Object.values(CORE_SKILL_IDS).includes(skill.id as typeof CORE_SKILL_IDS[keyof typeof CORE_SKILL_IDS])
    lines.push(`- ${skill.name || "Perícia sem nome"}: teste ${test}; nível +${level}; atributo ${attribute}; pontos ${skill.points}; Mod. ${skill.modifier >= 0 ? "+" : ""}${skill.modifier}${fixed ? "; padrão" : ""}`)
  }
  lines.push("")

  lines.push("## Vínculos")
  lines.push("")
  for (const bond of bonds) {
    const quality = calculateBondQuality(bond.points)
    lines.push(`- ${bond.name}: categoria ${bond.category || "Sem categoria"}; teste ${calculateBondTest(attributes, stats, bond)}; qualidade ${quality.name}; nível ${formatSigned(quality.level)}; pontos ${bond.points}; Mod. ${formatSigned(bond.modifier)}`)
  }
  lines.push("")

  lines.push("## Habilidades")
  lines.push("")
  for (const ability of abilities) {
    const cost = ability.costType === "none"
      ? "Nenhum"
      : ability.costType === "other"
        ? ability.costText || "Outro"
        : `${ability.costValue} ${ability.costType} (${ability.costMode === "fixed" ? "fixo" : "relativo"})`
    lines.push(`### ${ability.name}`)
    lines.push(`- Categoria: ${ability.category || "Sem categoria"}`)
    lines.push(`- Modificadores permanentes: ${ability.permanentModifiers || "Nenhum"}`)
    lines.push(`- Custo: ${cost}`)
    const description = richTextToPlainText(ability.description)
    if (description) lines.push("", description)
    lines.push("")
  }

  const magicTypeLabels = { aura: "Aura", quick: "Rápida", spell: "Feitiço", ritual: "Ritual", enchantment: "Encantamento" } as const
  const rangeTypeLabels = { touch: "Toque", personal: "Pessoal", projectile: "Projétil", targets: "Alvo(s)", area: "Área" } as const
  lines.push("## Magias")
  lines.push("")
  for (const spell of spells) {
    const cost = spell.costType === "none"
      ? "Nenhum"
      : spell.costType === "other"
        ? spell.costText || "Outro"
        : `${spell.costValue} ${spell.costType} (${spell.costMode === "fixed" ? "fixo" : "relativo"})`
    const rangeType = rangeTypeLabels[spell.rangeType]
    const range = spell.rangeType === "touch" || spell.rangeType === "personal" || !spell.rangeText
      ? rangeType
      : `${spell.rangeText}, ${rangeType}`
    lines.push(`### ${spell.name}`)
    lines.push(`- Categoria: ${spell.category || "Sem categoria"}`)
    lines.push(`- Tipo: ${magicTypeLabels[spell.magicType]}`)
    lines.push(`- Alcance: ${range}`)
    lines.push(`- Área: ${spell.area || "Não informada"}`)
    lines.push(`- Duração: ${spell.duration || "Não informada"}`)
    lines.push(`- Teste de conjuração: ${spell.castingSkill || "Nenhum"}`)
    lines.push(`- Custo: ${cost}`)
    const description = richTextToPlainText(spell.description)
    if (description) lines.push("", description)
    lines.push("")
  }

  lines.push("## Inventário")
  lines.push("")
  for (const item of inventory) {
    lines.push(`### ${item.name}`)
    lines.push(`- Uso: ${inventoryUsageLabel(item.usage)}`)
    lines.push(`- Tipo: ${inventoryTypeLabel(item.type)}`)
    lines.push(`- Afinidade: ${item.affinity}`)
    lines.push(`- Pontos de vínculo: ${item.bondPoints}; raridade ${itemRarity(item.bondPoints)}`)
    lines.push(`- Peso real: ${calculateItemRealWeight(item, info.scaleMultiplier)} kg`)
    if (item.damage) lines.push(`- Dano: ${item.damage}`)
    if (item.rdf || item.rdm) lines.push(`- RDF: ${item.rdf}; RDM: ${item.rdm}`)
    if (item.description) lines.push("", item.description)
    lines.push("")
  }

  lines.push("## Anotações")
  lines.push("")
  for (const note of notes) {
    lines.push(`### ${note.name}`)
    lines.push(`- Categoria: ${note.category || "Sem categoria"}`)
    lines.push(`- Data: ${note.date || "Sem data"}`)
    const description = richTextToPlainText(note.description)
    if (description) lines.push("", description)
    lines.push("")
  }

  return lines.join("\n")
}

/** Baixa a ficha como arquivo .md. */
export function exportCharacterMarkdown(character: Character): void {
  downloadBlob(characterToMarkdown(character), `${characterFilename(character.name)}.md`, "text/markdown")
}
