"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import { createPortal } from "react-dom"
import { Braces, CheckSquare, Download, Eye, FileArchive, Plus, Search, Square, Trash2, Upload, UserCheck, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCharacter } from "@/components/character/character-provider"
import { useCharacterPanel } from "@/components/character/character-panel"
import { CharacterReadonlySheet } from "@/components/character/character-readonly-sheet"
import { calculateCharacterStatSnapshot } from "@runas/core/lib/characterStatCalculations"
import { exportCharacterJSON } from "@/lib/exportCharacter"
import { parseCharacterFile } from "@/lib/characterStorage"
import { exportGalleryZip } from "@/lib/galleryExport"
import { parseGalleryZip, type GalleryZipCharacter } from "@/lib/galleryImport"
import { formatSigned } from "@runas/core/lib/bondCalculations"
import { formatWeight } from "@runas/core/lib/inventoryCalculations"
import type { CharacterGalleryEntry } from "@runas/core/types/character"
import { GALLERY_MAX_CHARACTERS, GALLERY_MAX_PAGES, GALLERY_PAGE_SIZE } from "@/lib/galleryLimits"

export function CharacterGallery() {
  const {
    galleryEntries,
    activeGalleryId,
    saveCurrentToGallery,
    createGalleryCharacter,
    importGalleryCharacter,
    importGalleryCharacters,
    useGalleryCharacter: activateGalleryCharacter,
    deleteGalleryCharacter,
    isReady,
  } = useCharacter()
  const { open } = useCharacterPanel()
  const inputRef = useRef<HTMLInputElement>(null)
  const zipInputRef = useRef<HTMLInputElement>(null)
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [zipCharacters, setZipCharacters] = useState<GalleryZipCharacter[]>([])
  const [selectedZipIds, setSelectedZipIds] = useState<Set<string>>(new Set())
  const [zipIgnoredFiles, setZipIgnoredFiles] = useState(0)
  const [readingZip, setReadingZip] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const previewEntry = useMemo(() => galleryEntries.find((entry) => entry.id === previewId) ?? null, [galleryEntries, previewId])
  const filteredEntries = useMemo(() => {
    const query = searchQuery.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR")
    if (!query) return galleryEntries
    return galleryEntries.filter((entry) => entry.character.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").includes(query))
  }, [galleryEntries, searchQuery])
  const isFull = galleryEntries.length >= GALLERY_MAX_CHARACTERS
  const pageCount = Math.max(1, Math.min(GALLERY_MAX_PAGES, Math.ceil(filteredEntries.length / GALLERY_PAGE_SIZE)))
  const visibleEntries = filteredEntries.slice((currentPage - 1) * GALLERY_PAGE_SIZE, currentPage * GALLERY_PAGE_SIZE)
  const currentIsSaved = Boolean(activeGalleryId && galleryEntries.some((entry) => entry.id === activeGalleryId))

  useEffect(() => { if (currentPage > pageCount) setCurrentPage(pageCount) }, [currentPage, pageCount])
  useEffect(() => { setCurrentPage(1) }, [searchQuery])

  function createCharacter() {
    if (!createGalleryCharacter()) {
      setMessage("A galeria já atingiu o limite de 100 fichas.")
      return
    }
    setMessage("Nova ficha criada e marcada como ativa.")
    open()
  }

  function saveCurrent() {
    if (!saveCurrentToGallery()) {
      setMessage("A galeria já atingiu o limite de 100 fichas.")
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
        setMessage("A galeria já atingiu o limite de 100 fichas.")
        return
      }
      setMessage(`“${imported.name || "Personagem sem nome"}” foi importado.`)
    } catch {
      setMessage("Não foi possível importar: arquivo de ficha inválido.")
    } finally {
      event.target.value = ""
    }
  }

  async function inspectZip(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setReadingZip(true)
    setMessage(null)
    try {
      const result = await parseGalleryZip(file)
      const availableSlots = Math.max(0, GALLERY_MAX_CHARACTERS - galleryEntries.length)
      setZipCharacters(result.characters)
      setSelectedZipIds(new Set(result.characters.slice(0, availableSlots).map((item) => item.id)))
      setZipIgnoredFiles(result.ignoredFiles)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível ler o arquivo ZIP.")
    } finally {
      setReadingZip(false)
      event.target.value = ""
    }
  }

  function closeZipImport() {
    setZipCharacters([])
    setSelectedZipIds(new Set())
    setZipIgnoredFiles(0)
  }

  function toggleZipCharacter(id: string) {
    setSelectedZipIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else if (next.size < GALLERY_MAX_CHARACTERS - galleryEntries.length) next.add(id)
      return next
    })
  }

  function toggleAllZipCharacters() {
    const availableSlots = Math.max(0, GALLERY_MAX_CHARACTERS - galleryEntries.length)
    const selectableIds = zipCharacters.slice(0, availableSlots).map((item) => item.id)
    setSelectedZipIds(selectedZipIds.size === selectableIds.length ? new Set() : new Set(selectableIds))
  }

  function confirmZipImport() {
    const selected = zipCharacters.filter((item) => selectedZipIds.has(item.id)).map((item) => item.character)
    const importedCount = importGalleryCharacters(selected)
    closeZipImport()
    setMessage(`${importedCount} ${importedCount === 1 ? "ficha importada" : "fichas importadas"} do ZIP.`)
  }

  function removeEntry(entry: CharacterGalleryEntry) {
    if (!window.confirm(`Excluir “${entry.character.name || "Personagem sem nome"}” da galeria?`)) return
    deleteGalleryCharacter(entry.id)
    if (previewId === entry.id) setPreviewId(null)
  }

  if (!isReady) return <div className="h-72 animate-pulse rounded-[24px] border border-border bg-card" />

  return <div className="min-w-0 max-w-full overflow-x-clip">
    <section className="min-w-0 max-w-full rounded-[24px] border border-border bg-card p-4 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div><p className="text-sm font-semibold text-muted-foreground">{galleryEntries.length} de {GALLERY_MAX_CHARACTERS} fichas salvas</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">20 fichas por página, em até 5 páginas. A ficha ativa é sincronizada automaticamente.</p></div>
        <div className="grid gap-2 sm:grid-cols-2 lg:flex lg:flex-wrap lg:justify-end">
          {!currentIsSaved && <Button type="button" variant="secondary" onClick={saveCurrent} disabled={isFull}><UserCheck /> Salvar ficha atual</Button>}
          <Button type="button" variant="outline" onClick={() => inputRef.current?.click()} disabled={isFull}><Upload /> Importar ficha</Button>
          <Button type="button" variant="outline" onClick={() => zipInputRef.current?.click()} disabled={isFull || readingZip}><FileArchive /> {readingZip ? "Lendo ZIP…" : "Importar ZIP (JSON)"}</Button>
          <Button type="button" onClick={createCharacter} disabled={isFull}><Plus /> Criar nova ficha</Button>
          <input ref={inputRef} type="file" accept="application/json,.json" aria-label="Selecionar ficha JSON" onChange={importCharacter} className="hidden" />
          <input ref={zipInputRef} type="file" accept="application/zip,.zip" aria-label="Selecionar galeria ZIP" onChange={inspectZip} className="hidden" />
        </div>
      </div>
      {message && <p role="status" className="mt-3 rounded-xl border border-border bg-muted/40 p-3 text-sm text-foreground">{message}</p>}
      {galleryEntries.length > 0 && <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end"><Button type="button" variant="outline" onClick={() => exportGalleryZip(galleryEntries, "json")}><FileArchive /> Exportar ZIP (JSON)</Button><Button type="button" variant="outline" onClick={() => exportGalleryZip(galleryEntries, "md")}><Download /> Exportar ZIP (MD)</Button></div>}
    </section>

    <label className="relative mt-5 block"><span className="sr-only">Buscar personagem pelo nome</span><Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Buscar personagem pelo nome" className="h-12 w-full rounded-2xl border border-input bg-card pl-11 pr-4 text-sm shadow-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/25" /></label>
    {searchQuery && <p className="mt-2 text-xs font-medium text-muted-foreground">{filteredEntries.length} {filteredEntries.length === 1 ? "personagem encontrado" : "personagens encontrados"}</p>}

    <div className="mt-5 grid min-w-0 max-w-full gap-4 lg:grid-cols-2">
      {galleryEntries.length === 0 && <div className="rounded-[24px] border border-dashed border-border bg-card/70 p-10 text-center lg:col-span-2"><h2 className="font-bold text-foreground">Sua galeria está vazia</h2><p className="mt-2 text-sm text-muted-foreground">Salve a ficha atual, importe um arquivo JSON ou crie um novo personagem.</p></div>}
      {galleryEntries.length > 0 && filteredEntries.length === 0 && <div className="rounded-[24px] border border-dashed border-border bg-card/70 p-10 text-center lg:col-span-2"><h2 className="font-bold text-foreground">Nenhum personagem encontrado</h2><p className="mt-2 text-sm text-muted-foreground">Tente outro nome ou limpe a busca.</p></div>}
      {visibleEntries.map((entry) => <CharacterCard key={entry.id} entry={entry} active={entry.id === activeGalleryId} onPreview={() => setPreviewId(entry.id)} onUse={() => { activateGalleryCharacter(entry.id); setMessage(`“${entry.character.name || "Personagem sem nome"}” agora é a ficha ativa.`) }} onExport={() => exportCharacterJSON(entry.character)} onDelete={() => removeEntry(entry)} />)}
    </div>

    {filteredEntries.length > GALLERY_PAGE_SIZE && <nav aria-label="Páginas da galeria" className="mt-5 flex flex-wrap items-center justify-center gap-2">{Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => <Button key={page} type="button" size="sm" variant={page === currentPage ? "default" : "outline"} aria-current={page === currentPage ? "page" : undefined} onClick={() => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: "smooth" }) }}>{page}</Button>)}</nav>}

    {previewEntry && typeof document !== "undefined" && createPortal(<div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/65 p-3 backdrop-blur-[2px]" onMouseDown={(event) => { if (event.currentTarget === event.target) setPreviewId(null) }}><div role="dialog" aria-modal="true" aria-labelledby="gallery-preview-title" className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-6xl flex-col overflow-hidden rounded-[26px] border border-border bg-card shadow-2xl"><div className="flex items-start justify-between gap-3 border-b border-border p-4 sm:p-6"><div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ficha em modo leitura</p><h2 id="gallery-preview-title" className="mt-1 text-xl font-bold text-foreground">{previewEntry.character.name || "Personagem sem nome"}</h2></div><button type="button" onClick={() => setPreviewId(null)} aria-label="Fechar visualização da ficha" className="inline-flex size-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted"><X className="size-5" /></button></div><div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6"><CharacterReadonlySheet character={previewEntry.character} /></div><div className="flex flex-col gap-2 border-t border-border p-4 sm:flex-row sm:items-center sm:justify-end">{previewEntry.id === activeGalleryId ? <span className="rounded-xl bg-primary/10 px-4 py-2 text-sm font-bold text-primary">Ativa</span> : <Button type="button" onClick={() => { activateGalleryCharacter(previewEntry.id); setMessage(`“${previewEntry.character.name || "Personagem sem nome"}” agora é a ficha ativa.`) }}><UserCheck /> Usar Ficha</Button>}</div></div></div>, document.body)}

    {zipCharacters.length > 0 && typeof document !== "undefined" && createPortal(
      <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/65 p-3 backdrop-blur-[2px]" onMouseDown={(event) => { if (event.currentTarget === event.target) closeZipImport() }}>
        <div role="dialog" aria-modal="true" aria-labelledby="zip-import-title" className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-[26px] border border-border bg-card shadow-2xl">
          <div className="flex items-start justify-between gap-3 border-b border-border p-4 sm:p-6">
            <div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Importar ZIP (JSON)</p><h2 id="zip-import-title" className="mt-1 text-xl font-bold text-foreground">Escolha as fichas</h2><p className="mt-1 text-xs text-muted-foreground">{GALLERY_MAX_CHARACTERS - galleryEntries.length} espaços disponíveis na galeria.</p></div>
            <button type="button" onClick={closeZipImport} aria-label="Fechar importação do ZIP" className="inline-flex size-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted"><X className="size-5" /></button>
          </div>
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6">
            <span className="text-sm font-semibold text-foreground">{selectedZipIds.size} de {zipCharacters.length} selecionadas</span>
            <Button type="button" size="sm" variant="outline" onClick={toggleAllZipCharacters}>{selectedZipIds.size === Math.min(zipCharacters.length, GALLERY_MAX_CHARACTERS - galleryEntries.length) ? <Square /> : <CheckSquare />} {selectedZipIds.size === Math.min(zipCharacters.length, GALLERY_MAX_CHARACTERS - galleryEntries.length) ? "Desmarcar todas" : "Marcar todas"}</Button>
          </div>
          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4 sm:p-6">
            {zipCharacters.map((item) => {
              const selected = selectedZipIds.has(item.id)
              const selectionLimitReached = !selected && selectedZipIds.size >= GALLERY_MAX_CHARACTERS - galleryEntries.length
              return <label key={item.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors ${selected ? "border-primary/45 bg-primary/8" : "border-border bg-muted/20"} ${selectionLimitReached ? "cursor-not-allowed opacity-55" : "hover:bg-muted/45"}`}>
                <input type="checkbox" checked={selected} disabled={selectionLimitReached} onChange={() => toggleZipCharacter(item.id)} className="size-4 accent-primary" />
                <span className="min-w-0"><strong className="block truncate text-sm text-foreground">{item.character.name || "Personagem sem nome"}</strong><span className="block truncate text-xs text-muted-foreground">{item.filename}</span></span>
              </label>
            })}
            {zipIgnoredFiles > 0 && <p className="rounded-xl border border-amber-400/25 bg-amber-400/10 p-3 text-xs text-amber-200">{zipIgnoredFiles} {zipIgnoredFiles === 1 ? "arquivo JSON inválido foi ignorado" : "arquivos JSON inválidos foram ignorados"}.</p>}
          </div>
          <div className="flex flex-col-reverse gap-2 border-t border-border p-4 sm:flex-row sm:justify-end sm:p-6"><Button type="button" variant="outline" onClick={closeZipImport}>Cancelar</Button><Button type="button" onClick={confirmZipImport} disabled={selectedZipIds.size === 0}><Upload /> Importar {selectedZipIds.size || ""} {selectedZipIds.size === 1 ? "ficha" : "fichas"}</Button></div>
        </div>
      </div>,
      document.body,
    )}
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
  return <article className={`w-full min-w-0 max-w-full overflow-hidden rounded-[20px] border bg-card p-3 shadow-sm sm:p-4 ${active ? "border-primary/55 ring-2 ring-primary/10" : "border-border"}`}>
    <div className={character.portraitDataUrl ? "grid grid-cols-[4.75rem_minmax(0,1fr)] items-start gap-3" : "min-w-0"}>
      {character.portraitDataUrl && <div className="relative aspect-[2/3] w-[4.75rem] overflow-hidden rounded-xl border border-border bg-muted shadow-sm"><Image src={character.portraitDataUrl} alt={`Retrato de ${character.name || "personagem"}`} fill sizes="76px" unoptimized className="object-cover" /></div>}
      <div className="min-w-0"><div className="flex flex-wrap items-center gap-x-2 gap-y-1">{active && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-primary">Ativa</span>}<span className="text-[0.68rem] text-muted-foreground">Atualizada {new Date(entry.updatedAt).toLocaleDateString("pt-BR")}</span></div><div className="mt-1.5 min-w-0"><h2 className="min-w-0 truncate text-lg font-bold text-foreground">{character.name || "Personagem sem nome"}</h2><p className="mt-0.5 min-w-0 truncate text-xs text-muted-foreground">{character.info.race || "Raça não informada"} · {character.info.profession || "Ofício não informado"}</p></div><div className="mt-3 grid grid-cols-2 gap-1.5 min-[440px]:grid-cols-4">{stats.map(({ label, value, color }) => <div key={label} className={`min-w-0 rounded-lg border px-2 py-1.5 ${color}`}><span className="block truncate text-[0.62rem] font-medium opacity-80">{label}</span><strong className="mt-0.5 block truncate text-sm text-current">{value}</strong></div>)}</div></div>
    </div>
    <div className="mt-3 grid min-w-0 grid-cols-2 gap-1.5 min-[440px]:grid-cols-4"><Button type="button" size="sm" variant="outline" onClick={onPreview} className="w-full min-w-0 px-1.5"><Eye /> Visualizar</Button>{active ? <span className="inline-flex h-7 min-w-0 items-center justify-center rounded-xl bg-primary/10 px-2 text-[0.8rem] font-bold text-primary">Ativa</span> : <Button type="button" size="sm" onClick={onUse} className="w-full min-w-0 px-1.5"><UserCheck /> Usar Ficha</Button>}<Button type="button" size="sm" variant="secondary" onClick={onExport} className="w-full min-w-0 px-1.5"><Braces /> Exportar</Button><Button type="button" size="sm" variant="destructive" onClick={onDelete} className="w-full min-w-0 px-1.5"><Trash2 /> Deletar</Button></div>
  </article>
}
