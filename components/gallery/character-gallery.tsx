"use client"

import { useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Braces, Download, Eye, FileArchive, Plus, Trash2, Upload, UserCheck, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCharacter } from "@/components/character/character-provider"
import { useCharacterPanel } from "@/components/character/character-panel"
import { CharacterReadonlySheet } from "@/components/character/character-readonly-sheet"
import { calculateCharacterStatSnapshot } from "@/lib/characterStatCalculations"
import { exportCharacterJSON } from "@/lib/exportCharacter"
import { parseCharacterFile } from "@/lib/characterStorage"
import { exportGalleryZip } from "@/lib/galleryExport"
import { formatSigned } from "@/lib/bondCalculations"
import { formatWeight } from "@/lib/inventoryCalculations"
import type { CharacterGalleryEntry } from "@/types/character"

export function CharacterGallery() {
  const {
    character,
    galleryEntries,
    activeGalleryId,
    saveCurrentToGallery,
    createGalleryCharacter,
    importGalleryCharacter,
    useGalleryCharacter,
    deleteGalleryCharacter,
    isReady,
  } = useCharacter()
  const { open } = useCharacterPanel()
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const previewEntry = useMemo(() => galleryEntries.find((entry) => entry.id === previewId) ?? null, [galleryEntries, previewId])
  const isFull = galleryEntries.length >= 10
  const currentIsSaved = Boolean(activeGalleryId && galleryEntries.some((entry) => entry.id === activeGalleryId))

  function createCharacter() {
    if (!createGalleryCharacter()) {
      setMessage("A galeria já atingiu o limite de 10 fichas.")
      return
    }
    setMessage("Nova ficha criada e marcada como ativa.")
    open()
  }

  function saveCurrent() {
    if (!saveCurrentToGallery()) {
      setMessage("A galeria já atingiu o limite de 10 fichas.")
      return
    }
    setMessage("Ficha atual salva na galeria.")
  }

  async function importCharacter(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const imported = parseCharacterFile(await file.text())
      if (!importGalleryCharacter(imported)) {
        setMessage("A galeria já atingiu o limite de 10 fichas.")
        return
      }
      setMessage(`“${imported.name || "Personagem sem nome"}” foi importado.`)
    } catch {
      setMessage("Não foi possível importar: arquivo de ficha inválido.")
    } finally {
      event.target.value = ""
    }
  }

  function removeEntry(entry: CharacterGalleryEntry) {
    if (!window.confirm(`Excluir “${entry.character.name || "Personagem sem nome"}” da galeria?`)) return
    deleteGalleryCharacter(entry.id)
    if (previewId === entry.id) setPreviewId(null)
  }

  if (!isReady) return <div className="h-72 animate-pulse rounded-[24px] border border-border bg-card" />

  return <div>
    <section className="rounded-[24px] border border-border bg-card p-4 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div><p className="text-sm font-semibold text-muted-foreground">{galleryEntries.length} de 10 fichas salvas</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">A ficha ativa é sincronizada automaticamente sempre que você a altera.</p></div>
        <div className="grid gap-2 sm:grid-cols-2 lg:flex lg:flex-wrap lg:justify-end">
          {!currentIsSaved && <Button type="button" variant="secondary" onClick={saveCurrent} disabled={isFull}><UserCheck /> Salvar ficha atual</Button>}
          <Button type="button" variant="outline" onClick={() => inputRef.current?.click()} disabled={isFull}><Upload /> Importar ficha</Button>
          <Button type="button" onClick={createCharacter} disabled={isFull}><Plus /> Criar nova ficha</Button>
          <input ref={inputRef} type="file" accept="application/json,.json" onChange={importCharacter} className="hidden" />
        </div>
      </div>
      {message && <p role="status" className="mt-3 rounded-xl border border-border bg-muted/40 p-3 text-sm text-foreground">{message}</p>}
      {galleryEntries.length > 0 && <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end"><Button type="button" variant="outline" onClick={() => exportGalleryZip(galleryEntries, "json")}><FileArchive /> Exportar ZIP (JSON)</Button><Button type="button" variant="outline" onClick={() => exportGalleryZip(galleryEntries, "md")}><Download /> Exportar ZIP (MD)</Button></div>}
    </section>

    <div className="mt-5 grid gap-4 lg:grid-cols-2">
      {galleryEntries.length === 0 && <div className="rounded-[24px] border border-dashed border-border bg-card/70 p-10 text-center lg:col-span-2"><h2 className="font-bold text-foreground">Sua galeria está vazia</h2><p className="mt-2 text-sm text-muted-foreground">Salve a ficha atual, importe um arquivo JSON ou crie um novo personagem.</p></div>}
      {galleryEntries.map((entry) => <CharacterCard key={entry.id} entry={entry} active={entry.id === activeGalleryId} onPreview={() => setPreviewId(entry.id)} onUse={() => { useGalleryCharacter(entry.id); setMessage(`“${entry.character.name || "Personagem sem nome"}” agora é a ficha ativa.`) }} onExport={() => exportCharacterJSON(entry.character)} onDelete={() => removeEntry(entry)} />)}
    </div>

    {previewEntry && typeof document !== "undefined" && createPortal(<div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/65 p-3 backdrop-blur-[2px]" onMouseDown={(event) => { if (event.currentTarget === event.target) setPreviewId(null) }}><div role="dialog" aria-modal="true" aria-labelledby="gallery-preview-title" className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-6xl flex-col overflow-hidden rounded-[26px] border border-border bg-card shadow-2xl"><div className="flex items-start justify-between gap-3 border-b border-border p-4 sm:p-6"><div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ficha em modo leitura</p><h2 id="gallery-preview-title" className="mt-1 text-xl font-bold text-foreground">{previewEntry.character.name || "Personagem sem nome"}</h2></div><button type="button" onClick={() => setPreviewId(null)} aria-label="Fechar visualização da ficha" className="inline-flex size-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted"><X className="size-5" /></button></div><div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6"><CharacterReadonlySheet character={previewEntry.character} /></div><div className="flex flex-col gap-2 border-t border-border p-4 sm:flex-row sm:items-center sm:justify-end">{previewEntry.id === activeGalleryId ? <span className="rounded-xl bg-primary/10 px-4 py-2 text-sm font-bold text-primary">Ativa</span> : <Button type="button" onClick={() => { useGalleryCharacter(previewEntry.id); setMessage(`“${previewEntry.character.name || "Personagem sem nome"}” agora é a ficha ativa.`) }}><UserCheck /> Usar Ficha</Button>}</div></div></div>, document.body)}
  </div>
}

function CharacterCard({ entry, active, onPreview, onUse, onExport, onDelete }: { entry: CharacterGalleryEntry; active: boolean; onPreview: () => void; onUse: () => void; onExport: () => void; onDelete: () => void }) {
  const { character } = entry
  const snapshot = calculateCharacterStatSnapshot(character.attributes, character.info, character.stats, character.skills, character.abilities)
  const stats = [
    { label: "PV", value: `${character.stats.pv} / ${snapshot.pvMax}`, color: "border-red-400/25 bg-red-500/10 text-red-300" },
    { label: "PA", value: `${character.stats.pa} / ${snapshot.paMax}`, color: "border-blue-400/25 bg-blue-500/10 text-blue-300" },
    { label: "PE", value: `${character.stats.pe} / ${snapshot.peMax}`, color: "border-cyan-300/25 bg-cyan-400/10 text-cyan-200" },
    ...(character.stats.paExtra > 0 ? [{ label: "PA Extra", value: `${character.stats.paExtra} / ${snapshot.paExtraMax}`, color: "border-indigo-300/25 bg-indigo-400/10 text-indigo-200" }] : []),
    { label: "PE Temp.", value: `${character.stats.peTemporary} / ${snapshot.peTemporaryMax}`, color: "border-sky-300/25 bg-sky-300/10 text-sky-200" },
    { label: "Desloc.", value: `${snapshot.movement} m`, color: "border-emerald-300/20 bg-emerald-400/8 text-emerald-200" },
    { label: "Impressão", value: formatSigned(snapshot.firstImpressions), color: "border-amber-300/20 bg-amber-400/8 text-amber-200" },
    { label: "Carga", value: `${formatWeight(character.stats.currentLoad)} / ${formatWeight(snapshot.loadCapacity)} kg`, color: "border-border bg-muted/25 text-foreground" },
  ]
  return <article className={`rounded-[20px] border bg-card p-3 shadow-sm sm:p-4 ${active ? "border-primary/55 ring-2 ring-primary/10" : "border-border"}`}>
    <div className="min-w-0"><div className="flex flex-wrap items-center gap-x-2 gap-y-1">{active && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-primary">Ativa</span>}<span className="text-[0.68rem] text-muted-foreground">Atualizada {new Date(entry.updatedAt).toLocaleDateString("pt-BR")}</span></div><div className="mt-1.5 flex min-w-0 items-baseline gap-2"><h2 className="truncate text-lg font-bold text-foreground">{character.name || "Personagem sem nome"}</h2><p className="truncate text-xs text-muted-foreground">{character.info.race || "Raça não informada"} · {character.info.profession || "Ofício não informado"}</p></div></div>
    <div className="mt-3 grid grid-cols-2 gap-1.5 min-[440px]:grid-cols-4">{stats.map(({ label, value, color }) => <div key={label} className={`min-w-0 rounded-lg border px-2 py-1.5 ${color}`}><span className="block truncate text-[0.62rem] font-medium opacity-80">{label}</span><strong className="mt-0.5 block truncate text-sm text-current">{value}</strong></div>)}</div>
    <div className="mt-3 grid grid-cols-2 gap-1.5 min-[440px]:grid-cols-4"><Button type="button" size="sm" variant="outline" onClick={onPreview}><Eye /> Visualizar</Button>{active ? <span className="inline-flex h-9 items-center justify-center rounded-xl bg-primary/10 px-3 text-sm font-bold text-primary">Ativa</span> : <Button type="button" size="sm" onClick={onUse}><UserCheck /> Usar Ficha</Button>}<Button type="button" size="sm" variant="secondary" onClick={onExport}><Braces /> Exportar</Button><Button type="button" size="sm" variant="destructive" onClick={onDelete}><Trash2 /> Deletar</Button></div>
  </article>
}
