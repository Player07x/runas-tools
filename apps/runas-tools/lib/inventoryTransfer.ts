import type {
  CharacterAbility,
  CharacterBond,
  CharacterInventoryItem,
  CharacterSkill,
  CharacterSpell,
  InventoryItemType,
  InventoryUsage,
} from "@runas/core/types/character"
import { parseImportedSpell, type ImportedSpell } from "@/lib/spellTransfer"
import { saveExportedJson } from "@/lib/fileExport"

const INVENTORY_LIST_KIND = "runas-tools-inventory-list"
const INVENTORY_LIST_VERSION = 1

export type ImportedInventoryItem = Omit<CharacterInventoryItem, "id" | "enchantmentSpellId" | "bondId" | "bondAbilityId" | "skillId"> & {
  enchantment: ImportedSpell | null
  bondName: string
  bondAbilityName: string
  skillName: string
}

interface InventoryListFile {
  kind: typeof INVENTORY_LIST_KIND
  version: typeof INVENTORY_LIST_VERSION
  items: ImportedInventoryItem[]
}

const usages = new Set<InventoryUsage>(["equipped", "stored", "absent"])
const itemTypes = new Set<InventoryItemType>(["weapon", "armor", "shield", "artifact", "material", "consumable", "tool", "utility", "accessory", "currency", "other"])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function safeFilename(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_-]/g, "") || "personagem-runas"
}

export function exportInventoryList(
  items: CharacterInventoryItem[],
  characterName: string,
  spells: CharacterSpell[],
  bonds: CharacterBond[],
  abilities: CharacterAbility[],
  skills: CharacterSkill[],
): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve()
  const file: InventoryListFile = {
    kind: INVENTORY_LIST_KIND,
    version: INVENTORY_LIST_VERSION,
    items: items.map(({ id, enchantmentSpellId, bondId, bondAbilityId, skillId, ...item }) => {
      void id
      const enchantment = spells.find((spell) => spell.id === enchantmentSpellId && spell.magicType === "enchantment")
      const exportedEnchantment = enchantment
        ? (({ id: spellId, ...spell }) => {
            void spellId
            return spell
          })(enchantment)
        : null
      return {
        ...item,
        enchantment: exportedEnchantment,
        bondName: bonds.find((bond) => bond.id === bondId)?.name ?? "",
        bondAbilityName: abilities.find((ability) => ability.id === bondAbilityId)?.name ?? "",
        skillName: skills.find((skill) => skill.id === skillId)?.name ?? "",
      }
    }),
  }
  return saveExportedJson(file, `${safeFilename(characterName)}_inventario.json`)
}

function textField(value: unknown, maximum: number, field: string, position: number): string {
  if (typeof value !== "string" || value.length > maximum) throw new Error(`O item ${position} possui ${field} inválido.`)
  return value
}

function nonNegativeNumber(value: unknown, field: string, name: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) throw new Error(`O item “${name}” possui ${field} inválido.`)
  return value
}

function optionalInteger(value: unknown, field: string, name: string): number | null {
  if (value === null) return null
  if (!Number.isInteger(value) || Number(value) < 0) throw new Error(`O item “${name}” possui ${field} inválido.`)
  return Number(value)
}

export function parseInventoryListFile(text: string): ImportedInventoryItem[] {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error("O arquivo não contém um JSON válido.")
  }
  if (!isRecord(parsed) || parsed.kind !== INVENTORY_LIST_KIND || parsed.version !== INVENTORY_LIST_VERSION || !Array.isArray(parsed.items)) {
    throw new Error("Este não é um arquivo de inventário exportado pelo Runas Tools.")
  }
  if (parsed.items.length === 0) throw new Error("A lista importada não contém itens.")

  return parsed.items.map((value, index) => {
    const position = index + 1
    if (!isRecord(value)) throw new Error(`O item ${position} possui um formato inválido.`)
    const name = textField(value.name, 80, "um nome", position).trim()
    if (!name) throw new Error(`O item ${position} não possui nome.`)
    if (!usages.has(value.usage as InventoryUsage)) throw new Error(`O item “${name}” possui um uso inválido.`)
    if (!itemTypes.has(value.type as InventoryItemType)) throw new Error(`O item “${name}” possui um tipo inválido.`)
    if (!Number.isInteger(value.affinity) || Number(value.affinity) < 0 || Number(value.affinity) > 4) throw new Error(`O item “${name}” possui afinidade inválida.`)
    if (typeof value.applyScaleWeight !== "boolean") throw new Error(`O item “${name}” possui aplicação de peso inválida.`)
    const quantity = value.quantity === undefined ? 1 : nonNegativeNumber(value.quantity, "quantidade", name)
    if (!Number.isInteger(quantity) || quantity < 1) throw new Error(`O item “${name}” possui quantidade inválida.`)
    const prMaximum = optionalInteger(value.prMaximum, "PR máximo", name)
    const parsedPrCurrent = optionalInteger(value.prCurrent, "PR atual", name)
    const prCurrent = parsedPrCurrent === null ? null : Math.min(prMaximum ?? Number.POSITIVE_INFINITY, parsedPrCurrent)

    const enchantment = value.enchantment === null ? null : parseImportedSpell(value.enchantment, position)
    if (enchantment && enchantment.magicType !== "enchantment") throw new Error(`A magia vinculada ao item “${name}” não é um encantamento.`)

    return {
      usage: value.usage as InventoryUsage,
      name,
      type: value.type as InventoryItemType,
      affinity: Number(value.affinity) as CharacterInventoryItem["affinity"],
      bondPoints: Math.trunc(nonNegativeNumber(value.bondPoints, "pontos de vínculo", name)),
      baseWeight: nonNegativeNumber(value.baseWeight, "peso base", name),
      quantity,
      applyScaleWeight: value.applyScaleWeight,
      damage: textField(value.damage, 160, "dano", position).trim(),
      rdf: Math.trunc(nonNegativeNumber(value.rdf, "RDF", name)),
      rdm: Math.trunc(nonNegativeNumber(value.rdm, "RDM", name)),
      prCurrent,
      prMaximum,
      enchantment,
      bondName: textField(value.bondName, 80, "vínculo", position).trim(),
      bondAbilityName: textField(value.bondAbilityName, 80, "habilidade de vínculo", position).trim(),
      skillName: textField(value.skillName, 80, "perícia", position).trim(),
      description: textField(value.description, 5000, "descrição", position),
    }
  })
}
