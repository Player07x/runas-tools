import type { EncounterActor, InitiativeEntry } from "./model"

const initiativeMarker = "<!-- RUNAS-DM:INICIATIVA -->"

function decodeEntities(value: string): string {
  return value.replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&quot;/gi, '"')
}

export function richTextToMarkdown(value: string): string {
  return decodeEntities(value)
    .replace(/<\s*br\s*\/?\s*>/gi, "\n")
    .replace(/<\s*li[^>]*>/gi, "- ")
    .replace(/<\s*\/li\s*>/gi, "\n")
    .replace(/<\s*(?:strong|b)[^>]*>(.*?)<\s*\/(?:strong|b)\s*>/gi, "**$1**")
    .replace(/<\s*(?:em|i)[^>]*>(.*?)<\s*\/(?:em|i)\s*>/gi, "*$1*")
    .replace(/<\s*u[^>]*>(.*?)<\s*\/u\s*>/gi, "<u>$1</u>")
    .replace(/<\s*\/(?:p|div|ul|ol|h[1-6])\s*>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

export function markdownToRichText(value: string): string {
  const lines = value.trim().split(/\r?\n/)
  const html: string[] = []
  let inList = false
  for (const source of lines) {
    const line = escapeHtml(source)
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      .replace(/&lt;u&gt;(.*?)&lt;\/u&gt;/g, "<u>$1</u>")
    if (/^-\s+/.test(line)) {
      if (!inList) html.push("<ul>")
      inList = true
      html.push(`<li>${line.replace(/^-\s+/, "")}</li>`)
      continue
    }
    if (inList) { html.push("</ul>"); inList = false }
    if (!line.trim()) continue
    html.push(`<p>${line}</p>`)
  }
  if (inList) html.push("</ul>")
  return html.join("")
}

function tableCell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\r?\n/g, " ").trim()
}

export function exportEncounterMarkdown(notesHtml: string, initiative: InitiativeEntry[]): string {
  const ordered = [...initiative].sort((left, right) => (right.value ?? Number.NEGATIVE_INFINITY) - (left.value ?? Number.NEGATIVE_INFINITY) || left.name.localeCompare(right.name, "pt-BR"))
  const rows = ordered.map((entry, index) => `| ${index + 1} | ${tableCell(entry.name)} | ${entry.value ?? ""} | ${entry.actorId ?? ""} |`)
  return [
    "# Notas",
    "",
    richTextToMarkdown(notesHtml),
    "",
    initiativeMarker,
    "# Iniciativa",
    "",
    "| Ordem | Nome | Iniciativa | ID da mesa |",
    "| ---: | --- | ---: | --- |",
    ...rows,
    "",
  ].join("\n")
}

export function importEncounterMarkdown(value: string, actors: EncounterActor[]): { notesHtml: string; initiative: InitiativeEntry[] } {
  const markerIndex = value.indexOf(initiativeMarker)
  const headingMatch = value.match(/^#\s+Iniciativa\s*$/im)
  const splitIndex = markerIndex >= 0 ? markerIndex : (headingMatch?.index ?? value.length)
  const notesMarkdown = value.slice(0, splitIndex).replace(/^#\s+Notas\s*/i, "").trim()
  const initiativeText = value.slice(splitIndex)
  const byId = new Map(actors.map((actor) => [actor.id, actor]))
  const byName = new Map(actors.map((actor) => [actor.character.name.trim().toLocaleLowerCase("pt-BR"), actor]))
  const rows = initiativeText.split(/\r?\n/).filter((line) => /^\|/.test(line)).slice(2)
  const initiative = rows.flatMap((line, index) => {
    const cells = line.split(/(?<!\\)\|/).slice(1, -1).map((cell) => cell.replace(/\\\|/g, "|").trim())
    if (cells.length < 3) return []
    const name = cells[1]?.slice(0, 100) ?? ""
    if (!name) return []
    const importedId = cells[3] || null
    const actor = importedId && byId.get(importedId) || byName.get(name.toLocaleLowerCase("pt-BR"))
    const parsedValue = Number(cells[2])
    return [{ id: `initiative-${Date.now()}-${index}`, actorId: actor?.id ?? null, name: actor?.character.name ?? name, value: Number.isFinite(parsedValue) && cells[2] !== "" ? Math.trunc(parsedValue) : null }]
  })
  return { notesHtml: markdownToRichText(notesMarkdown), initiative }
}
