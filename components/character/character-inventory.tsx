"use client"

import { useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import { Dices, Eye, Pencil, Plus, Save, Shield, Swords, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { NumberInput } from "@/components/ui/number-input"
import { SegmentedToggle } from "@/components/ui/segmented-toggle"
import type {
  CharacterAbility,
  CharacterAttributes,
  CharacterBond,
  CharacterInfo,
  CharacterInventoryItem,
  CharacterSkill,
  CharacterSpell,
  CharacterStats,
  InventoryItemType,
  InventoryUsage,
} from "@/types/character"
import { calculateBondQuality, calculateBondTest, formatSigned } from "@/lib/bondCalculations"
import { calculateAttributeTest, calculateSkillLevel, calculateSkillModifier, normalizeSkillName } from "@/lib/skillCalculations"
import { getAttributeDef } from "@/data/attributes"
import {
  calculateEquippedDefense,
  calculateInventoryLoad,
  calculateItemRealWeight,
  formatWeight,
  inventoryTypeLabel,
  inventoryTypeOptions,
  inventoryUsageLabel,
  inventoryUsageOptions,
  isBondAbilityCategory,
  itemAffinityOptions,
  itemRarity,
} from "@/lib/inventoryCalculations"
import { useCharacterPanel } from "./character-panel"
import { calculateCharacterStatSnapshot } from "@/lib/characterStatCalculations"

interface Props {
  items: CharacterInventoryItem[]
  info: CharacterInfo
  attributes: CharacterAttributes
  stats: CharacterStats
  skills: CharacterSkill[]
  bonds: CharacterBond[]
  abilities: CharacterAbility[]
  spells: CharacterSpell[]
  onItemsChange: (items: CharacterInventoryItem[]) => void
  onLoadBonusChange: (value: number) => void
}

type ReferencePreview =
  | { type: "spell"; value: CharacterSpell }
  | { type: "bond"; value: CharacterBond }
  | { type: "ability"; value: CharacterAbility }
  | { type: "skill"; value: CharacterSkill }

interface ArmorConfirmation {
  previousName: string
  nextName: string
  nextItems: CharacterInventoryItem[]
  closeEditor: boolean
}

function createInventoryItem(): CharacterInventoryItem {
  const id = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  return {
    id,
    usage: "stored",
    name: "Novo item",
    type: "other",
    affinity: 0,
    bondPoints: 0,
    baseWeight: 0,
    applyScaleWeight: false,
    damage: "",
    rdf: 0,
    rdm: 0,
    enchantmentSpellId: "",
    bondId: "",
    bondAbilityId: "",
    skillId: "",
    description: "",
  }
}

function plainText(value: string): string {
  return value.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim()
}

function spellTypeLabel(type: CharacterSpell["magicType"]): string {
  return { aura: "Aura", quick: "Rápida", spell: "Feitiço", ritual: "Ritual", enchantment: "Encantamento" }[type]
}

function spellRange(spell: CharacterSpell): string {
  const label = { touch: "Toque", personal: "Pessoal", projectile: "Projétil", targets: "Alvo(s)", area: "Área" }[spell.rangeType]
  return spell.rangeType === "touch" || spell.rangeType === "personal" || !spell.rangeText ? label : `${spell.rangeText}, ${label}`
}

function costSummary(source: Pick<CharacterAbility, "costType" | "costMode" | "costValue" | "costText">): string {
  if (source.costType === "none") return "Nenhum"
  if (source.costType === "other") return source.costText || "Outro"
  return source.costMode === "relative" ? `${source.costType} · Relativo` : `${source.costValue} ${source.costType}`
}

function sanitizeItem(item: CharacterInventoryItem, matchingBonds: CharacterBond[]): CharacterInventoryItem {
  const affinity = Math.max(0, Math.min(4, Math.trunc(item.affinity))) as CharacterInventoryItem["affinity"]
  return {
    ...item,
    name: item.name.trim().slice(0, 80) || "Item sem nome",
    affinity,
    bondPoints: Math.max(0, Math.trunc(item.bondPoints)),
    baseWeight: Math.max(0, Number.isFinite(item.baseWeight) ? item.baseWeight : 0),
    damage: item.damage.trim().slice(0, 160),
    rdf: Math.max(0, Math.trunc(item.rdf)),
    rdm: Math.max(0, Math.trunc(item.rdm)),
    bondId: matchingBonds.some((bond) => bond.id === item.bondId) ? item.bondId : "",
    description: item.description.slice(0, 5000),
  }
}

export function CharacterInventory({ items, info, attributes, stats, skills, bonds, abilities, spells, onItemsChange, onLoadBonusChange }: Props) {
  const router = useRouter()
  const { close } = useCharacterPanel()
  const [draft, setDraft] = useState<CharacterInventoryItem | null>(null)
  const [draftIsNew, setDraftIsNew] = useState(false)
  const [dialogMode, setDialogMode] = useState<"view" | "edit">("view")
  const [referencePreview, setReferencePreview] = useState<ReferencePreview | null>(null)
  const [armorConfirmation, setArmorConfirmation] = useState<ArmorConfirmation | null>(null)

  const currentLoad = calculateInventoryLoad(items, info.scaleMultiplier)
  const statSnapshot = useMemo(() => calculateCharacterStatSnapshot(attributes, info, { ...stats, currentLoad }, skills, abilities), [abilities, attributes, currentLoad, info, skills, stats])
  const defense = calculateEquippedDefense(items)
  const equippedArmor = items.find((item) => item.type === "armor" && item.usage === "equipped")
  const equippedCombatItems = items.filter((item) => item.usage === "equipped" && ["weapon", "armor", "shield"].includes(item.type))
  const bondAbilities = abilities.filter((ability) => isBondAbilityCategory(ability.category))
  const matchingBonds = useMemo(() => draft
    ? bonds.filter((bond) => normalizeSkillName(bond.name) === normalizeSkillName(draft.name))
    : [], [bonds, draft])

  function openItem(item: CharacterInventoryItem, mode: "view" | "edit" = "view") {
    setDraft({ ...item })
    setDraftIsNew(false)
    setDialogMode(mode)
  }

  function addItem() {
    setDraft(createInventoryItem())
    setDraftIsNew(true)
    setDialogMode("edit")
  }

  function commitItemSet(nextItem: CharacterInventoryItem, baseItems: CharacterInventoryItem[], closeEditor: boolean) {
    const existingArmor = items.find((item) => item.type === "armor" && item.usage === "equipped" && item.id !== nextItem.id)
    if (nextItem.type === "armor" && nextItem.usage === "equipped" && existingArmor) {
      setArmorConfirmation({
        previousName: existingArmor.name,
        nextName: nextItem.name,
        nextItems: baseItems.map((item) => item.id === existingArmor.id ? { ...item, usage: "stored" } : item),
        closeEditor,
      })
      return
    }
    onItemsChange(baseItems)
    if (closeEditor) {
      setDraft(null)
      setDraftIsNew(false)
    }
  }

  function applyItem(nextItem: CharacterInventoryItem) {
    const baseItems = draftIsNew ? [...items, nextItem] : items.map((item) => item.id === nextItem.id ? nextItem : item)
    commitItemSet(nextItem, baseItems, true)
  }

  function saveDraft(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!draft) return
    applyItem(sanitizeItem(draft, matchingBonds))
  }

  function changeUsage(item: CharacterInventoryItem, usage: InventoryUsage) {
    const nextItem = { ...item, usage }
    commitItemSet(nextItem, items.map((candidate) => candidate.id === item.id ? nextItem : candidate), false)
  }

  function removeItem(item: CharacterInventoryItem) {
    if (!window.confirm(`Remover “${item.name}” do inventário?`)) return
    onItemsChange(items.filter((candidate) => candidate.id !== item.id))
    if (draft?.id === item.id) setDraft(null)
  }

  function rollSkill(skillId: string) {
    const skill = skills.find((candidate) => candidate.id === skillId)
    if (!skill?.attributeKey) return
    close()
    router.push(`/calculadora-testes?skill=${encodeURIComponent(skill.id)}&roll=${encodeURIComponent(crypto.randomUUID())}`)
  }

  function rollBond(bondId: string) {
    const bond = bonds.find((candidate) => candidate.id === bondId)
    if (!bond) return
    close()
    router.push(`/calculadora-testes?bond=${encodeURIComponent(bond.id)}&roll=${encodeURIComponent(crypto.randomUUID())}`)
  }

  function rollDamage(item: CharacterInventoryItem) {
    if (!item.damage.trim()) return
    close()
    router.push(`/calculadora-dano?damage=${encodeURIComponent(item.damage)}&roll=${encodeURIComponent(crypto.randomUUID())}`)
  }

  function itemSkill(item: CharacterInventoryItem): CharacterSkill | undefined {
    return skills.find((skill) => skill.id === item.skillId)
  }

  return (
    <section aria-label="Inventário do personagem" className="rounded-b-[22px] rounded-t-none border border-border bg-card p-3 shadow-sm sm:rounded-b-[27px] sm:p-7">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(17rem,.8fr)]">
        <article className="rounded-[20px] border border-border bg-muted/30 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Carga</p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div><span className="text-xs text-muted-foreground">Atual</span><strong className="mt-1 block text-xl text-foreground">{formatWeight(currentLoad)} kg</strong></div>
            <div><span className="text-xs text-muted-foreground">Capacidade</span><strong className="mt-1 block text-xl text-foreground">{formatWeight(statSnapshot.loadCapacity)} kg</strong></div>
            <NumberInput label="Modificador de Carga" value={stats.loadBonus} onChange={(value) => onLoadBonusChange(Math.trunc(value))} />
            <div><span className="text-xs text-muted-foreground">Itens contabilizados</span><strong className="mt-1 block text-xl text-foreground">{items.filter((item) => item.usage !== "absent").length}</strong></div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">A carga soma automaticamente o peso real dos itens equipados e armazenados. Itens ausentes não contam.</p>
          {statSnapshot.overweightLevel > 0 && <div className="mt-3 rounded-xl border border-yellow-500/25 bg-yellow-500/10 p-3 text-sm italic"><p className="font-semibold text-yellow-foreground">Sobrepeso {statSnapshot.overweightLevel}: -{statSnapshot.physicalPenalty} Físico, -{statSnapshot.movementPenalty} Desloc.</p>{statSnapshot.overweightWarnings.length > 0 && <p className="mt-1 font-bold text-destructive">{statSnapshot.overweightWarnings.join(", ")}</p>}</div>}
        </article>

        <article className="rounded-[20px] border border-primary/25 bg-primary/5 p-4">
          <div className="flex items-center gap-2 text-primary"><Shield className="size-5" /><h3 className="font-bold">Defesa equipada</h3></div>
          <p className="mt-3 text-sm text-foreground"><span className="text-muted-foreground">Armadura:</span> <strong>{equippedArmor?.name ?? "Nenhuma"}</strong></p>
          <div className="mt-3 grid grid-cols-2 gap-3"><div className="rounded-xl bg-background/70 p-3"><span className="text-xs text-muted-foreground">RDF</span><strong className="block text-xl">{defense.rdf}</strong></div><div className="rounded-xl bg-background/70 p-3"><span className="text-xs text-muted-foreground">RDM</span><strong className="block text-xl">{defense.rdm}</strong></div></div>
          <p className="mt-2 text-xs text-muted-foreground">Totais da armadura e dos escudos equipados, usados pela aplicação de dano.</p>
        </article>
      </div>

      {equippedCombatItems.length > 0 && (
        <div className="mt-4">
          <h3 className="mb-2 text-sm font-bold text-foreground">Equipamentos em uso</h3>
          <div className="grid gap-3 lg:grid-cols-2">
            {equippedCombatItems.map((item) => {
              const skill = itemSkill(item)
              const canRollDamage = (item.type === "weapon" || item.type === "shield") && Boolean(item.damage.trim())
              return <article key={item.id} className="rounded-[18px] border border-border bg-background/55 p-4">
                <div className="flex items-start justify-between gap-3"><div className="min-w-0"><span className="text-xs font-semibold text-primary">{inventoryTypeLabel(item.type)}</span><button type="button" onClick={() => openItem(item)} className="mt-0.5 block max-w-full truncate text-left font-bold text-foreground hover:text-primary">{item.name}</button></div>{item.type === "weapon" ? <Swords className="size-5 text-muted-foreground" /> : <Shield className="size-5 text-muted-foreground" />}</div>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground"><span>Dano: <strong className="text-foreground">{item.damage || "—"}</strong></span>{(item.type === "armor" || item.type === "shield") && <><span>RDF: <strong className="text-foreground">{item.rdf}</strong></span><span>RDM: <strong className="text-foreground">{item.rdm}</strong></span></>}</div>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {(item.type === "weapon" || item.type === "shield") && <Button type="button" size="sm" onClick={() => rollDamage(item)} disabled={!canRollDamage}><Swords /> Rolar dano</Button>}
                  <Button type="button" size="sm" variant="secondary" onClick={() => skill && rollSkill(skill.id)} disabled={!skill?.attributeKey}><Dices /> Rolar teste</Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => openItem(item)}><Eye /> Exibir</Button>
                </div>
              </article>
            })}
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h3 className="font-bold text-foreground">Todos os itens</h3><p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground"><strong>Equipado</strong> está sendo usado agora; <strong>Armazenado</strong> está nos bolsos ou mochila; <strong>Ausente</strong> está em outro lugar, mas continua sob posse ou registrado pelo jogador.</p></div>
        <Button type="button" onClick={addItem}><Plus /> Adicionar item</Button>
      </div>

      <div className="mt-3 space-y-2">
        <div className="hidden grid-cols-[7rem_minmax(8rem,1fr)_7rem_minmax(10rem,1.4fr)_5rem_3rem] gap-2 px-3 text-center text-[0.62rem] uppercase tracking-wide text-muted-foreground md:grid"><span>Uso</span><span>Nome</span><span>Tipo</span><span>Descrição</span><span>Peso</span><span>Editar</span></div>
        {items.length === 0 && <p className="rounded-[18px] border border-dashed border-border bg-background/35 px-4 py-10 text-center text-sm text-muted-foreground">Nenhum item cadastrado.</p>}
        {items.map((item) => <article key={item.id} className="virtualized-list-item grid grid-cols-[minmax(0,1fr)_auto] gap-2 rounded-[18px] border border-border bg-background/55 p-3 md:grid-cols-[7rem_minmax(8rem,1fr)_7rem_minmax(10rem,1.4fr)_5rem_3rem] md:items-center md:p-2">
          <select value={item.usage} onChange={(event) => changeUsage(item, event.target.value as InventoryUsage)} aria-label={`Uso de ${item.name}`} className="h-10 rounded-xl border border-input bg-background px-2 text-xs font-semibold text-foreground outline-none focus:border-ring">{inventoryUsageOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
          <button type="button" onClick={() => openItem(item)} className="col-start-1 row-start-2 min-w-0 truncate text-left text-sm font-bold text-foreground hover:text-primary md:col-start-auto md:row-start-auto md:px-2">{item.name}</button>
          <span className="text-right text-xs font-semibold text-muted-foreground md:text-center">{inventoryTypeLabel(item.type)}</span>
          <p className="col-span-2 min-w-0 truncate text-xs text-muted-foreground md:col-span-1 md:px-2">{plainText(item.description) || "Sem descrição"}</p>
          <span className="text-xs font-semibold tabular-nums text-foreground md:text-center">{formatWeight(calculateItemRealWeight(item, info.scaleMultiplier))} kg</span>
          <button type="button" onClick={() => openItem(item, "edit")} aria-label={`Editar ${item.name}`} className="col-start-2 row-start-2 inline-flex size-10 items-center justify-center justify-self-end rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground md:col-start-auto md:row-start-auto"><Pencil className="size-4" /></button>
        </article>)}
      </div>

      {draft && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-3 backdrop-blur-[2px]" onMouseDown={(event) => { if (event.currentTarget === event.target) setDraft(null) }}>
          {dialogMode === "view"
            ? <ItemView item={draft} info={info} skills={skills} bonds={bonds} abilities={abilities} spells={spells} attributes={attributes} stats={stats} onClose={() => setDraft(null)} onEdit={() => setDialogMode("edit")} onDelete={() => removeItem(draft)} onReference={setReferencePreview} onRollSkill={rollSkill} onRollBond={rollBond} onRollDamage={rollDamage} />
            : <form onSubmit={saveDraft} role="dialog" aria-modal="true" aria-labelledby="inventory-editor-title" className="max-h-[calc(100dvh-1.5rem)] w-full max-w-5xl overflow-y-auto rounded-[24px] border border-border bg-card p-4 shadow-2xl sm:p-6">
                <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Modo edição</p><h2 id="inventory-editor-title" className="mt-1 text-lg font-bold text-foreground">{draftIsNew ? "Novo item" : draft.name}</h2></div><button type="button" onClick={() => setDraft(null)} aria-label="Fechar item" className="inline-flex size-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted"><X className="size-5" /></button></div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <label className="sm:col-span-2"><span className="mb-1.5 block text-sm font-medium text-muted-foreground">Nome</span><input required maxLength={80} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/25" /></label>
                  <Select label="Uso" value={draft.usage} options={inventoryUsageOptions} onChange={(value) => setDraft({ ...draft, usage: value as InventoryUsage })} />
                  <Select label="Tipo" value={draft.type} options={inventoryTypeOptions} onChange={(value) => setDraft({ ...draft, type: value as InventoryItemType })} />
                  <Select label="Afinidade" value={String(draft.affinity)} options={itemAffinityOptions.map((option) => ({ value: String(option.value), label: option.label }))} onChange={(value) => setDraft({ ...draft, affinity: Number(value) as CharacterInventoryItem["affinity"] })} />
                  <label><span className="mb-1.5 block text-sm font-medium text-muted-foreground">Pontos de Vínculo</span><input type="number" min={0} step={1} value={draft.bondPoints} onChange={(event) => setDraft({ ...draft, bondPoints: Math.max(0, Math.trunc(Number(event.target.value) || 0)) })} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-ring" /><span className="mt-1 block text-xs text-muted-foreground">Raridade: {itemRarity(draft.bondPoints)}</span></label>
                  <NumberInput label="Peso Base (kg)" value={draft.baseWeight} min={0} step={0.001} onChange={(baseWeight) => setDraft({ ...draft, baseWeight: Math.max(0, baseWeight) })} />
                  {draft.baseWeight > 0 && <SegmentedToggle label="Aplicar Peso Real?" value={draft.applyScaleWeight ? "yes" : "no"} onChange={(value) => setDraft({ ...draft, applyScaleWeight: value === "yes" })} options={[{ value: "yes", label: "Sim" }, { value: "no", label: "Não" }]} />}
                  {draft.baseWeight > 0 && <label><span className="mb-1.5 block text-sm font-medium text-muted-foreground">Peso Real</span><output className="flex h-11 items-center rounded-xl border border-input bg-muted/45 px-3 text-sm font-semibold">{formatWeight(calculateItemRealWeight(draft, info.scaleMultiplier))} kg</output></label>}
                  <label className="sm:col-span-2"><span className="mb-1.5 block text-sm font-medium text-muted-foreground">Dano (opcional)</span><input maxLength={160} value={draft.damage} onChange={(event) => setDraft({ ...draft, damage: event.target.value })} placeholder="3D+2 queimadura (+poder)" className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-ring" /><span className="mt-1 block text-xs text-muted-foreground">Use o mesmo formato da Entrada rápida da Calculadora de Dano.</span></label>
                  <NumberInput label="RDF (opcional)" value={draft.rdf} min={0} onChange={(rdf) => setDraft({ ...draft, rdf: Math.max(0, Math.trunc(rdf)) })} />
                  <NumberInput label="RDM (opcional)" value={draft.rdm} min={0} onChange={(rdm) => setDraft({ ...draft, rdm: Math.max(0, Math.trunc(rdm)) })} />
                  <Select label="Encantamento (opcional)" value={draft.enchantmentSpellId} options={[{ value: "", label: "Nenhum" }, ...spells.map((spell) => ({ value: spell.id, label: spell.name }))]} onChange={(value) => setDraft({ ...draft, enchantmentSpellId: value })} />
                  <Select label="Vínculo (opcional)" value={draft.bondId} options={[{ value: "", label: matchingBonds.length ? "Nenhum" : "Nenhum vínculo com este nome" }, ...matchingBonds.map((bond) => ({ value: bond.id, label: bond.name }))]} onChange={(value) => setDraft({ ...draft, bondId: value })} />
                  <Select label="Habilidade de Vínculo (opcional)" value={draft.bondAbilityId} options={[{ value: "", label: "Nenhuma" }, ...bondAbilities.map((ability) => ({ value: ability.id, label: ability.name }))]} onChange={(value) => setDraft({ ...draft, bondAbilityId: value })} />
                  <Select label="Perícia (opcional)" value={draft.skillId} options={[{ value: "", label: "Nenhuma" }, ...skills.map((skill) => ({ value: skill.id, label: skill.name }))]} onChange={(value) => setDraft({ ...draft, skillId: value })} />
                </div>
                <label className="mt-4 block"><span className="mb-1.5 block text-sm font-medium text-muted-foreground">Descrição</span><textarea rows={6} maxLength={5000} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} className="w-full resize-y rounded-xl border border-input bg-background p-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/25" /></label>
                <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between"><Button type="button" variant="destructive" onClick={() => !draftIsNew && removeItem(draft)} disabled={draftIsNew}><Trash2 /> Remover</Button><div className="flex flex-col-reverse gap-2 sm:flex-row"><Button type="button" variant="outline" onClick={() => setDialogMode("view")}><Eye /> Exibir</Button><Button type="submit"><Save /> Salvar item</Button></div></div>
              </form>}
        </div>, document.body,
      )}

      {referencePreview && typeof document !== "undefined" && createPortal(<ReferenceDialog preview={referencePreview} attributes={attributes} stats={stats} onClose={() => setReferencePreview(null)} onRollSkill={rollSkill} onRollBond={rollBond} />, document.body)}

      {armorConfirmation && typeof document !== "undefined" && createPortal(<div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/65 p-3"><div role="alertdialog" aria-modal="true" className="w-full max-w-md rounded-[22px] border border-border bg-card p-5 shadow-2xl"><h2 className="font-bold text-foreground">Trocar armadura equipada?</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Ao equipar <strong className="text-foreground">{armorConfirmation.nextName}</strong>, a armadura <strong className="text-foreground">{armorConfirmation.previousName}</strong> será desmarcada e passará para “Armazenado”.</p><div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button type="button" variant="outline" onClick={() => setArmorConfirmation(null)}>Cancelar</Button><Button type="button" onClick={() => { onItemsChange(armorConfirmation.nextItems); if (armorConfirmation.closeEditor) { setDraft(null); setDraftIsNew(false) } setArmorConfirmation(null) }}>Confirmar troca</Button></div></div></div>, document.body)}
    </section>
  )
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: readonly { value: string; label: string }[]; onChange: (value: string) => void }) {
  return <label><span className="mb-1.5 block text-sm font-medium text-muted-foreground">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-ring">{options.map((option) => <option key={`${label}-${option.value}`} value={option.value}>{option.label}</option>)}</select></label>
}

interface ItemViewProps {
  item: CharacterInventoryItem
  info: CharacterInfo
  skills: CharacterSkill[]
  bonds: CharacterBond[]
  abilities: CharacterAbility[]
  spells: CharacterSpell[]
  attributes: CharacterAttributes
  stats: CharacterStats
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
  onReference: (preview: ReferencePreview) => void
  onRollSkill: (id: string) => void
  onRollBond: (id: string) => void
  onRollDamage: (item: CharacterInventoryItem) => void
}

function ItemView({ item, info, skills, bonds, abilities, spells, attributes, stats, onClose, onEdit, onDelete, onReference, onRollSkill, onRollBond, onRollDamage }: ItemViewProps) {
  const spell = spells.find((candidate) => candidate.id === item.enchantmentSpellId)
  const bond = bonds.find((candidate) => candidate.id === item.bondId)
  const ability = abilities.find((candidate) => candidate.id === item.bondAbilityId)
  const skill = skills.find((candidate) => candidate.id === item.skillId)
  const skillTest = skill?.attributeKey ? calculateAttributeTest(attributes, skill.attributeKey) + calculateSkillModifier(skill) : null
  return <div role="dialog" aria-modal="true" aria-labelledby="inventory-view-title" className="max-h-[calc(100dvh-1.5rem)] w-full max-w-4xl overflow-y-auto rounded-[24px] border border-border bg-card p-4 shadow-2xl sm:p-6">
    <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Visualização do item</p><h2 id="inventory-view-title" className="mt-1 text-xl font-bold text-foreground">{item.name}</h2><p className="mt-1 text-sm text-muted-foreground">{inventoryTypeLabel(item.type)} · {inventoryUsageLabel(item.usage)}</p></div><button type="button" onClick={onClose} aria-label="Fechar item" className="inline-flex size-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted"><X className="size-5" /></button></div>
    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Info label="Afinidade" value={itemAffinityOptions[item.affinity]?.label ?? "Ordinário (0)"} /><Info label="Raridade" value={itemRarity(item.bondPoints)} /><Info label="Peso Base" value={`${formatWeight(item.baseWeight)} kg`} /><Info label="Peso Real" value={`${formatWeight(calculateItemRealWeight(item, info.scaleMultiplier))} kg`} />{item.damage && <Info label="Dano" value={item.damage} />}{(item.rdf > 0 || item.rdm > 0) && <><Info label="RDF" value={String(item.rdf)} /><Info label="RDM" value={String(item.rdm)} /></>}</div>
    {item.description && <div className="mt-4 rounded-xl border border-border bg-background/55 p-4"><span className="text-xs font-medium text-muted-foreground">Descrição</span><p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">{item.description}</p></div>}
    <div className="mt-4 grid gap-3 lg:grid-cols-2">
      {spell && <ReferenceCard title="Encantamento" name={spell.name} details={`${spellTypeLabel(spell.magicType)} · ${spellRange(spell)} · ${spell.duration || "Sem duração"} · ${costSummary(spell)} · ${spell.castingSkill || "Sem conjuração"}`} onOpen={() => onReference({ type: "spell", value: spell })} />}
      {bond && <ReferenceCard title="Vínculo" name={bond.name} details={`Teste ${calculateBondTest(attributes, stats, bond)} · ${calculateBondQuality(bond.points).name}`} onOpen={() => onReference({ type: "bond", value: bond })} action={<Button type="button" size="sm" onClick={() => onRollBond(bond.id)}><Dices /> Rolar Impressão</Button>} />}
      {ability && <ReferenceCard title="Habilidade de Vínculo" name={ability.name} details={`${plainText(ability.description) || "Sem descrição"} · Custo: ${costSummary(ability)}`} onOpen={() => onReference({ type: "ability", value: ability })} />}
      {skill && <ReferenceCard title="Perícia" name={skill.name} details={`Teste ${skillTest ?? "—"} · Nível ${calculateSkillLevel(skill.points)} · ${skill.attributeKey ? getAttributeDef(skill.attributeKey)?.name ?? "Sem atributo" : "Sem atributo"} · Mod. ${formatSigned(skill.modifier)}`} onOpen={() => onReference({ type: "skill", value: skill })} action={<Button type="button" size="sm" onClick={() => onRollSkill(skill.id)} disabled={!skill.attributeKey}><Dices /> Rolar teste</Button>} />}
    </div>
    <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between"><Button type="button" variant="destructive" onClick={onDelete}><Trash2 /> Remover</Button><div className="flex flex-col gap-2 sm:flex-row">{(item.type === "weapon" || item.type === "shield") && <Button type="button" variant="secondary" onClick={() => onRollDamage(item)} disabled={!item.damage}><Swords /> Rolar dano</Button>}<Button type="button" onClick={onEdit}><Pencil /> Editar</Button></div></div>
  </div>
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-border bg-background/55 p-3"><span className="text-xs text-muted-foreground">{label}</span><strong className="mt-1 block text-sm text-foreground">{value}</strong></div>
}

function ReferenceCard({ title, name, details, onOpen, action }: { title: string; name: string; details: string; onOpen: () => void; action?: React.ReactNode }) {
  return <article className="rounded-[18px] border border-border bg-muted/30 p-4"><span className="text-xs font-semibold text-muted-foreground">{title}</span><button type="button" onClick={onOpen} className="mt-1 block text-left font-bold text-foreground hover:text-primary">{name}</button><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{details}</p>{action && <div className="mt-3">{action}</div>}</article>
}

function ReferenceDialog({ preview, attributes, stats, onClose, onRollSkill, onRollBond }: { preview: ReferencePreview; attributes: CharacterAttributes; stats: CharacterStats; onClose: () => void; onRollSkill: (id: string) => void; onRollBond: (id: string) => void }) {
  let title = ""
  let content: React.ReactNode
  if (preview.type === "spell") {
    const spell = preview.value
    title = spell.name
    content = <><div className="grid gap-3 sm:grid-cols-2"><Info label="Tipo" value={spellTypeLabel(spell.magicType)} /><Info label="Alcance" value={spellRange(spell)} /><Info label="Duração" value={spell.duration || "—"} /><Info label="Custo" value={costSummary(spell)} /><Info label="Conjuração" value={spell.castingSkill || "—"} /></div><p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed">{plainText(spell.description) || "Sem descrição."}</p></>
  } else if (preview.type === "bond") {
    const bond = preview.value
    const quality = calculateBondQuality(bond.points)
    title = bond.name
    content = <><div className="grid gap-3 sm:grid-cols-3"><Info label="Teste" value={String(calculateBondTest(attributes, stats, bond))} /><Info label="Qualidade" value={quality.name} /><Info label="Nível" value={formatSigned(quality.level)} /></div><Button type="button" className="mt-4" onClick={() => onRollBond(bond.id)}><Dices /> Rolar Impressão</Button></>
  } else if (preview.type === "ability") {
    const ability = preview.value
    title = ability.name
    content = <><Info label="Custo" value={costSummary(ability)} /><p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed">{plainText(ability.description) || "Sem descrição."}</p></>
  } else {
    const skill = preview.value
    const test = skill.attributeKey ? calculateAttributeTest(attributes, skill.attributeKey) + calculateSkillModifier(skill) : null
    title = skill.name
    content = <><div className="grid gap-3 sm:grid-cols-4"><Info label="Teste" value={test === null ? "—" : String(test)} /><Info label="Nível" value={String(calculateSkillLevel(skill.points))} /><Info label="Atributo" value={skill.attributeKey ? getAttributeDef(skill.attributeKey)?.name ?? "—" : "—"} /><Info label="Mod." value={formatSigned(skill.modifier)} /></div><Button type="button" className="mt-4" onClick={() => onRollSkill(skill.id)} disabled={!skill.attributeKey}><Dices /> Rolar teste</Button></>
  }
  return <div className="fixed inset-0 z-[105] flex items-center justify-center bg-black/65 p-3"><div role="dialog" aria-modal="true" className="max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl overflow-y-auto rounded-[22px] border border-border bg-card p-5 shadow-2xl"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Visualização somente leitura</p><h2 className="mt-1 text-lg font-bold text-foreground">{title}</h2></div><button type="button" onClick={onClose} aria-label="Fechar visualização" className="inline-flex size-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted"><X className="size-5" /></button></div><div className="mt-4">{content}</div></div></div>
}
