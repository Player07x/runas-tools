"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  Archive, Bolt, ChevronDown, Copy, Database, Download, Edit3, Moon, Plus, RefreshCw,
  Search, Shield, Sparkles, Sun, Swords, Trash2, Upload, X,
} from "lucide-react"
import { attributeGroups } from "@runas/core/data/attributes"
import { characterElements, getCharacterElement } from "@runas/core/data/elements"
import { calculateCharacterStatSnapshot } from "@runas/core/lib/characterStatCalculations"
import { calculateDamage, convertDamageBonusesToDice, rollDice } from "@runas/core/lib/damageCalculator"
import { parseDamageExpression } from "@runas/core/lib/damageParser"
import { simulateDamageApplication } from "@runas/core/lib/damageApplication"
import { calculateMasteryImprovementPoints, masteryImprovementOptions } from "@runas/core/lib/masteryImprovements"
import { inventoryTypeOptions, inventoryUsageOptions } from "@runas/core/lib/inventoryCalculations"
import { synchronizeCharacterDerivedValues } from "@runas/core/lib/characterSynchronization"
import { applyQuickModifier } from "@runas/core/lib/quickModifier"
import { applyDeterminationToRoll, applyDeterminationUsesToRoll, compareSkillRolls, normalizeSkillName, rollSkillTest } from "@runas/core/lib/skillCalculations"
import type { AttributeKey, Character, CharacterSkill, CharacterSpell, SecondaryAttributeKey } from "@runas/core/types/character"
import type { SkillRoll, SkillRollOutcome, SpecialDieId } from "@runas/core/types/skillTest"
import {
  cloneCharacter, createEmptyCharacter, createInitialState, essenceYield,
  normalizeRunasDmState, type BestiaryEntry, type EncounterActor, type MasteryTable, type RunasDmState,
} from "../lib/model"
import { parseRunasImport } from "../lib/import"
import { parseGalleryZip } from "@runas/core/lib/galleryImport"
import { loadLocalState, saveLocalState } from "../lib/storage"
import { AdvancedSheetEditor } from "./advanced-sheet-editor"
import { AttributeBands } from "./attribute-bands"
import { PwaInstallCard } from "./pwa-install-card"

type WorkspaceView = "gallery" | "encounter"
type SaveStatus = "loading" | "saving" | "saved" | "error"

const secondaryAttributes: Array<{ key: SecondaryAttributeKey; label: string }> = attributeGroups.flatMap((group) =>
  group.attributes.map((attribute) => ({ key: attribute.key as SecondaryAttributeKey, label: attribute.name })),
)

function id(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`
}

async function preparePortrait(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Selecione uma imagem válida.")
  const source = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.src = source
    await image.decode()
    const size = 512
    const canvas = document.createElement("canvas")
    canvas.width = size
    canvas.height = size
    const context = canvas.getContext("2d")
    if (!context) throw new Error("Não foi possível processar a imagem.")
    const scale = Math.max(size / image.naturalWidth, size / image.naturalHeight)
    const width = image.naturalWidth * scale
    const height = image.naturalHeight * scale
    context.drawImage(image, (size - width) / 2, (size - height) / 2, width, height)
    return canvas.toDataURL("image/jpeg", 0.82)
  } finally {
    URL.revokeObjectURL(source)
  }
}

function listFromText(value: string): string[] {
  return value.split(/[,\n]/).map((item) => item.trim()).filter(Boolean)
}

function outcomeLabel(outcome: SkillRollOutcome): string {
  if (outcome === "critical-success") return "Sucesso crítico"
  if (outcome === "critical-failure") return "Fracasso crítico"
  return outcome === "success" ? "Sucesso" : "Fracasso"
}

export function DmDashboard() {
  const [state, setState] = useState<RunasDmState>(() => createInitialState())
  const [ready, setReady] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("loading")
  const [view, setView] = useState<WorkspaceView>("gallery")
  const [search, setSearch] = useState("")
  const [editing, setEditing] = useState<BestiaryEntry | null>(null)
  const [editingActor, setEditingActor] = useState<EncounterActor | null>(null)
  const [selectedActorId, setSelectedActorId] = useState<string | null>(null)
  const [theme, setTheme] = useState<"light" | "dark">("dark")
  const [syncMessage, setSyncMessage] = useState("")
  const importRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let active = true
    void loadLocalState().then((stored) => {
      if (!active) return
      if (stored) setState(normalizeRunasDmState(stored))
      setReady(true)
      setSaveStatus("saved")
    }).catch(() => {
      setReady(true)
      setSaveStatus("error")
    })
    return () => { active = false }
  }, [])

  useEffect(() => {
    const savedTheme = localStorage.getItem("runas-dm.theme")
    const initial = savedTheme === "light" ? "light" : "dark"
    document.documentElement.dataset.theme = initial
    const timeout = setTimeout(() => setTheme(initial), 0)
    return () => clearTimeout(timeout)
  }, [])

  useEffect(() => {
    if (!ready) return
    const next = { ...state, updatedAt: Date.now() }
    const timeout = setTimeout(() => {
      setSaveStatus("saving")
      void saveLocalState(next).then(() => setSaveStatus("saved")).catch(() => setSaveStatus("error"))
    }, 250)
    return () => clearTimeout(timeout)
  }, [ready, state])

  const filteredEntries = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR")
    if (!term) return state.entries
    return state.entries.filter(({ character }) =>
      [character.name, character.info.race, character.info.affinity, getCharacterElement(character.stats.elementId)?.name]
        .some((value) => value?.toLocaleLowerCase("pt-BR").includes(term)),
    )
  }, [search, state.entries])

  const selectedActor = state.encounter.find((actor) => actor.id === selectedActorId) ?? state.encounter[0] ?? null

  function updateState(updater: (current: RunasDmState) => RunasDmState) {
    setState((current) => ({ ...updater(current), updatedAt: Date.now() }))
  }

  function createSheet() {
    setEditing({ id: id("sheet"), character: createEmptyCharacter(), updatedAt: Date.now() })
  }

  function saveSheet(entry: BestiaryEntry) {
    updateState((current) => ({
      ...current,
      entries: current.entries.some((candidate) => candidate.id === entry.id)
        ? current.entries.map((candidate) => candidate.id === entry.id ? { ...entry, updatedAt: Date.now() } : candidate)
        : [{ ...entry, updatedAt: Date.now() }, ...current.entries],
    }))
    setEditing(null)
  }

  function saveActorSheet(entry: BestiaryEntry) {
    updateActor(entry.id, entry.character)
    setEditingActor(null)
  }

  function deleteSheet(entryId: string) {
    updateState((current) => ({
      ...current,
      entries: current.entries.filter((entry) => entry.id !== entryId),
      encounter: current.encounter.filter((actor) => actor.sourceId !== entryId),
    }))
  }

  function addToEncounter(entry: BestiaryEntry) {
    const copies = state.encounter.filter((actor) => actor.sourceId === entry.id).length
    const actor: EncounterActor = {
      id: id("actor"), sourceId: entry.id, copyNumber: copies + 1, character: cloneCharacter(entry.character),
    }
    updateState((current) => ({ ...current, encounter: [...current.encounter, actor] }))
    setSelectedActorId(actor.id)
    setView("encounter")
  }

  function duplicateActor(actor: EncounterActor) {
    const copyNumber = Math.max(0, ...state.encounter.filter((item) => item.sourceId === actor.sourceId).map((item) => item.copyNumber)) + 1
    const copy = { ...actor, id: id("actor"), copyNumber, character: cloneCharacter(actor.character) }
    updateState((current) => ({ ...current, encounter: [...current.encounter, copy] }))
    setSelectedActorId(copy.id)
  }

  function restoreActor(actor: EncounterActor) {
    const source = state.entries.find((entry) => entry.id === actor.sourceId)
    if (!source) return
    updateActor(actor.id, cloneCharacter(source.character))
  }

  function updateActor(actorId: string, character: Character) {
    updateState((current) => ({
      ...current,
      encounter: current.encounter.map((actor) => actor.id === actorId ? { ...actor, character } : actor),
    }))
  }

  function removeActor(actorId: string) {
    updateState((current) => ({ ...current, encounter: current.encounter.filter((actor) => actor.id !== actorId) }))
    if (selectedActorId === actorId) setSelectedActorId(null)
  }

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark"
    setTheme(next)
    document.documentElement.dataset.theme = next
    localStorage.setItem("runas-dm.theme", next)
  }

  function exportWorkspace() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `runas-dm-backup-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  async function importWorkspace(files: File[]) {
    if (files.length === 0) return
    const characters: Character[] = []
    let workspace: RunasDmState | null = null
    let ignored = 0

    for (const file of files) {
      try {
        if (file.name.toLocaleLowerCase().endsWith(".zip")) {
          const batch = await parseGalleryZip(file)
          characters.push(...batch.characters.map((entry) => entry.character))
          ignored += batch.ignoredFiles
          continue
        }
        const parsed = parseRunasImport(JSON.parse(await file.text()) as unknown)
        if (parsed.kind === "workspace") workspace = normalizeRunasDmState(parsed.state)
        else characters.push(parsed.character)
      } catch {
        ignored += 1
      }
    }

    if (!workspace && characters.length === 0) {
      setSyncMessage("Nenhuma ficha Runas válida foi encontrada nos arquivos selecionados.")
      return
    }

    const now = Date.now()
    setState((current) => {
      const base = workspace ?? current
      return {
        ...base,
        entries: [
          ...characters.map((character) => ({ id: id("sheet"), character, updatedAt: now })),
          ...base.entries,
        ],
        updatedAt: now,
      }
    })
    const imported = characters.length
    const parts = [workspace ? "backup do Runas DM restaurado" : "", imported ? `${imported} ${imported === 1 ? "ficha importada" : "fichas importadas"} do Runas Tools` : "", ignored ? `${ignored} arquivo(s) ignorado(s)` : ""].filter(Boolean)
    setSyncMessage(parts.join(" · "))
  }

  function getBackupToken(): string {
    let token = sessionStorage.getItem("runas-dm.backup-token") ?? ""
    if (!token) {
      token = window.prompt("Informe o token privado de backup desta sessão:")?.trim() ?? ""
      if (!token) return ""
      sessionStorage.setItem("runas-dm.backup-token", token)
    }
    return token
  }

  async function backupToCloud() {
    const token = getBackupToken()
    if (!token) { setSyncMessage("Backup cancelado: token não informado"); return }
    setSyncMessage("Enviando backup…")
    try {
      const response = await fetch("/api/backup", { method: "PUT", headers: { "content-type": "application/json", authorization: `Bearer ${token}` }, body: JSON.stringify(state) })
      if (response.status === 401) sessionStorage.removeItem("runas-dm.backup-token")
      if (!response.ok) throw new Error()
      setSyncMessage("Backup remoto atualizado")
    } catch {
      setSyncMessage("Backup remoto indisponível neste ambiente")
    }
  }

  async function restoreFromCloud() {
    const token = getBackupToken()
    if (!token) { setSyncMessage("Restauração cancelada: token não informado"); return }
    setSyncMessage("Consultando backup remoto…")
    try {
      const response = await fetch("/api/backup", { headers: { authorization: `Bearer ${token}` } })
      if (response.status === 401) sessionStorage.removeItem("runas-dm.backup-token")
      if (!response.ok) throw new Error()
      const payload = await response.json() as { state: RunasDmState | null; updatedAt: number | null }
      if (!payload.state) { setSyncMessage("Ainda não existe backup remoto"); return }
      const date = payload.updatedAt ? new Date(payload.updatedAt).toLocaleString("pt-BR") : "data desconhecida"
      if (!window.confirm(`Substituir os dados deste dispositivo pelo backup de ${date}?`)) { setSyncMessage("Restauração cancelada"); return }
      setState(payload.state)
      setSelectedActorId(null)
      setSyncMessage(`Backup de ${date} restaurado`)
    } catch {
      setSyncMessage("Não foi possível restaurar o backup remoto")
    }
  }

  return (
    <main className="dm-shell">
      <header className="topbar">
        <button className="brand" onClick={() => setView("gallery")} aria-label="Abrir galeria">
          <span className="brand-rune">R</span>
          <span><strong>Runas DM</strong><small>Mesa rápida</small></span>
        </button>
        <nav className="view-switch" aria-label="Áreas do Runas DM">
          <button className={view === "gallery" ? "active" : ""} onClick={() => setView("gallery")}><Archive size={17} /> Bestiário</button>
          <button className={view === "encounter" ? "active" : ""} onClick={() => setView("encounter")}><Swords size={17} /> Mesa <span>{state.encounter.length}</span></button>
        </nav>
        <div className="top-actions">
          <span className={`save-state ${saveStatus}`}><i />{saveStatus === "saving" ? "Salvando" : saveStatus === "error" ? "Falha local" : "Salvo localmente"}</span>
          <button className="icon-button" onClick={toggleTheme} title="Alternar tema">{theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}</button>
          <button className="icon-button" onClick={exportWorkspace} title="Exportar backup"><Download size={18} /></button>
          <button className="icon-button" onClick={() => importRef.current?.click()} title="Importar fichas JSON ou ZIP"><Upload size={18} /></button>
          <input ref={importRef} hidden multiple type="file" accept="application/json,.json,application/zip,.zip" onChange={(event) => { void importWorkspace(Array.from(event.target.files ?? [])); event.currentTarget.value = "" }} />
        </div>
      </header>

      {view === "gallery" ? (
        <section className="workspace gallery-workspace">
          <PwaInstallCard />
          <div className="workspace-heading">
            <div><p className="eyebrow">Galeria de fichas</p><h1>Seu bestiário, pronto para agir.</h1><p>{state.entries.length} fichas salvas sem limite artificial.</p></div>
            <div className="heading-actions"><button className="secondary-button" onClick={() => importRef.current?.click()}><Upload size={16} /> Importar fichas</button><button className="secondary-button" onClick={() => void restoreFromCloud()}><RefreshCw size={16} /> Restaurar</button><button className="secondary-button" onClick={() => void backupToCloud()}><Database size={17} /> Backup</button><button className="primary-button" onClick={createSheet}><Plus size={18} /> Nova ficha</button></div>
          </div>
          {syncMessage && <div className="inline-notice">{syncMessage}</div>}
          <div className="gallery-toolbar">
            <label className="search-box"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar nome, raça, afinidade ou elemento…" /></label>
            <span>{filteredEntries.length} exibidas</span>
          </div>
          <div className="sheet-grid">
            {filteredEntries.map((entry) => <SheetCard key={entry.id} entry={entry} onOpen={() => setEditing({ ...entry, character: cloneCharacter(entry.character) })} onAdd={() => addToEncounter(entry)} onDelete={() => deleteSheet(entry.id)} />)}
            <button className="new-sheet-card" onClick={createSheet}><span><Plus size={24} /></span><strong>Criar nova ficha</strong><small>Comece pelo formato simplificado</small></button>
          </div>
        </section>
      ) : (
        <EncounterWorkspace actors={state.encounter} selectedId={selectedActor?.id ?? null} entries={state.entries} onSelect={setSelectedActorId} onAdd={addToEncounter} onEdit={(actor) => setEditingActor({ ...actor, character: cloneCharacter(actor.character) })} onRestore={restoreActor} onDuplicate={duplicateActor} onRemove={removeActor} onUpdate={updateActor} />
      )}

      {editing && <SheetEditor entry={editing} tables={state.masteryTables} onClose={() => setEditing(null)} onSave={saveSheet} onTablesChange={(masteryTables) => updateState((current) => ({ ...current, masteryTables }))} />}
      {editingActor && <SheetEditor entry={{ id: editingActor.id, character: editingActor.character, updatedAt: Date.now() }} tables={state.masteryTables} onClose={() => setEditingActor(null)} onSave={saveActorSheet} onTablesChange={(masteryTables) => updateState((current) => ({ ...current, masteryTables }))} />}
      {!ready && <div className="loading-screen"><span className="brand-rune">R</span><p>Abrindo a mesa…</p></div>}
    </main>
  )
}

function SheetCard({ entry, onOpen, onAdd, onDelete }: { entry: BestiaryEntry; onOpen: () => void; onAdd: () => void; onDelete: () => void }) {
  const { character } = entry
  const element = getCharacterElement(character.stats.elementId)
  return (
    <article className={`sheet-card compact ${character.portraitDataUrl ? "has-portrait" : ""}`} style={{ "--element-color": element?.color ?? "#79dce0" } as React.CSSProperties}>
      <div className={`card-rune ${character.portraitDataUrl ? "has-portrait" : ""}`} aria-hidden="true">{character.portraitDataUrl ? <img src={character.portraitDataUrl} alt="" /> : <span>{character.name.slice(0, 1) || "R"}</span>}</div>
      <div className="card-title"><button className="card-title-button" onClick={onOpen} title="Abrir ficha simplificada"><p>{character.info.race || "Sem raça"} · {character.info.affinity || "Sem afinidade"} · EF {character.info.efficiency || "0"}%</p><h2>{character.name || "Sem nome"}</h2></button><div className="card-quick-actions"><button className="icon-button compact-add" onClick={onAdd} title="Levar à mesa"><Plus size={16} /></button></div></div>
      <button className="bestiary-overview" onClick={onOpen} title="Abrir ficha simplificada">
        <span className="compact-resources"><span><b>{character.stats.pv}</b> PV</span><span><b>{character.stats.pa}</b> PA{character.stats.paExtra > 0 && <i>+{character.stats.paExtra}</i>}</span><span><b>{character.stats.pe}</b> PE{character.stats.peTemporary > 0 && <i>+{character.stats.peTemporary}</i>}</span></span>
        <span className="compact-attributes"><span><b>FÍS {character.attributes.physical}</b><i>for {character.attributes.strength} · des {character.attributes.dexterity} · vit {character.attributes.vitality}</i></span><span><b>MEN {character.attributes.mental}</b><i>int {character.attributes.intelligence} · con {character.attributes.knowledge} · soc {character.attributes.social}</i></span><span><b>MÍS {character.attributes.mystic}</b><i>fé {character.attributes.faith} · pod {character.attributes.power} · sor {character.attributes.luck}</i></span></span>
      </button>
      <div className="card-delete-action"><button className="icon-button subtle danger-icon" onClick={onDelete} title="Excluir ficha"><Trash2 size={15} /></button></div>
    </article>
  )
}

function EncounterWorkspace({ actors, selectedId, entries, onSelect, onAdd, onEdit, onRestore, onDuplicate, onRemove, onUpdate }: { actors: EncounterActor[]; selectedId: string | null; entries: BestiaryEntry[]; onSelect: (id: string) => void; onAdd: (entry: BestiaryEntry) => void; onEdit: (actor: EncounterActor) => void; onRestore: (actor: EncounterActor) => void; onDuplicate: (actor: EncounterActor) => void; onRemove: (id: string) => void; onUpdate: (id: string, character: Character) => void }) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const selected = actors.find((actor) => actor.id === selectedId) ?? actors[0] ?? null
  return (
    <section className="workspace encounter-workspace">
      <div className="encounter-main">
        <div className="workspace-heading compact"><div><p className="eyebrow">Mesa de encontro</p><h1>Controle sem trocar de tela.</h1><p>Cada criatura é uma cópia independente da ficha do bestiário.</p></div><button className="primary-button" onClick={() => setPickerOpen((value) => !value)}><Plus size={18} /> Anexar inimigo</button></div>
        {pickerOpen && <div className="actor-picker">{entries.map((entry) => <button key={entry.id} onClick={() => { onAdd(entry); setPickerOpen(false) }}><span className={`mini-rune ${entry.character.portraitDataUrl ? "has-portrait" : ""}`}>{entry.character.portraitDataUrl ? <img src={entry.character.portraitDataUrl} alt="" /> : entry.character.name.slice(0, 1)}</span><span><strong>{entry.character.name}</strong><small>{entry.character.info.race}</small></span><Plus size={17} /></button>)}</div>}
        {actors.length === 0 ? <div className="empty-encounter"><Swords size={42} /><h2>A mesa está vazia</h2><p>Anexe uma ficha do bestiário para criar uma cópia de combate.</p><button className="primary-button" onClick={() => setPickerOpen(true)}><Plus size={17} /> Anexar primeiro inimigo</button></div> : <div className="actor-grid">{actors.map((actor) => <ActorCard key={actor.id} actor={actor} selected={actor.id === selected?.id} onSelect={() => onSelect(actor.id)} onEdit={() => onEdit(actor)} onRestore={() => onRestore(actor)} onDuplicate={() => onDuplicate(actor)} onRemove={() => onRemove(actor.id)} />)}</div>}
      </div>
      <aside className="action-dock">{selected ? <QuickActions key={selected.id} actor={selected} targets={[...actors.filter((candidate) => candidate.id !== selected.id), selected]} onUpdate={(character) => onUpdate(selected.id, character)} onUpdateTarget={onUpdate} /> : <div className="dock-empty"><Bolt size={28} /><p>Selecione uma criatura para abrir testes e dano.</p></div>}</aside>
    </section>
  )
}

function ActorCard({ actor, selected, onSelect, onEdit, onRestore, onDuplicate, onRemove }: { actor: EncounterActor; selected: boolean; onSelect: () => void; onEdit: () => void; onRestore: () => void; onDuplicate: () => void; onRemove: () => void }) {
  const element = getCharacterElement(actor.character.stats.elementId)
  const snapshot = calculateCharacterStatSnapshot(actor.character.attributes, actor.character.info, actor.character.stats, actor.character.skills, actor.character.abilities)
  return <article className={`actor-card ${selected ? "selected" : ""}`} onClick={onSelect} style={{ "--element-color": element?.color ?? "#79dce0" } as React.CSSProperties}><div className="actor-head"><span className={`mini-rune ${actor.character.portraitDataUrl ? "has-portrait" : ""}`}>{actor.character.portraitDataUrl ? <img src={actor.character.portraitDataUrl} alt="" /> : actor.copyNumber}</span><div><small>{element?.name ?? "Sem elemento"}</small><h2>{actor.character.name} #{actor.copyNumber}</h2></div><div><button className="icon-button subtle" onClick={(event) => { event.stopPropagation(); onEdit() }} title="Editar ficha desta cópia"><Edit3 size={15} /></button><button className="icon-button subtle" onClick={(event) => { event.stopPropagation(); onRestore() }} title="Restaurar ficha do bestiário"><RefreshCw size={15} /></button><button className="icon-button subtle" onClick={(event) => { event.stopPropagation(); onDuplicate() }} title="Duplicar"><Copy size={16} /></button><button className="icon-button subtle" onClick={(event) => { event.stopPropagation(); onRemove() }} title="Remover"><X size={16} /></button></div></div><div className="actor-resources"><ResourceBar label="PV" value={actor.character.stats.pv} maximum={snapshot.pvMax} color="red" /><ResourceBar label="PA" value={actor.character.stats.pa} maximum={snapshot.paMax} extra={actor.character.stats.paExtra} color="cyan" /><ResourceBar label="PE" value={actor.character.stats.pe} maximum={snapshot.peMax} extra={actor.character.stats.peTemporary} color="violet" /></div><p>{actor.character.stats.effects || "Nenhum efeito ativo"}</p></article>
}

function ResourceBar({ label, value, maximum, extra = 0, color }: { label: string; value: number; maximum: number; extra?: number; color: string }) {
  const percentage = maximum > 0 ? Math.min(100, Math.max(0, value / maximum * 100)) : value > 0 ? 100 : 0
  return <div className={`resource-bar ${color}`}><span>{label}</span><strong>{value}<small>/{maximum}</small>{extra > 0 ? ` +${extra}` : ""}</strong><i style={{ width: `${percentage}%` }} /></div>
}

function QuickActions({ actor, targets, onUpdate, onUpdateTarget }: { actor: EncounterActor; targets: EncounterActor[]; onUpdate: (character: Character) => void; onUpdateTarget: (id: string, character: Character) => void }) {
  const calculatorRef = useRef<HTMLDivElement>(null)
  const [mode, setMode] = useState<"test" | "damage">("damage")
  const [modifierOpen, setModifierOpen] = useState(false)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [modifier, setModifier] = useState("")
  const [testAttribute, setTestAttribute] = useState<SecondaryAttributeKey>("dexterity")
  const [skillName, setSkillName] = useState("Reflexo")
  const [skillModifier, setSkillModifier] = useState(0)
  const [specialDie, setSpecialDie] = useState<SpecialDieId>("none")
  const [damageExpression, setDamageExpression] = useState("2D cortante")
  const [targetId, setTargetId] = useState(() => targets[0]?.id ?? "")
  const [simulationEditing, setSimulationEditing] = useState(false)
  const [mtEnabled, setMtEnabled] = useState(false)
  const initialTarget = targets[0]?.character
  const [targetRdf, setTargetRdf] = useState(() => initialTarget ? initialTarget.stats.armorRdf + initialTarget.stats.naturalRdf : 0)
  const [targetRdm, setTargetRdm] = useState(() => initialTarget ? initialTarget.stats.armorRdm + initialTarget.stats.naturalRdm : 0)
  const [targetMtEnabled, setTargetMtEnabled] = useState(true)
  const [targetMtValue, setTargetMtValue] = useState(initialTarget?.stats.mt ?? 0)
  const [lifeElementEnabled, setLifeElementEnabled] = useState(false)
  const [extraAuraElementEnabled, setExtraAuraElementEnabled] = useState(false)
  const [extraAuraMultiplier, setExtraAuraMultiplier] = useState("1x")
  const [auraMultiplier, setAuraMultiplier] = useState("1x")
  const [lifeMultiplier, setLifeMultiplier] = useState("1x")
  const [extraAuraBreak, setExtraAuraBreak] = useState("1x")
  const [auraBreak, setAuraBreak] = useState("1/2")
  const [result, setResult] = useState<{ tone: "good" | "bad" | "neutral"; title: string; detail: string } | null>(null)
  const [pendingDamage, setPendingDamage] = useState<{ signature: string; amount: number; damageTypeId: string; damageTypeName: string; targetId: string; character: Character | null; title: string; detail: string } | null>(null)
  const [activeRoll, setActiveRoll] = useState<SkillRoll | null>(null)
  const makeDamageSignature = (expression: string, attackerMtEnabled: boolean) => [actor.id, targetId, expression, modifier, attackerMtEnabled, targetRdf, targetRdm, targetMtEnabled, targetMtValue, lifeElementEnabled, extraAuraElementEnabled, extraAuraMultiplier, auraMultiplier, lifeMultiplier, extraAuraBreak, auraBreak].join("|")
  const damageSignature = makeDamageSignature(damageExpression, mtEnabled)
  const simulatedDamage = pendingDamage?.signature === damageSignature ? pendingDamage : null

  const damageItems = actor.character.inventory.filter((item) => item.usage === "equipped" && (item.type === "weapon" || item.type === "shield") && item.damage.trim())
  const usableSkills = actor.character.skills.filter((skill) => skill.attributeKey)

  function selectDamageTarget(nextId: string) {
    setTargetId(nextId)
    setPendingDamage(null)
    const target = targets.find((candidate) => candidate.id === nextId)
    if (!target) return
    setTargetRdf(target.character.stats.armorRdf + target.character.stats.naturalRdf)
    setTargetRdm(target.character.stats.armorRdm + target.character.stats.naturalRdm)
    setTargetMtValue(target.character.stats.mt)
  }

  function runTest(requestedSkill?: CharacterSkill, context?: string) {
    const attributeKey = requestedSkill?.attributeKey || testAttribute
    const requestedName = requestedSkill?.name ?? skillName
    const requestedModifier = requestedSkill?.modifier ?? skillModifier
    if (!attributeKey) { setResult({ tone: "bad", title: "Teste sem atributo", detail: `Vincule um atributo à perícia ${requestedName}.` }); return }
    if (requestedSkill) {
      setMode("test")
      setTestAttribute(attributeKey)
      setSkillName(requestedName)
      setSkillModifier(requestedModifier)
      setPendingDamage(null)
    }
    const roll = rollSkillTest({ config: { attributeKey, skillName: requestedName, skillModifier: requestedModifier, masterModifier: 0, otherModifiers: 0, specialDieId: specialDie }, attributes: actor.character.attributes })
    if (!roll) return
    const total = applyQuickModifier(roll.totalTest, modifier)
    const margin = total - roll.diceSum
    const outcome: SkillRollOutcome = roll.diceRolls[0] === 1 && roll.diceRolls[1] === 1 ? "critical-success" : roll.diceRolls[0] === 10 && roll.diceRolls[1] === 10 ? "critical-failure" : margin >= 0 ? "success" : "failure"
    const adjusted = { ...roll, totalTest: total, totalModifiers: roll.totalModifiers + total - roll.totalTest, margin, outcome }
    setActiveRoll(adjusted)
    showSkillRoll(adjusted, context)
    requestAnimationFrame(() => calculatorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }))
  }

  function showSkillRoll(roll: SkillRoll, context?: string) {
    setResult({ tone: roll.outcome.includes("success") ? "good" : "bad", title: `${context ? `${context} · ` : ""}${outcomeLabel(roll.outcome)} ${roll.margin >= 0 ? "+" : ""}${roll.margin}`, detail: `${roll.skillName}: teste ${roll.totalTest} contra ${roll.diceRolls.join(" + ")} = ${roll.diceSum}` })
  }

  function spendDetermination() {
    if (!activeRoll || actor.character.stats.determination <= 0 || activeRoll.outcome.includes("critical")) return
    const modified = applyDeterminationToRoll(activeRoll)
    const next = cloneCharacter(actor.character)
    next.stats.determination -= 1
    onUpdate(next)
    setActiveRoll(modified)
    showSkillRoll(modified, "Determinação")
  }

  function spendCasualty() {
    if (!activeRoll || actor.character.stats.casualty <= 0) return
    const isChance = normalizeSkillName(activeRoll.skillName) === "acaso"
    if (!isChance && activeRoll.outcome.includes("critical")) return
    const rerolled = rollSkillTest({ config: { attributeKey: activeRoll.attributeKey, skillName: activeRoll.skillName, skillModifier: activeRoll.skillModifier, masterModifier: activeRoll.masterModifier, otherModifiers: activeRoll.otherModifiers, specialDieId: activeRoll.specialDieId }, attributes: actor.character.attributes })
    if (!rerolled) return
    const quickTotal = applyQuickModifier(rerolled.totalTest, modifier)
    const quickMargin = quickTotal - rerolled.diceSum
    const quickOutcome: SkillRollOutcome = rerolled.diceRolls[0] === 1 && rerolled.diceRolls[1] === 1 ? "critical-success" : rerolled.diceRolls[0] === 10 && rerolled.diceRolls[1] === 10 ? "critical-failure" : quickMargin >= 0 ? "success" : "failure"
    const quickAdjusted = { ...rerolled, totalTest: quickTotal, totalModifiers: rerolled.totalModifiers + quickTotal - rerolled.totalTest, margin: quickMargin, outcome: quickOutcome } as SkillRoll
    const adjustedReroll = applyDeterminationUsesToRoll(quickAdjusted, activeRoll.determinationUses)
    const chosen = isChance && compareSkillRolls(activeRoll, adjustedReroll) > 0 ? activeRoll : adjustedReroll
    const next = cloneCharacter(actor.character)
    next.stats.casualty -= 1
    onUpdate(next)
    setActiveRoll(chosen)
    showSkillRoll(chosen, isChance && chosen.id === activeRoll.id ? "Casualidade · melhor resultado mantido" : "Casualidade")
  }

  function stageDamage(amount: number, damageTypeId: string, damageTypeName: string, signature = damageSignature) {
    setActiveRoll(null)
    const total = Math.max(0, Math.trunc(Number.isFinite(amount) ? amount : 0))
    const target = targets.find((candidate) => candidate.id === targetId)
    if (!target) {
      setPendingDamage({ signature, amount: total, damageTypeId, damageTypeName, targetId: "", character: null, title: `${total} ${damageTypeName}`, detail: `${total} ${damageTypeName} · selecione um alvo da mesa para calcular resistências e recursos.` })
      return
    }
    const stats = target.character.stats
    const snapshot = calculateCharacterStatSnapshot(target.character.attributes, target.character.info, stats, target.character.skills, target.character.abilities)
    const element = getCharacterElement(stats.elementId)
    const resistances = [...new Set([...(element?.resistances ?? []), ...stats.resistances])]
    const weaknesses = [...new Set([...(element?.weaknesses ?? []), ...stats.weaknesses])]
    const simulation = simulateDamageApplication({ damage: { amount: total, damageTypeId }, mtEnabled: targetMtEnabled, mtValue: targetMtValue, rdf: targetRdf, rdm: targetRdm, attributeBonuses: { vitality: target.character.attributes.vitality, power: target.character.attributes.power, faith: target.character.attributes.faith, luck: target.character.attributes.luck }, layers: [
      { resource: "paExtra", current: stats.paExtra, resistances: extraAuraElementEnabled ? resistances : [], weaknesses: extraAuraElementEnabled ? weaknesses : [], multiplier: extraAuraMultiplier, breakMultiplier: extraAuraBreak },
      { resource: "pa", current: stats.pa, resistances, weaknesses, multiplier: auraMultiplier, breakMultiplier: auraBreak },
      { resource: "pv", current: stats.pv, maximum: snapshot.pvMax, resistances: lifeElementEnabled ? resistances : [], weaknesses: lifeElementEnabled ? weaknesses : [], multiplier: lifeMultiplier },
    ] })
    if (!simulation.value) { setPendingDamage(null); setResult({ tone: "bad", title: "Não foi possível simular", detail: simulation.error ?? "Revise o dano." }); return }
    const next = cloneCharacter(target.character)
    for (const change of simulation.value.changes) {
      const value = next.stats[change.resource] + change.amount
      next.stats[change.resource] = change.resource === "pv" ? value : Math.max(0, value)
    }
    const detail = [simulation.value.resultText, ...simulation.value.notices].filter(Boolean).join(" · ")
    const preview = { signature, amount: total, damageTypeId, damageTypeName, targetId: target.id, character: next, title: `${total} ${damageTypeName}`, detail: `${target.character.name} #${target.copyNumber}: ${detail}` }
    setPendingDamage(preview)
  }

  function simulateDamage(requestedExpression = damageExpression, requestedMt = mtEnabled) {
    setSimulationEditing(false)
    const parsed = parseDamageExpression(requestedExpression)
    if (!parsed.hasDamageValue || !parsed.damageTypeId) { setResult({ tone: "bad", title: "Dano incompleto", detail: "Use algo como 3D+2 cortante." }); return }
    const conversion = convertDamageBonusesToDice(parsed.numDice, [parsed.bonus])
    const rolled = parsed.numDice > 0 ? rollDice(conversion.numDice) : []
    const calculated = calculateDamage({ config: { numDice: parsed.numDice, damageTypeId: parsed.damageTypeId, attributeKey: parsed.attributeKey ?? "none", otherModifier: parsed.bonus, mtEnabled: requestedMt, mtValue: actor.character.stats.mt, otherMultiplier: "1", rdf: 0, rdm: 0 }, diceRolls: rolled, attributeValue: parsed.attributeKey ? actor.character.attributes[parsed.attributeKey] : 0 })
    stageDamage(applyQuickModifier(calculated.total, modifier), parsed.damageTypeId, calculated.damageTypeName, makeDamageSignature(requestedExpression, requestedMt))
  }

  function rollItemDamage(item: Character["inventory"][number]) {
    setMode("damage")
    setDamageExpression(item.damage)
    setMtEnabled(item.applyScaleWeight)
    setPendingDamage(null)
    simulateDamage(item.damage, item.applyScaleWeight)
    requestAnimationFrame(() => calculatorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }))
  }

  function castSpell(spell: CharacterSpell) {
    const normalized = spell.castingSkill.trim().toLocaleLowerCase("pt-BR")
    const skill = normalized ? actor.character.skills.find((candidate) => candidate.name.trim().toLocaleLowerCase("pt-BR") === normalized) : undefined
    if (!skill) {
      setResult({ tone: "bad", title: `Não foi possível conjurar ${spell.name}`, detail: spell.castingSkill ? `A perícia “${spell.castingSkill}” não foi encontrada nesta ficha.` : "Informe uma perícia de conjuração na magia." })
      return
    }
    runTest(skill, `Conjuração de ${spell.name}`)
  }

  function confirmDamage() {
    if (!simulatedDamage?.character || !simulatedDamage.targetId) return
    onUpdateTarget(simulatedDamage.targetId, simulatedDamage.character)
    setResult({ tone: "good", title: `Dano aplicado ao alvo: ${simulatedDamage.title}`, detail: simulatedDamage.detail })
    setPendingDamage(null)
  }

  return <div className="quick-actions"><div className="dock-title"><div><p className="eyebrow">Ações integradas</p><h2>{actor.character.name} #{actor.copyNumber}</h2></div><Bolt size={20} /></div><div className="actor-action-library">{damageItems.length > 0 && <ActionGroup title="Equipamentos" tone="damage">{damageItems.map((item) => { const linkedSkill = actor.character.skills.find((skill) => skill.id === item.skillId); return <article className="equipment-action" key={item.id}><span><strong>{item.name}</strong><small>{item.damage}{linkedSkill ? ` · ${linkedSkill.name}` : " · sem perícia vinculada"}</small></span><div><button onClick={() => rollItemDamage(item)}><Swords size={13} /> Dano</button><button disabled={!linkedSkill?.attributeKey} title={linkedSkill?.attributeKey ? `Rolar ${linkedSkill.name}` : "Vincule uma perícia ao equipamento na ficha"} onClick={() => linkedSkill && runTest(linkedSkill)}><Shield size={13} /> Teste</button></div></article> })}</ActionGroup>}{usableSkills.length > 0 && <ActionGroup title="Perícias" tone="test">{usableSkills.map((skill) => <button key={skill.id} onClick={() => runTest(skill)}><span><strong>{skill.name}</strong><small>{secondaryAttributes.find((attribute) => attribute.key === skill.attributeKey)?.label ?? "Teste"} · mod. {skill.modifier}</small></span><b><Shield size={13} /> Rolar teste</b></button>)}</ActionGroup>}{actor.character.spells.length > 0 && <ActionGroup title="Magias" tone="spell">{actor.character.spells.map((spell) => <button key={spell.id} onClick={() => castSpell(spell)}><span><strong>{spell.name}</strong><small>{spell.category || spell.magicType} · {spell.castingSkill || "sem perícia"}</small></span><b><Sparkles size={13} /> Conjurar</b></button>)}</ActionGroup>}</div><div className="mode-tabs" ref={calculatorRef}><button className={mode === "damage" ? "active" : ""} onClick={() => { setMode("damage"); setResult(null) }}><Swords size={16} /> Dano</button><button className={mode === "test" ? "active" : ""} onClick={() => { setMode("test"); setResult(null) }}><Shield size={16} /> Teste</button></div>
    {mode === "damage" ? <div className="quick-form"><label><span>Dano rápido</span><input value={damageExpression} onChange={(event) => setDamageExpression(event.target.value)} placeholder="3D+2 cortante" /></label><label className="damage-target-field"><span>Alvo da simulação</span><select value={targetId} onChange={(event) => selectDamageTarget(event.target.value)}><option value="">Apenas calcular o dano causado</option>{targets.map((target) => <option key={target.id} value={target.id}>{target.character.name} #{target.copyNumber}{target.id === actor.id ? " (o próprio personagem)" : ""}</option>)}</select></label>{advancedOpen && <div className="advanced-panel damage-advanced"><div className="advanced-group-title"><strong>Redução e escala do alvo</strong><small>Mesmas camadas da aplicação completa</small></div><label><span>RDF</span><input type="number" value={targetRdf} onChange={(event) => setTargetRdf(Number(event.target.value))} /></label><label><span>RDM</span><input type="number" value={targetRdm} onChange={(event) => setTargetRdm(Number(event.target.value))} /></label><label className="check-row"><input type="checkbox" checked={mtEnabled} onChange={(event) => setMtEnabled(event.target.checked)} /> Aplicar MT do atacante na rolagem</label><label className="check-row"><input type="checkbox" checked={targetMtEnabled} onChange={(event) => setTargetMtEnabled(event.target.checked)} /> Aplicar MT do alvo</label>{targetMtEnabled && <label><span>MT do alvo</span><input type="number" value={targetMtValue} onChange={(event) => setTargetMtValue(Number(event.target.value))} /></label>}<div className="damage-layer extra"><strong>PA Extra</strong><label className="check-row"><input type="checkbox" checked={extraAuraElementEnabled} onChange={(event) => setExtraAuraElementEnabled(event.target.checked)} /> Usar elemento</label><label><span>Multiplicador</span><input value={extraAuraMultiplier} onChange={(event) => setExtraAuraMultiplier(event.target.value)} /></label><label><span>Quebra</span><input value={extraAuraBreak} onChange={(event) => setExtraAuraBreak(event.target.value)} /></label></div><div className="damage-layer aura"><strong>PA</strong><small>{getCharacterElement(targets.find((target) => target.id === targetId)?.character.stats.elementId ?? "none")?.name ?? "Sem elemento"}</small><label><span>Multiplicador</span><input value={auraMultiplier} onChange={(event) => setAuraMultiplier(event.target.value)} /></label><label><span>Quebra</span><input value={auraBreak} onChange={(event) => setAuraBreak(event.target.value)} /></label></div><div className="damage-layer life"><strong>PV</strong><label className="check-row"><input type="checkbox" checked={lifeElementEnabled} onChange={(event) => setLifeElementEnabled(event.target.checked)} /> Usar elemento na vida</label><label><span>Multiplicador</span><input value={lifeMultiplier} onChange={(event) => setLifeMultiplier(event.target.value)} /></label></div><p>Resistências e fraquezas do elemento são combinadas com as personalizadas da ficha.</p></div>}<ConfigurationButtons modifierOpen={modifierOpen} advancedOpen={advancedOpen} onModifier={() => setModifierOpen((value) => !value)} onAdvanced={() => setAdvancedOpen((value) => !value)} />{modifierOpen && <ModifierInput value={modifier} onChange={setModifier} />}<button className="execute-button damage" onClick={() => simulateDamage()}>Simular dano</button>{simulatedDamage && <div className="damage-confirmation"><div className="damage-caused-line"><span>Dano causado</span><label><input aria-label="Valor do dano causado" type="number" min="0" value={simulatedDamage.amount} onChange={(event) => { const amount = Number(event.target.value); if (simulationEditing) setPendingDamage((current) => current ? { ...current, amount, title: `${amount} ${current.damageTypeName}` } : current); else stageDamage(amount, simulatedDamage.damageTypeId, simulatedDamage.damageTypeName) }} /><b>{simulatedDamage.damageTypeName}</b></label></div><div className="simulated-damage-editor"><div><span>Dano simulado</span><button className={simulationEditing ? "active" : ""} onClick={() => { if (simulationEditing) { setSimulationEditing(false); stageDamage(simulatedDamage.amount, simulatedDamage.damageTypeId, simulatedDamage.damageTypeName) } else setSimulationEditing(true) }}>{simulationEditing ? "Bloquear e recalcular" : "Editar texto"}</button></div><textarea aria-label="Dano simulado" readOnly={!simulationEditing} value={simulatedDamage.detail} onChange={(event) => setPendingDamage((current) => current ? { ...current, detail: event.target.value } : current)} /></div><button className="execute-button confirm" disabled={!simulatedDamage.character || simulationEditing} onClick={confirmDamage}>{simulatedDamage.character ? "Aplicar dano ao alvo" : "Selecione um alvo para aplicar"}</button></div>}</div> : <div className="quick-form"><label><span>Perícia ou teste</span><input value={skillName} onChange={(event) => setSkillName(event.target.value)} /></label>{advancedOpen && <div className="advanced-panel"><label><span>Atributo</span><select value={testAttribute} onChange={(event) => setTestAttribute(event.target.value as SecondaryAttributeKey)}>{secondaryAttributes.map((attribute) => <option key={attribute.key} value={attribute.key}>{attribute.label}</option>)}</select></label><label><span>Mod. da perícia</span><input type="number" value={skillModifier} onChange={(event) => setSkillModifier(Number(event.target.value))} /></label><label><span>Dado especial</span><select value={specialDie} onChange={(event) => setSpecialDie(event.target.value as SpecialDieId)}><option value="none">Nenhum</option><option value="luck">Sorte</option><option value="inspiration">Inspiração</option><option value="legendary-inspiration">Inspiração lendária</option><option value="divine-advantage">Divino: vantagem</option><option value="divine-disadvantage">Divino: desvantagem</option></select></label></div>}<ConfigurationButtons modifierOpen={modifierOpen} advancedOpen={advancedOpen} onModifier={() => setModifierOpen((value) => !value)} onAdvanced={() => setAdvancedOpen((value) => !value)} />{modifierOpen && <ModifierInput value={modifier} onChange={setModifier} />}<button className="execute-button test" onClick={() => runTest()}>Rolar teste</button></div>}
    {result && <div className={`roll-result ${result.tone}`}><strong>{result.title}</strong><span>{result.detail}</span></div>}{mode === "test" && activeRoll && <div className="narrative-spend"><button onClick={spendDetermination} disabled={actor.character.stats.determination <= 0 || activeRoll.outcome.includes("critical")}><b>Determinação</b><span>+{normalizeSkillName(activeRoll.skillName) === "vontade" ? 3 : 1} no teste · {actor.character.stats.determination} restante</span></button><button onClick={spendCasualty} disabled={actor.character.stats.casualty <= 0 || (normalizeSkillName(activeRoll.skillName) !== "acaso" && activeRoll.outcome.includes("critical"))}><b>Casualidade</b><span>Rolar novamente · {actor.character.stats.casualty} restante</span></button></div>}<p className="modifier-hint"><b>Modificador:</b> inteiros somam; x2 multiplica; x0,5 divide por dois.</p></div>
}

function ActionGroup({ title, tone, children }: { title: string; tone: "damage" | "test" | "spell"; children: React.ReactNode }) {
  return <details className={`action-group ${tone}`} open={tone === "damage"}><summary><span>{title}</span><ChevronDown size={14} /></summary><div>{children}</div></details>
}

function ConfigurationButtons({ modifierOpen, advancedOpen, onModifier, onAdvanced }: { modifierOpen: boolean; advancedOpen: boolean; onModifier: () => void; onAdvanced: () => void }) {
  return <div className="configuration-buttons"><button className={modifierOpen ? "active" : ""} onClick={onModifier}>± Modificador</button><button className={advancedOpen ? "active" : ""} onClick={onAdvanced}>Avançado <ChevronDown size={14} /></button></div>
}

function ModifierInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <label className="modifier-input"><span>Modificador final</span><input autoFocus value={value} onChange={(event) => onChange(event.target.value)} placeholder="+3, -2, x2 ou x0,5" /></label>
}

function SheetEditor({ entry, tables, onClose, onSave, onTablesChange }: { entry: BestiaryEntry; tables: MasteryTable[]; onClose: () => void; onSave: (entry: BestiaryEntry) => void; onTablesChange: (tables: MasteryTable[]) => void }) {
  const [character, setCharacter] = useState(() => cloneCharacter(entry.character))
  const [tab, setTab] = useState<"simple" | "advanced">("simple")
  const [tableId, setTableId] = useState("default")
  const selectedTable = tables.find((table) => table.id === tableId) ?? tables[0]
  const snapshot = calculateCharacterStatSnapshot(character.attributes, character.info, character.stats, character.skills, character.abilities)
  const availableMastery = calculateMasteryImprovementPoints(character.info) * (selectedTable?.multiplier ?? 1)

  function mutate(updater: (draft: Character) => void) {
    setCharacter((current) => { const next = cloneCharacter(current); updater(next); return synchronizeCharacterDerivedValues(current, next) })
  }

  function save() {
    onSave({ ...entry, character })
  }

  function switchTab(next: "simple" | "advanced") {
    setTab(next)
  }

  function restoreStats() {
    mutate((draft) => {
      draft.stats.pv = snapshot.pvMax
      draft.stats.pa = snapshot.paMax
      draft.stats.paExtra = snapshot.paExtraMax
      draft.stats.pe = snapshot.peMax
      draft.stats.peTemporary = snapshot.peMax
      draft.stats.determination = snapshot.determinationMax
      draft.stats.casualty = snapshot.casualtyMax
      draft.stats.focusCurrent = snapshot.focusMaximum
    })
  }

  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className={`sheet-modal ${tab === "advanced" ? "advanced-mode" : "simple-mode"}`} role="dialog" aria-modal="true" aria-label="Editor de ficha"><header><div><p className="eyebrow">{entry.character.name ? "Editar criatura" : "Nova criatura"}</p><h2>{character.name || "Ficha sem nome"}</h2></div><div className="editor-tabs"><button className={tab === "simple" ? "active" : ""} onClick={() => switchTab("simple")}>Simplificada</button><button className={tab === "advanced" ? "active" : ""} onClick={() => switchTab("advanced")}>Avançada</button></div><button className="icon-button" onClick={onClose}><X size={20} /></button></header>
    {tab === "simple" ? <div className="editor-body simple-sheet-editor"><section className="form-section hero-fields simple-identity-card"><div className={`editor-rune portrait-editor ${character.portraitDataUrl ? "has-portrait" : ""}`}>{character.portraitDataUrl ? <img src={character.portraitDataUrl} alt={`Imagem de ${character.name || "criatura"}`} /> : <><span>{character.name.slice(0, 1) || "R"}</span><small>RUNAS</small></>}<label title="Selecionar imagem"><Upload size={14} /><span className="sr-only">Selecionar imagem</span><input type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) void preparePortrait(file).then((portraitDataUrl) => mutate((draft) => { draft.portraitDataUrl = portraitDataUrl })) }} /></label>{character.portraitDataUrl && <button aria-label="Remover imagem da ficha" title="Remover imagem" onClick={() => mutate((draft) => { delete draft.portraitDataUrl })}><Trash2 size={13} /><span className="sr-only">Remover imagem</span></button>}</div><Field label="Nome" value={character.name} onChange={(value) => mutate((draft) => { draft.name = value })} /><Field label="Raça" value={character.info.race} onChange={(value) => mutate((draft) => { draft.info.race = value })} /><Field label="Afinidade" value={character.info.affinity} onChange={(value) => mutate((draft) => { draft.info.affinity = value })} /><PercentField label="Eficiência" value={character.info.efficiency} onChange={(value) => mutate((draft) => { draft.info.efficiency = value })} /></section>
      <section className="form-section simple-sheet-section attribute-section"><SectionTitle title="Atributos" note="Organização histórica do sistema Runas" /><AttributeBands attributes={character.attributes} onChange={(key: AttributeKey, value) => mutate((draft) => { draft.attributes[key] = value })} /></section>
      <section className="form-section simple-sheet-section resource-section"><SectionTitle title="Recursos e defesa" note="Atuais e máximos calculados automaticamente" /><button className="restore-stats-button simple" onClick={restoreStats}><RefreshCw size={14} /> Restaurar estatísticas</button><div className="field-grid six resource-ribbon"><ResourceField label="PV" value={character.stats.pv} maximum={snapshot.pvMax} onChange={(value) => mutate((draft) => { draft.stats.pv = value })} /><ResourceField label="PA" value={character.stats.pa} maximum={snapshot.paMax} onChange={(value) => mutate((draft) => { draft.stats.pa = value })} /><ResourceField label="PA extra" value={character.stats.paExtra} maximum={snapshot.paExtraMax} onChange={(value) => mutate((draft) => { draft.stats.paExtra = value })} /><ResourceField label="PE" value={character.stats.pe} maximum={snapshot.peMax} onChange={(value) => mutate((draft) => { draft.stats.pe = value })} /><ResourceField label="PE temporário" value={character.stats.peTemporary} maximum={snapshot.peTemporaryMax} onChange={(value) => mutate((draft) => { draft.stats.peTemporary = value })} /><div className="calculated-field"><span>Deslocamento</span><strong>{snapshot.movement} m</strong></div></div><div className="field-grid defense-grid"><label className="field"><span>Elemento principal</span><select value={character.stats.elementId} onChange={(event) => mutate((draft) => { const element = getCharacterElement(event.target.value); draft.stats.elementId = event.target.value; draft.stats.resistances = [...(element?.resistances ?? [])]; draft.stats.weaknesses = [...(element?.weaknesses ?? [])] })}><option value="none">Nenhum</option>{characterElements.map((element) => <option key={element.id} value={element.id}>{element.name}</option>)}</select></label><Field label="Resistências" value={character.stats.resistances.join(", ")} onChange={(value) => mutate((draft) => { draft.stats.resistances = listFromText(value) })} /><Field label="Fraquezas" value={character.stats.weaknesses.join(", ")} onChange={(value) => mutate((draft) => { draft.stats.weaknesses = listFromText(value) })} /></div></section>
      <section className="form-section simple-sheet-section linked-section"><SectionTitle title="Perícias, características e ações" note="Registros vinculados à ficha completa" /><div className="simple-linked-grid"><SimpleSkills character={character} mutate={mutate} /><SimpleRacialAbilities character={character} mutate={mutate} /></div><SimpleActions character={character} mutate={mutate} /></section>
      <section className="form-section simple-sheet-section mastery-section"><SectionTitle title="Melhorias" note={`${availableMastery} pontos disponíveis na tabela selecionada`} /><div className="mastery-toolbar"><select value={tableId} onChange={(event) => setTableId(event.target.value)}>{tables.map((table) => <option key={table.id} value={table.id}>{table.name}</option>)}</select><button className="secondary-button" onClick={() => { const table = { id: id("table"), name: `Tabela ${tables.length + 1}`, multiplier: 1 }; onTablesChange([...tables, table]); setTableId(table.id) }}><Plus size={15} /> Nova tabela</button>{selectedTable && !["default", "double"].includes(selectedTable.id) && <><input value={selectedTable.name} onChange={(event) => onTablesChange(tables.map((table) => table.id === selectedTable.id ? { ...table, name: event.target.value } : table))} /><label className="mini-field">Multiplicador <input type="number" min="0.1" step="0.1" value={selectedTable.multiplier} onChange={(event) => onTablesChange(tables.map((table) => table.id === selectedTable.id ? { ...table, multiplier: Number(event.target.value) || 1 } : table))} /></label><button className="secondary-button danger-icon" title="Remover tabela customizada" onClick={() => { onTablesChange(tables.filter((table) => table.id !== selectedTable.id)); setTableId("default") }}><Trash2 size={15} /> Remover</button></>}</div><div className="mastery-grid">{masteryImprovementOptions.map((option) => <NumberField key={option.key} label={`${option.name} / ${option.cost} pontos`} value={character.stats.masteryImprovements[option.key]} onChange={(next) => mutate((draft) => { draft.stats.masteryImprovements[option.key] = next })} />)}</div></section>
      <section className="form-section simple-sheet-section inventory-section"><SectionTitle title="Recursos carregados" note={`Essências geradas automaticamente: ${essenceYield(character)}`} /><SimpleInventory character={character} mutate={mutate} /><div className="field-grid resource-total"><Field label="Essências totais" value={character.info.essences} onChange={(value) => mutate((draft) => { draft.info.essences = value })} /></div></section></div> : <AdvancedSheetEditor character={character} onChange={setCharacter} />}
    <footer className="modal-footer"><button className="secondary-button" onClick={onClose}>Cancelar</button><button className="primary-button" onClick={save}>Salvar ficha</button></footer></section></div>
}

type CharacterMutator = (updater: (draft: Character) => void) => void

function SimpleSkills({ character, mutate }: { character: Character; mutate: CharacterMutator }) {
  return <LinkedPanel title="Perícias" count={character.skills.length} onAdd={() => mutate((draft) => { draft.skills.push({ id: id("skill"), name: "Nova perícia", attributeKey: "knowledge", points: 0, modifier: 0, locked: false }) })}>
    {character.skills.map((skill) => <div className="linked-item skill" key={skill.id}><input aria-label={`Nome da perícia ${skill.name}`} value={skill.name} onChange={(event) => mutate((draft) => assignById(draft.skills, skill.id, { name: event.target.value }))} /><select aria-label={`Atributo de ${skill.name}`} value={skill.attributeKey} onChange={(event) => mutate((draft) => assignById(draft.skills, skill.id, { attributeKey: event.target.value as SecondaryAttributeKey }))}>{secondaryAttributes.map((attribute) => <option key={attribute.key} value={attribute.key}>{attribute.label.slice(0, 3)}</option>)}</select><input className="linked-number" aria-label={`Pontos de ${skill.name}`} type="number" value={skill.points} onChange={(event) => mutate((draft) => assignById(draft.skills, skill.id, { points: Number(event.target.value) }))} /><input className="linked-number" aria-label={`Modificador de ${skill.name}`} type="number" value={skill.modifier} onChange={(event) => mutate((draft) => assignById(draft.skills, skill.id, { modifier: Number(event.target.value) }))} />{skill.locked ? <span className="linked-lock">fixa</span> : <button className="linked-remove" title="Remover perícia" onClick={() => mutate((draft) => { draft.skills = draft.skills.filter((item) => item.id !== skill.id) })}><X size={13} /></button>}</div>)}
  </LinkedPanel>
}

function SimpleRacialAbilities({ character, mutate }: { character: Character; mutate: CharacterMutator }) {
  const racials = character.abilities.filter((ability) => ability.category.toLocaleLowerCase("pt-BR") === "racial")
  return <LinkedPanel title="Características raciais" count={racials.length} onAdd={() => mutate((draft) => { draft.abilities.push({ id: id("racial"), category: "Racial", name: "Nova característica", description: "", permanentModifiers: "", costType: "none", costMode: "fixed", costValue: 0, costText: "" }) })}>
    {racials.map((ability) => <div className="linked-item" key={ability.id}><span className="linked-source">Racial</span><input aria-label={`Nome da característica ${ability.name}`} value={ability.name} onChange={(event) => mutate((draft) => assignById(draft.abilities, ability.id, { name: event.target.value }))} /><button className="linked-remove" title="Remover característica" onClick={() => mutate((draft) => { draft.abilities = draft.abilities.filter((item) => item.id !== ability.id) })}><X size={13} /></button></div>)}
  </LinkedPanel>
}

function SimpleActions({ character, mutate }: { character: Character; mutate: CharacterMutator }) {
  const abilities = character.abilities.filter((ability) => ability.category.toLocaleLowerCase("pt-BR") !== "racial")
  const equippedItems = character.inventory.filter((item) => item.usage === "equipped")
  return <div className="linked-panel actions-panel"><header><div><strong>Ações e habilidades</strong><span>{abilities.length + character.spells.length + equippedItems.length} itens vinculados</span></div><div className="linked-add-group"><button onClick={() => mutate((draft) => { draft.abilities.push({ id: id("ability"), category: "Combate", name: "Nova habilidade", description: "", permanentModifiers: "", costType: "none", costMode: "fixed", costValue: 0, costText: "" }) })}><Plus size={13} /> Habilidade</button><button onClick={() => mutate((draft) => { draft.spells.push({ id: id("spell"), category: "Elemental", name: "Nova magia", description: "", costType: "none", costMode: "fixed", costValue: 0, costText: "", magicType: "spell", rangeType: "personal", rangeText: "", area: "", duration: "", castingSkill: "" }) })}><Plus size={13} /> Magia</button><button onClick={() => mutate((draft) => { draft.inventory.push(createQuickItem("Novo ataque", "equipped", "weapon")) })}><Plus size={13} /> Ataque</button></div></header><div className="linked-action-list">
    {equippedItems.map((item) => { const isAttack = item.type === "weapon" || item.damage.trim().length > 0; return <div className="linked-item action" key={`item-${item.id}`}><span className={`linked-source ${isAttack ? "attack" : "equipped"}`}>{isAttack ? "Ataque" : "Equipado"}</span><input aria-label={`Nome do item equipado ${item.name}`} value={item.name} onChange={(event) => mutate((draft) => assignById(draft.inventory, item.id, { name: event.target.value }))} /><input aria-label={`Dano de ${item.name}`} value={item.damage} placeholder={isAttack ? "Dano" : "Sem dano"} onChange={(event) => mutate((draft) => assignById(draft.inventory, item.id, { damage: event.target.value }))} /><button className="linked-remove" title="Remover item equipado" onClick={() => mutate((draft) => { draft.inventory = draft.inventory.filter((candidate) => candidate.id !== item.id) })}><X size={13} /></button></div> })}
    {abilities.map((ability) => <div className="linked-item action" key={`ability-${ability.id}`}><span className="linked-source ability">Habilidade</span><input aria-label={`Nome da habilidade ${ability.name}`} value={ability.name} onChange={(event) => mutate((draft) => assignById(draft.abilities, ability.id, { name: event.target.value }))} /><input aria-label={`Categoria de ${ability.name}`} value={ability.category} placeholder="Categoria" onChange={(event) => mutate((draft) => assignById(draft.abilities, ability.id, { category: event.target.value }))} /><button className="linked-remove" title="Remover habilidade" onClick={() => mutate((draft) => { draft.abilities = draft.abilities.filter((candidate) => candidate.id !== ability.id) })}><X size={13} /></button></div>)}
    {character.spells.map((spell) => <div className="linked-item action" key={`spell-${spell.id}`}><span className="linked-source spell">Magia</span><input aria-label={`Nome da magia ${spell.name}`} value={spell.name} onChange={(event) => mutate((draft) => assignById(draft.spells, spell.id, { name: event.target.value }))} /><input aria-label={`Categoria de ${spell.name}`} value={spell.category} placeholder="Categoria" onChange={(event) => mutate((draft) => assignById(draft.spells, spell.id, { category: event.target.value }))} /><button className="linked-remove" title="Remover magia" onClick={() => mutate((draft) => { draft.spells = draft.spells.filter((candidate) => candidate.id !== spell.id) })}><X size={13} /></button></div>)}
  </div></div>
}

function SimpleInventory({ character, mutate }: { character: Character; mutate: CharacterMutator }) {
  return <LinkedPanel title="Itens do inventário" count={character.inventory.length} onAdd={() => mutate((draft) => { draft.inventory.push(createQuickItem("Novo recurso", "stored", "other")) })}>
    {character.inventory.map((item) => <SimpleInventoryItem key={item.id} item={item} character={character} mutate={mutate} />)}
  </LinkedPanel>
}

function SimpleInventoryItem({ item, character, mutate }: { item: Character["inventory"][number]; character: Character; mutate: CharacterMutator }) {
  const [open, setOpen] = useState(false)
  return <article className={`simple-inventory-item ${open ? "open" : ""}`}><div className="linked-item inventory"><select aria-label={`Uso de ${item.name}`} value={item.usage} onChange={(event) => mutate((draft) => assignById(draft.inventory, item.id, { usage: event.target.value as typeof item.usage }))}>{inventoryUsageOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><input aria-label={`Nome do item ${item.name}`} value={item.name} onChange={(event) => mutate((draft) => assignById(draft.inventory, item.id, { name: event.target.value }))} /><input className="linked-number" aria-label={`Quantidade de ${item.name}`} type="number" min="1" value={item.quantity} onChange={(event) => mutate((draft) => assignById(draft.inventory, item.id, { quantity: Math.max(1, Number(event.target.value)) }))} /><button className="linked-edit" title={open ? "Ocultar edição" : "Editar equipamento"} onClick={() => setOpen((value) => !value)}><Edit3 size={13} /></button><button className="linked-remove" title="Remover item" onClick={() => mutate((draft) => { draft.inventory = draft.inventory.filter((candidate) => candidate.id !== item.id) })}><X size={13} /></button></div>{open && <div className="simple-item-details"><label className="field"><span>Tipo</span><select value={item.type} onChange={(event) => mutate((draft) => assignById(draft.inventory, item.id, { type: event.target.value as typeof item.type }))}>{inventoryTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label><Field label="Dano" value={item.damage} onChange={(value) => mutate((draft) => assignById(draft.inventory, item.id, { damage: value }))} /><label className="field"><span>Perícia vinculada</span><select value={item.skillId} onChange={(event) => mutate((draft) => assignById(draft.inventory, item.id, { skillId: event.target.value }))}><option value="">Nenhuma</option>{character.skills.map((skill) => <option key={skill.id} value={skill.id}>{skill.name}</option>)}</select></label><NumberField label="Peso base" value={item.baseWeight} onChange={(value) => mutate((draft) => assignById(draft.inventory, item.id, { baseWeight: value }))} /><NumberField label="RDF" value={item.rdf} onChange={(value) => mutate((draft) => assignById(draft.inventory, item.id, { rdf: value }))} /><NumberField label="RDM" value={item.rdm} onChange={(value) => mutate((draft) => assignById(draft.inventory, item.id, { rdm: value }))} /><label className="field wide"><span>Descrição</span><textarea value={item.description} onChange={(event) => mutate((draft) => assignById(draft.inventory, item.id, { description: event.target.value }))} /></label></div>}</article>
}

function LinkedPanel({ title, count, onAdd, children }: { title: string; count: number; onAdd: () => void; children: React.ReactNode }) {
  return <div className="linked-panel"><header><div><strong>{title}</strong><span>{count} vinculados</span></div><button onClick={onAdd}><Plus size={13} /> Adicionar</button></header><div className="linked-list">{count > 0 ? children : <p>Nenhum item cadastrado.</p>}</div></div>
}

function assignById<T extends { id: string }>(items: T[], itemId: string, updates: Partial<T>) { const item = items.find((candidate) => candidate.id === itemId); if (item) Object.assign(item, updates) }
function createQuickItem(name: string, usage: "equipped" | "stored", type: "weapon" | "other"): Character["inventory"][number] { return { id: id("item"), usage, name, type, affinity: 0, bondPoints: 0, baseWeight: 0, quantity: 1, applyScaleWeight: false, damage: "", rdf: 0, rdm: 0, prCurrent: null, prMaximum: null, enchantmentSpellId: "", bondId: "", bondAbilityId: "", skillId: "", description: "" } }

function SectionTitle({ title, note }: { title: string; note: string }) { return <div className="section-title"><h3>{title}</h3><span>{note}</span></div> }
function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="field"><span>{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} /></label> }
function PercentField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="field percent-field"><span>{label}</span><span className="percent-input"><input inputMode="decimal" value={value} onChange={(event) => onChange(event.target.value.replace(/%/g, ""))} /><b>%</b></span></label> }
function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) { return <label className="field number-field"><span>{label}</span><input type="number" value={value} onChange={(event) => onChange(Number(event.target.value))} /></label> }
function ResourceField({ label, value, maximum, onChange }: { label: string; value: number; maximum: number; onChange: (value: number) => void }) { return <label className="field number-field resource-field"><span>{label}</span><span className="resource-value"><input aria-label={`${label} atual`} type="number" value={value} onChange={(event) => onChange(Number(event.target.value))} /><output aria-label={`${label} máximo`}>/ {maximum}</output></span></label> }
