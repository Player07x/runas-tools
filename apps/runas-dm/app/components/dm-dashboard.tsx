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
import { calculateMasteryImprovementPoints } from "@runas/core/lib/masteryImprovements"
import { applyQuickModifier } from "@runas/core/lib/quickModifier"
import { rollSkillTest } from "@runas/core/lib/skillCalculations"
import type { Character, SecondaryAttributeKey } from "@runas/core/types/character"
import type { SkillRollOutcome, SpecialDieId } from "@runas/core/types/skillTest"
import {
  actionsAndAbilities, cloneCharacter, createEmptyCharacter, createInitialState, essenceYield,
  racialCharacteristics, type BestiaryEntry, type EncounterActor, type MasteryTable, type RunasDmState,
} from "../lib/model"
import { parseRunasImport } from "../lib/import"
import { loadLocalState, saveLocalState } from "../lib/storage"
import { AdvancedSheetEditor } from "./advanced-sheet-editor"
import { PwaInstallCard } from "./pwa-install-card"

type WorkspaceView = "gallery" | "encounter"
type SaveStatus = "loading" | "saving" | "saved" | "error"

const secondaryAttributes: Array<{ key: SecondaryAttributeKey; label: string }> = attributeGroups.flatMap((group) =>
  group.attributes.map((attribute) => ({ key: attribute.key as SecondaryAttributeKey, label: attribute.name })),
)

function id(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`
}

function listFromText(value: string): string[] {
  return value.split(/[,\n]/).map((item) => item.trim()).filter(Boolean)
}

function resourceLine(character: Character): string {
  const inventory = character.inventory.map((item) => `${item.quantity}× ${item.name}`)
  return [...inventory, `${essenceYield(character)}× Essência`].join(" · ")
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
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null)
  const [selectedActorId, setSelectedActorId] = useState<string | null>(null)
  const [theme, setTheme] = useState<"light" | "dark">("dark")
  const [syncMessage, setSyncMessage] = useState("")
  const importRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let active = true
    void loadLocalState().then((stored) => {
      if (!active) return
      if (stored) setState(stored)
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

  function deleteSheet(entryId: string) {
    updateState((current) => ({
      ...current,
      entries: current.entries.filter((entry) => entry.id !== entryId),
      encounter: current.encounter.filter((actor) => actor.sourceId !== entryId),
    }))
    if (expandedEntryId === entryId) setExpandedEntryId(null)
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

  async function importWorkspace(file: File) {
    try {
      const parsed = parseRunasImport(JSON.parse(await file.text()) as unknown)
      if (parsed.kind === "workspace") {
        setState(parsed.state)
        setSyncMessage("Backup completo importado")
        return
      }
      updateState((current) => ({ ...current, entries: [{ id: id("sheet"), character: parsed.character, updatedAt: Date.now() }, ...current.entries] }))
      setSyncMessage(`Ficha “${parsed.character.name}” importada com todos os registros vinculados`)
    } catch (error) {
      setSyncMessage(error instanceof Error ? error.message : "Não foi possível importar o arquivo")
    }
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
          <button className="icon-button" onClick={() => importRef.current?.click()} title="Importar JSON"><Upload size={18} /></button>
          <input ref={importRef} hidden type="file" accept="application/json,.json" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importWorkspace(file); event.currentTarget.value = "" }} />
        </div>
      </header>

      {view === "gallery" ? (
        <section className="workspace gallery-workspace">
          <PwaInstallCard />
          <div className="workspace-heading">
            <div><p className="eyebrow">Galeria de fichas</p><h1>Seu bestiário, pronto para agir.</h1><p>{state.entries.length} fichas salvas sem limite artificial.</p></div>
            <div className="heading-actions"><button className="secondary-button" onClick={() => void restoreFromCloud()}><RefreshCw size={16} /> Restaurar</button><button className="secondary-button" onClick={() => void backupToCloud()}><Database size={17} /> Backup</button><button className="primary-button" onClick={createSheet}><Plus size={18} /> Nova ficha</button></div>
          </div>
          {syncMessage && <div className="inline-notice">{syncMessage}</div>}
          <div className="gallery-toolbar">
            <label className="search-box"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar nome, raça, afinidade ou elemento…" /></label>
            <span>{filteredEntries.length} exibidas</span>
          </div>
          <div className="sheet-grid">
            {filteredEntries.map((entry) => <SheetCard key={entry.id} entry={entry} expanded={expandedEntryId === entry.id} onToggle={() => setExpandedEntryId((current) => current === entry.id ? null : entry.id)} onEdit={() => setEditing({ ...entry, character: cloneCharacter(entry.character) })} onAdd={() => addToEncounter(entry)} onDelete={() => deleteSheet(entry.id)} />)}
            <button className="new-sheet-card" onClick={createSheet}><span><Plus size={24} /></span><strong>Criar nova ficha</strong><small>Comece pelo formato simplificado</small></button>
          </div>
        </section>
      ) : (
        <EncounterWorkspace actors={state.encounter} selectedId={selectedActor?.id ?? null} entries={state.entries} onSelect={setSelectedActorId} onAdd={addToEncounter} onDuplicate={duplicateActor} onRemove={removeActor} onUpdate={updateActor} />
      )}

      {editing && <SheetEditor entry={editing} tables={state.masteryTables} onClose={() => setEditing(null)} onSave={saveSheet} onTablesChange={(masteryTables) => updateState((current) => ({ ...current, masteryTables }))} />}
      {!ready && <div className="loading-screen"><span className="brand-rune">R</span><p>Abrindo a mesa…</p></div>}
    </main>
  )
}

function SheetCard({ entry, expanded, onToggle, onEdit, onAdd, onDelete }: { entry: BestiaryEntry; expanded: boolean; onToggle: () => void; onEdit: () => void; onAdd: () => void; onDelete: () => void }) {
  const { character } = entry
  const snapshot = calculateCharacterStatSnapshot(character.attributes, character.info, character.stats, character.skills, character.abilities)
  const element = getCharacterElement(character.stats.elementId)
  const racials = racialCharacteristics(character)
  const actions = actionsAndAbilities(character)
  return (
    <article className={`sheet-card ${expanded ? "expanded" : "compact"}`} style={{ "--element-color": element?.color ?? "#79dce0" } as React.CSSProperties}>
      <div className="card-rune" aria-hidden="true"><span>{character.name.slice(0, 1) || "R"}</span></div>
      <div className="card-title"><button className="card-title-button" onClick={onToggle} aria-expanded={expanded}><p>{character.info.race || "Sem raça"} · {character.info.affinity || "Sem afinidade"} · EF {character.info.efficiency || "0"}</p><h2>{character.name || "Sem nome"}</h2></button><div className="card-quick-actions"><button className="icon-button subtle" onClick={onEdit} title="Editar ficha"><Edit3 size={15} /></button><button className="icon-button compact-add" onClick={onAdd} title="Levar à mesa"><Plus size={16} /></button></div></div>
      <button className="bestiary-overview" onClick={onToggle} aria-expanded={expanded} title={expanded ? "Recolher ficha" : "Expandir ficha"}>
        <span className="compact-resources"><span><b>{character.stats.pv}</b> PV</span><span><b>{character.stats.pa}</b> PA{character.stats.paExtra > 0 && <i>+{character.stats.paExtra}</i>}</span><span><b>{character.stats.pe}</b> PE{character.stats.peTemporary > 0 && <i>+{character.stats.peTemporary}</i>}</span></span>
        <span className="compact-attributes"><span><b>FÍS {character.attributes.physical}</b><i>for {character.attributes.strength} · des {character.attributes.dexterity} · vit {character.attributes.vitality}</i></span><span><b>MEN {character.attributes.mental}</b><i>int {character.attributes.intelligence} · con {character.attributes.knowledge} · soc {character.attributes.social}</i></span><span><b>MÍS {character.attributes.mystic}</b><i>fé {character.attributes.faith} · pod {character.attributes.power} · sor {character.attributes.luck}</i></span></span>
      </button>
      <div className="expanded-content"><p className="expanded-meta">{element?.name ?? "Sem elemento"} · Deslocamento {snapshot.movement} m</p>
      <dl className="sheet-facts"><div><dt>Elemento</dt><dd>{element?.name ?? "Nenhum"}</dd></div><div><dt>Deslocamento</dt><dd>{snapshot.movement} m</dd></div><div><dt>Resistências</dt><dd>{character.stats.resistances.join(", ") || "—"}</dd></div><div><dt>Fraquezas</dt><dd>{character.stats.weaknesses.join(", ") || "—"}</dd></div><div><dt>Características</dt><dd>{racials.join(", ") || "—"}</dd></div><div><dt>Ações</dt><dd>{actions.slice(0, 4).join(", ") || "—"}</dd></div></dl>
      <p className="resource-line"><Sparkles size={14} /> {resourceLine(character)}</p>
      <footer><button className="secondary-button danger-icon" onClick={onDelete} title="Excluir ficha"><Trash2 size={16} /></button><button className="secondary-button" onClick={onEdit}>Editar ficha</button><button className="primary-button" onClick={onAdd}><Plus size={16} /> Levar à mesa</button></footer></div>
    </article>
  )
}

function EncounterWorkspace({ actors, selectedId, entries, onSelect, onAdd, onDuplicate, onRemove, onUpdate }: { actors: EncounterActor[]; selectedId: string | null; entries: BestiaryEntry[]; onSelect: (id: string) => void; onAdd: (entry: BestiaryEntry) => void; onDuplicate: (actor: EncounterActor) => void; onRemove: (id: string) => void; onUpdate: (id: string, character: Character) => void }) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const selected = actors.find((actor) => actor.id === selectedId) ?? actors[0] ?? null
  return (
    <section className="workspace encounter-workspace">
      <div className="encounter-main">
        <div className="workspace-heading compact"><div><p className="eyebrow">Mesa de encontro</p><h1>Controle sem trocar de tela.</h1><p>Cada criatura é uma cópia independente da ficha do bestiário.</p></div><button className="primary-button" onClick={() => setPickerOpen((value) => !value)}><Plus size={18} /> Anexar inimigo</button></div>
        {pickerOpen && <div className="actor-picker">{entries.map((entry) => <button key={entry.id} onClick={() => { onAdd(entry); setPickerOpen(false) }}><span className="mini-rune">{entry.character.name.slice(0, 1)}</span><span><strong>{entry.character.name}</strong><small>{entry.character.info.race}</small></span><Plus size={17} /></button>)}</div>}
        {actors.length === 0 ? <div className="empty-encounter"><Swords size={42} /><h2>A mesa está vazia</h2><p>Anexe uma ficha do bestiário para criar uma cópia de combate.</p><button className="primary-button" onClick={() => setPickerOpen(true)}><Plus size={17} /> Anexar primeiro inimigo</button></div> : <div className="actor-grid">{actors.map((actor) => <ActorCard key={actor.id} actor={actor} selected={actor.id === selected?.id} onSelect={() => onSelect(actor.id)} onDuplicate={() => onDuplicate(actor)} onRemove={() => onRemove(actor.id)} />)}</div>}
      </div>
      <aside className="action-dock">{selected ? <QuickActions actor={selected} onUpdate={(character) => onUpdate(selected.id, character)} /> : <div className="dock-empty"><Bolt size={28} /><p>Selecione uma criatura para abrir testes e dano.</p></div>}</aside>
    </section>
  )
}

function ActorCard({ actor, selected, onSelect, onDuplicate, onRemove }: { actor: EncounterActor; selected: boolean; onSelect: () => void; onDuplicate: () => void; onRemove: () => void }) {
  const element = getCharacterElement(actor.character.stats.elementId)
  return <article className={`actor-card ${selected ? "selected" : ""}`} onClick={onSelect} style={{ "--element-color": element?.color ?? "#79dce0" } as React.CSSProperties}><div className="actor-head"><span className="mini-rune">{actor.copyNumber}</span><div><small>{element?.name ?? "Sem elemento"}</small><h2>{actor.character.name} #{actor.copyNumber}</h2></div><div><button className="icon-button subtle" onClick={(event) => { event.stopPropagation(); onDuplicate() }} title="Duplicar"><Copy size={16} /></button><button className="icon-button subtle" onClick={(event) => { event.stopPropagation(); onRemove() }} title="Remover"><X size={16} /></button></div></div><div className="actor-resources"><ResourceBar label="PV" value={actor.character.stats.pv} color="red" /><ResourceBar label="PA" value={actor.character.stats.pa} extra={actor.character.stats.paExtra} color="cyan" /><ResourceBar label="PE" value={actor.character.stats.pe} extra={actor.character.stats.peTemporary} color="violet" /></div><p>{actor.character.stats.effects || "Nenhum efeito ativo"}</p></article>
}

function ResourceBar({ label, value, extra = 0, color }: { label: string; value: number; extra?: number; color: string }) {
  return <div className={`resource-bar ${color}`}><span>{label}</span><strong>{value}{extra > 0 ? ` +${extra}` : ""}</strong><i style={{ width: `${Math.min(100, Math.max(4, value))}%` }} /></div>
}

function QuickActions({ actor, onUpdate }: { actor: EncounterActor; onUpdate: (character: Character) => void }) {
  const [mode, setMode] = useState<"test" | "damage">("damage")
  const [modifierOpen, setModifierOpen] = useState(false)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [modifier, setModifier] = useState("")
  const [testAttribute, setTestAttribute] = useState<SecondaryAttributeKey>("dexterity")
  const [skillName, setSkillName] = useState("Reflexo")
  const [skillModifier, setSkillModifier] = useState(0)
  const [specialDie, setSpecialDie] = useState<SpecialDieId>("none")
  const [damageExpression, setDamageExpression] = useState("2D cortante")
  const [mtEnabled, setMtEnabled] = useState(false)
  const [result, setResult] = useState<{ tone: "good" | "bad" | "neutral"; title: string; detail: string } | null>(null)

  function runTest() {
    const roll = rollSkillTest({ config: { attributeKey: testAttribute, skillName, skillModifier, masterModifier: 0, otherModifiers: 0, specialDieId: specialDie }, attributes: actor.character.attributes })
    if (!roll) return
    const total = applyQuickModifier(roll.totalTest, modifier)
    const margin = total - roll.diceSum
    const outcome: SkillRollOutcome = roll.diceRolls[0] === 1 && roll.diceRolls[1] === 1 ? "critical-success" : roll.diceRolls[0] === 10 && roll.diceRolls[1] === 10 ? "critical-failure" : margin >= 0 ? "success" : "failure"
    setResult({ tone: outcome.includes("success") ? "good" : "bad", title: `${outcomeLabel(outcome)} ${margin >= 0 ? "+" : ""}${margin}`, detail: `Teste ${total} contra ${roll.diceRolls.join(" + ")} = ${roll.diceSum}` })
  }

  function applyDamage() {
    const parsed = parseDamageExpression(damageExpression)
    if (!parsed.hasDamageValue || !parsed.damageTypeId) { setResult({ tone: "bad", title: "Dano incompleto", detail: "Use algo como 3D+2 cortante." }); return }
    const conversion = convertDamageBonusesToDice(parsed.numDice, [parsed.bonus])
    const rolled = parsed.numDice > 0 ? rollDice(conversion.numDice) : []
    const calculated = calculateDamage({ config: { numDice: parsed.numDice, damageTypeId: parsed.damageTypeId, attributeKey: parsed.attributeKey ?? "none", otherModifier: parsed.bonus, mtEnabled, mtValue: actor.character.stats.mt, otherMultiplier: "1", rdf: 0, rdm: 0 }, diceRolls: rolled, attributeValue: parsed.attributeKey ? actor.character.attributes[parsed.attributeKey] : 0 })
    const total = Math.max(0, applyQuickModifier(calculated.total, modifier))
    const stats = actor.character.stats
    const simulation = simulateDamageApplication({ damage: { amount: total, damageTypeId: parsed.damageTypeId }, mtEnabled: false, mtValue: 0, rdf: stats.armorRdf + stats.naturalRdf, rdm: stats.armorRdm + stats.naturalRdm, layers: [
      { resource: "paExtra", current: stats.paExtra, resistances: stats.resistances, weaknesses: stats.weaknesses, multiplier: "1" },
      { resource: "pa", current: stats.pa, resistances: stats.resistances, weaknesses: stats.weaknesses, multiplier: "1" },
      { resource: "pv", current: stats.pv, maximum: stats.pv, resistances: stats.resistances, weaknesses: stats.weaknesses, multiplier: "1" },
    ] })
    if (!simulation.value) { setResult({ tone: "bad", title: "Não foi possível aplicar", detail: simulation.error ?? "Revise o dano." }); return }
    const next = cloneCharacter(actor.character)
    for (const change of simulation.value.changes) next.stats[change.resource] = Math.max(0, next.stats[change.resource] + change.amount)
    onUpdate(next)
    setResult({ tone: "neutral", title: `${total} ${calculated.damageTypeName}`, detail: simulation.value.resultText })
  }

  return <div className="quick-actions"><div className="dock-title"><div><p className="eyebrow">Ações integradas</p><h2>{actor.character.name} #{actor.copyNumber}</h2></div><Bolt size={20} /></div><div className="mode-tabs"><button className={mode === "damage" ? "active" : ""} onClick={() => { setMode("damage"); setResult(null) }}><Swords size={16} /> Dano</button><button className={mode === "test" ? "active" : ""} onClick={() => { setMode("test"); setResult(null) }}><Shield size={16} /> Teste</button></div>
    {mode === "damage" ? <div className="quick-form"><label><span>Dano rápido</span><input value={damageExpression} onChange={(event) => setDamageExpression(event.target.value)} placeholder="3D+2 cortante" /></label>{advancedOpen && <div className="advanced-panel"><label className="check-row"><input type="checkbox" checked={mtEnabled} onChange={(event) => setMtEnabled(event.target.checked)} /> Aplicar MT do atacante</label><p>RDF {actor.character.stats.armorRdf + actor.character.stats.naturalRdf} · RDM {actor.character.stats.armorRdm + actor.character.stats.naturalRdm}</p><p>O dano percorre PA Extra → PA → PV e considera resistências.</p></div>}<ConfigurationButtons modifierOpen={modifierOpen} advancedOpen={advancedOpen} onModifier={() => setModifierOpen((value) => !value)} onAdvanced={() => setAdvancedOpen((value) => !value)} />{modifierOpen && <ModifierInput value={modifier} onChange={setModifier} />}<button className="execute-button damage" onClick={applyDamage}>Rolar e aplicar dano</button></div> : <div className="quick-form"><label><span>Perícia ou teste</span><input value={skillName} onChange={(event) => setSkillName(event.target.value)} /></label>{advancedOpen && <div className="advanced-panel"><label><span>Atributo</span><select value={testAttribute} onChange={(event) => setTestAttribute(event.target.value as SecondaryAttributeKey)}>{secondaryAttributes.map((attribute) => <option key={attribute.key} value={attribute.key}>{attribute.label}</option>)}</select></label><label><span>Mod. da perícia</span><input type="number" value={skillModifier} onChange={(event) => setSkillModifier(Number(event.target.value))} /></label><label><span>Dado especial</span><select value={specialDie} onChange={(event) => setSpecialDie(event.target.value as SpecialDieId)}><option value="none">Nenhum</option><option value="luck">Sorte</option><option value="inspiration">Inspiração</option><option value="legendary-inspiration">Inspiração lendária</option><option value="divine-advantage">Divino: vantagem</option><option value="divine-disadvantage">Divino: desvantagem</option></select></label></div>}<ConfigurationButtons modifierOpen={modifierOpen} advancedOpen={advancedOpen} onModifier={() => setModifierOpen((value) => !value)} onAdvanced={() => setAdvancedOpen((value) => !value)} />{modifierOpen && <ModifierInput value={modifier} onChange={setModifier} />}<button className="execute-button test" onClick={runTest}>Rolar teste</button></div>}
    {result && <div className={`roll-result ${result.tone}`}><strong>{result.title}</strong><span>{result.detail}</span></div>}<p className="modifier-hint"><b>Modificador:</b> inteiros somam; x2 multiplica; x0,5 divide por dois.</p></div>
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
    setCharacter((current) => { const next = cloneCharacter(current); updater(next); return next })
  }

  function save() {
    onSave({ ...entry, character })
  }

  function switchTab(next: "simple" | "advanced") {
    setTab(next)
  }

  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className="sheet-modal" role="dialog" aria-modal="true" aria-label="Editor de ficha"><header><div><p className="eyebrow">{entry.character.name ? "Editar criatura" : "Nova criatura"}</p><h2>{character.name || "Ficha sem nome"}</h2></div><div className="editor-tabs"><button className={tab === "simple" ? "active" : ""} onClick={() => switchTab("simple")}>Simplificada</button><button className={tab === "advanced" ? "active" : ""} onClick={() => switchTab("advanced")}>Avançada</button></div><button className="icon-button" onClick={onClose}><X size={20} /></button></header>
    {tab === "simple" ? <div className="editor-body"><section className="form-section hero-fields"><div className="editor-rune">{character.name.slice(0, 1) || "R"}</div><Field label="Nome" value={character.name} onChange={(value) => mutate((draft) => { draft.name = value })} /><Field label="Raça" value={character.info.race} onChange={(value) => mutate((draft) => { draft.info.race = value })} /><Field label="Afinidade" value={character.info.affinity} onChange={(value) => mutate((draft) => { draft.info.affinity = value })} /><Field label="Eficiência" value={character.info.efficiency} onChange={(value) => mutate((draft) => { draft.info.efficiency = value })} /></section>
      <section className="form-section"><SectionTitle title="Atributos" note="Primários e secundários" /><div className="attribute-editor">{attributeGroups.map((group) => <div key={group.id}><NumberField label={group.primary.abbr} value={character.attributes[group.primary.key]} onChange={(value) => mutate((draft) => { draft.attributes[group.primary.key] = value })} />{group.attributes.map((attribute) => <NumberField key={attribute.key} label={attribute.abbr} value={character.attributes[attribute.key]} onChange={(value) => mutate((draft) => { draft.attributes[attribute.key] = value })} />)}</div>)}</div></section>
      <section className="form-section"><SectionTitle title="Recursos e defesa" note="Valores atuais da criatura" /><div className="field-grid six"><NumberField label="PV" value={character.stats.pv} onChange={(value) => mutate((draft) => { draft.stats.pv = value })} /><NumberField label="PA" value={character.stats.pa} onChange={(value) => mutate((draft) => { draft.stats.pa = value })} /><NumberField label="PA extra" value={character.stats.paExtra} onChange={(value) => mutate((draft) => { draft.stats.paExtra = value })} /><NumberField label="PE" value={character.stats.pe} onChange={(value) => mutate((draft) => { draft.stats.pe = value })} /><NumberField label="PE temporário" value={character.stats.peTemporary} onChange={(value) => mutate((draft) => { draft.stats.peTemporary = value })} /><div className="calculated-field"><span>Deslocamento</span><strong>{snapshot.movement} m</strong></div></div><div className="field-grid"><label className="field"><span>Elemento principal</span><select value={character.stats.elementId} onChange={(event) => mutate((draft) => { draft.stats.elementId = event.target.value })}><option value="none">Nenhum</option>{characterElements.map((element) => <option key={element.id} value={element.id}>{element.name}</option>)}</select></label><Field label="Resistências" value={character.stats.resistances.join(", ")} onChange={(value) => mutate((draft) => { draft.stats.resistances = listFromText(value) })} /><Field label="Fraquezas" value={character.stats.weaknesses.join(", ")} onChange={(value) => mutate((draft) => { draft.stats.weaknesses = listFromText(value) })} /></div></section>
      <section className="form-section"><SectionTitle title="Perícias, características e ações" note="Os itens abaixo são os mesmos registros da ficha completa" /><div className="simple-linked-grid"><SimpleSkills character={character} mutate={mutate} /><SimpleRacialAbilities character={character} mutate={mutate} /></div><SimpleActions character={character} mutate={mutate} /></section>
      <section className="form-section"><SectionTitle title="Melhorias" note={`${availableMastery} pontos disponíveis na tabela selecionada`} /><div className="mastery-toolbar"><select value={tableId} onChange={(event) => setTableId(event.target.value)}>{tables.map((table) => <option key={table.id} value={table.id}>{table.name}</option>)}</select><button className="secondary-button" onClick={() => { const table = { id: id("table"), name: `Tabela ${tables.length + 1}`, multiplier: 1 }; onTablesChange([...tables, table]); setTableId(table.id) }}><Plus size={15} /> Nova tabela</button>{selectedTable && !["default", "double"].includes(selectedTable.id) && <><input value={selectedTable.name} onChange={(event) => onTablesChange(tables.map((table) => table.id === selectedTable.id ? { ...table, name: event.target.value } : table))} /><label className="mini-field">Multiplicador <input type="number" min="0.1" step="0.1" value={selectedTable.multiplier} onChange={(event) => onTablesChange(tables.map((table) => table.id === selectedTable.id ? { ...table, multiplier: Number(event.target.value) || 1 } : table))} /></label><button className="secondary-button danger-icon" title="Remover tabela customizada" onClick={() => { onTablesChange(tables.filter((table) => table.id !== selectedTable.id)); setTableId("default") }}><Trash2 size={15} /> Remover</button></>}</div><div className="mastery-grid">{Object.entries(character.stats.masteryImprovements).map(([key, value]) => <NumberField key={key} label={{ aura: "Aura", life: "Vida", energy: "Energia", determination: "Determinação", casualty: "Casualidade" }[key] ?? key} value={value} onChange={(next) => mutate((draft) => { draft.stats.masteryImprovements[key as keyof typeof draft.stats.masteryImprovements] = next })} />)}</div></section>
      <section className="form-section"><SectionTitle title="Recursos carregados" note={`Essências geradas automaticamente: ${essenceYield(character)}`} /><SimpleInventory character={character} mutate={mutate} /><div className="field-grid resource-total"><Field label="Essências totais" value={character.info.essences} onChange={(value) => mutate((draft) => { draft.info.essences = value })} /></div></section></div> : <AdvancedSheetEditor character={character} onChange={setCharacter} />}
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
    {character.inventory.map((item) => <div className="linked-item inventory" key={item.id}><select aria-label={`Uso de ${item.name}`} value={item.usage} onChange={(event) => mutate((draft) => assignById(draft.inventory, item.id, { usage: event.target.value as typeof item.usage }))}><option value="equipped">Equipado</option><option value="stored">Guardado</option><option value="absent">Ausente</option></select><input aria-label={`Nome do item ${item.name}`} value={item.name} onChange={(event) => mutate((draft) => assignById(draft.inventory, item.id, { name: event.target.value }))} /><input className="linked-number" aria-label={`Quantidade de ${item.name}`} type="number" min="1" value={item.quantity} onChange={(event) => mutate((draft) => assignById(draft.inventory, item.id, { quantity: Math.max(1, Number(event.target.value)) }))} /><button className="linked-remove" title="Remover item" onClick={() => mutate((draft) => { draft.inventory = draft.inventory.filter((candidate) => candidate.id !== item.id) })}><X size={13} /></button></div>)}
  </LinkedPanel>
}

function LinkedPanel({ title, count, onAdd, children }: { title: string; count: number; onAdd: () => void; children: React.ReactNode }) {
  return <div className="linked-panel"><header><div><strong>{title}</strong><span>{count} vinculados</span></div><button onClick={onAdd}><Plus size={13} /> Adicionar</button></header><div className="linked-list">{count > 0 ? children : <p>Nenhum item cadastrado.</p>}</div></div>
}

function assignById<T extends { id: string }>(items: T[], itemId: string, updates: Partial<T>) { const item = items.find((candidate) => candidate.id === itemId); if (item) Object.assign(item, updates) }
function createQuickItem(name: string, usage: "equipped" | "stored", type: "weapon" | "other"): Character["inventory"][number] { return { id: id("item"), usage, name, type, affinity: 0, bondPoints: 0, baseWeight: 0, quantity: 1, applyScaleWeight: false, damage: "", rdf: 0, rdm: 0, prCurrent: null, prMaximum: null, enchantmentSpellId: "", bondId: "", bondAbilityId: "", skillId: "", description: "" } }

function SectionTitle({ title, note }: { title: string; note: string }) { return <div className="section-title"><h3>{title}</h3><span>{note}</span></div> }
function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="field"><span>{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} /></label> }
function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) { return <label className="field number-field"><span>{label}</span><input type="number" value={value} onChange={(event) => onChange(Number(event.target.value))} /></label> }
