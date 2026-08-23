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
import { saveExportedBlob } from "@/lib/fileExport"

function downloadBlob(content: string, filename: string, mime: string): Promise<void> {
  return saveExportedBlob(new Blob([content], { type: mime }), filename, "Ficha do Runas Tools")
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

export function characterObsidianFilename(name: string): string {
  const sanitized = name.trim().replace(/[<>:"/\\|?*\u0000-\u001f]/g, "").replace(/[. ]+$/g, "")
  return sanitized || "Personagem Runas"
}

function richTextToMarkdown(value: string): string {
  return value
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<\/(li|p|div|h[1-6])>/gi, "\n")
    .replace(/<p[^>]*>/gi, "")
    .replace(/<h([1-6])[^>]*>/gi, (_match, level: string) => `${"#".repeat(Number(level))} `)
    .replace(/<(strong|b)[^>]*>/gi, "**").replace(/<\/(strong|b)>/gi, "**")
    .replace(/<(em|i)[^>]*>/gi, "*").replace(/<\/(em|i)>/gi, "*")
    .replace(/<(s|strike)[^>]*>/gi, "~~").replace(/<\/(s|strike)>/gi, "~~")
    .replace(/<u[^>]*>/gi, "<u>").replace(/<\/u>/gi, "</u>")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

function yamlScalar(value: string | number): string {
  return typeof value === "number" ? String(value) : value ? JSON.stringify(value) : ""
}

function yamlList(key: string, values: string[]): string[] {
  const filtered = [...new Set(values.map((value) => value.trim()).filter(Boolean))]
  return filtered.length > 0 ? [`${key}:`, ...filtered.map((value) => `  - ${yamlScalar(value)}`)] : [`${key}:`]
}

function markdownCell(value: string | number): string {
  return String(value).replace(/\|/g, "\\|").replace(/\r?\n/g, "<br>")
}

/** Exporta a ficha como arquivo .json (save manual). */
export function exportCharacterJSON(character: Character): Promise<void> {
  const file = { version: CHARACTER_VERSION, character }
  return downloadBlob(JSON.stringify(file, null, 2), `${characterFilename(character.name)}.json`, "application/json")
}

/** Gera um Markdown legível por humanos a partir da ficha. */
export function characterToMarkdown(character: Character): string {
  const { info, attributes, stats, skills, bonds, abilities, spells, inventory, notes } = character
  const statSnapshot = calculateCharacterStatSnapshot(attributes, info, stats, skills, abilities)
  const element = getCharacterElement(stats.elementId)
  const lines: string[] = []
  const title = info.archetype || info.characterClass || info.profession

  lines.push("---")
  lines.push(`name: ${yamlScalar(character.name || "Personagem sem nome")}`)
  lines.push("type: character")
  lines.push(`system: ${yamlScalar("Runas: Livro Azul")}`)
  lines.push(...yamlList("aliases", [title]))
  lines.push(`Título: ${yamlScalar(title)}`)
  lines.push("Obra de Origem:")
  lines.push("Organizações:")
  lines.push(...yamlList("Raça", [info.race, info.species]))
  lines.push("Gênero:")
  lines.push(`Nascimento: ${yamlScalar(info.birthDate)}`)
  lines.push("Estado:")
  lines.push(`Sistema: ${yamlScalar("Runas: Livro Azul")}`)
  lines.push(`Profissão: ${yamlScalar(info.profession)}`)
  lines.push(`Classe: ${yamlScalar(info.characterClass)}`)
  lines.push(`Arquétipo: ${yamlScalar(info.archetype)}`)
  lines.push(`Região: ${yamlScalar(info.region)}`)
  lines.push(`Divindade: ${yamlScalar(info.deity)}`)
  lines.push(`Afinidade: ${yamlScalar(info.affinity)}`)
  lines.push(`Alinhamento: ${yamlScalar(info.alignment)}`)
  lines.push(`PV Atual: ${stats.pv}`)
  lines.push(`PV Máximo: ${statSnapshot.pvMax}`)
  lines.push(`PA Atual: ${stats.pa}`)
  lines.push(`PA Máximo: ${statSnapshot.paMax}`)
  lines.push(`PE Atual: ${stats.pe}`)
  lines.push(`PE Máximo: ${statSnapshot.peMax}`)
  lines.push(`Versão da Ficha: ${CHARACTER_VERSION}`)
  lines.push("tags:")
  lines.push("  - character")
  lines.push("  - personagem")
  lines.push("  - runilita")
  lines.push("  - runas-tools")
  lines.push("---")
  lines.push("")
  lines.push(`# ${character.name || "Personagem sem nome"}`)
  lines.push("")
  lines.push("> [!info] Ficha de Runas")
  lines.push(`> **${info.profession || "Ofício não informado"}**${info.characterClass ? ` · ${info.characterClass}` : ""}${info.archetype ? ` · ${info.archetype}` : ""}`)
  lines.push(`> PV **${stats.pv}/${statSnapshot.pvMax}** · PA **${stats.pa}/${statSnapshot.paMax}** · PE **${stats.pe}/${statSnapshot.peMax}**`)
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
  lines.push("| Recurso | Atual | Máximo | Mod. |")
  lines.push("|---|---:|---:|---:|")
  lines.push(`| PV | ${stats.pv} | ${statSnapshot.pvMax} | ${formatSigned(stats.pvBonus)} |`)
  lines.push(`| PA | ${stats.pa} | ${statSnapshot.paMax} | ${formatSigned(stats.paBonus)} |`)
  lines.push(`| PA Extra | ${Math.min(stats.paExtra, statSnapshot.paExtraMax)} | ${statSnapshot.paExtraMax} | ${formatSigned(stats.paExtraBonus)} |`)
  lines.push(`| PE | ${stats.pe} | ${statSnapshot.peMax} | ${formatSigned(stats.peBonus)} |`)
  lines.push(`| PE Temporário | ${stats.peTemporary} | ${statSnapshot.peTemporaryMax} | — |`)
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
  const effects = richTextToMarkdown(stats.effects)
  if (effects) {
    lines.push("")
    lines.push("### Efeitos")
    lines.push("")
    lines.push(effects)
  }
  lines.push("")

  lines.push("## Perícias")
  lines.push("")
  lines.push("| Perícia | Teste | Nível | Atributo | Pontos | Mod. |")
  lines.push("|---|---:|---:|---|---:|---:|")
  for (const skill of skills) {
    const level = calculateSkillLevel(skill.points)
    const attribute = skill.attributeKey ? getAttributeDef(skill.attributeKey)?.name ?? skill.attributeKey : "Não definido"
    const test = skill.attributeKey
      ? calculateAttributeTest(attributes, skill.attributeKey) + level + skill.modifier
      : "Indisponível"
    const fixed = Object.values(CORE_SKILL_IDS).includes(skill.id as typeof CORE_SKILL_IDS[keyof typeof CORE_SKILL_IDS])
    lines.push(`| ${markdownCell(skill.name || "Perícia sem nome")}${fixed ? " *(padrão)*" : ""} | ${test} | +${level} | ${markdownCell(attribute)} | ${skill.points} | ${formatSigned(skill.modifier)} |`)
  }
  lines.push("")

  lines.push("## Vínculos")
  lines.push("")
  lines.push("| Vínculo | Categoria | Teste | Qualidade | Nível | Pontos | Mod. |")
  lines.push("|---|---|---:|---|---:|---:|---:|")
  for (const bond of bonds) {
    const quality = calculateBondQuality(bond.points)
    lines.push(`| ${markdownCell(bond.name)} | ${markdownCell(bond.category || "Sem categoria")} | ${calculateBondTest(attributes, stats, bond)} | ${quality.name} | ${formatSigned(quality.level)} | ${bond.points} | ${formatSigned(bond.modifier)} |`)
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
    const description = richTextToMarkdown(ability.description)
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
    const description = richTextToMarkdown(spell.description)
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
    lines.push(`- Quantidade: ${item.quantity}`)
    lines.push(`- Peso total: ${calculateItemRealWeight(item, info.scaleMultiplier)} kg`)
    if (item.damage) lines.push(`- Dano: ${item.damage}`)
    if (item.rdf || item.rdm) lines.push(`- RDF: ${item.rdf}; RDM: ${item.rdm}`)
    if (item.prCurrent !== null || item.prMaximum !== null) lines.push(`- PR atual: ${item.prCurrent ?? "—"}; máximo: ${item.prMaximum ?? "—"}`)
    const description = richTextToMarkdown(item.description)
    if (description) lines.push("", description)
    lines.push("")
  }

  lines.push("## Anotações")
  lines.push("")
  for (const note of notes) {
    lines.push(`### ${note.name}`)
    lines.push(`- Categoria: ${note.category || "Sem categoria"}`)
    lines.push(`- Data: ${note.date || "Sem data"}`)
    const description = richTextToMarkdown(note.description)
    if (description) lines.push("", description)
    lines.push("")
  }

  return lines.join("\n")
}

/** Baixa a ficha como arquivo .md. */
export function exportCharacterMarkdown(character: Character): Promise<void> {
  return downloadBlob(characterToMarkdown(character), `${characterObsidianFilename(character.name)}.md`, "text/markdown")
}
