"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { Check, Download, Plus, Trash2, Upload, UserRound } from "lucide-react"
import type { RulesetCharacterEnvelope } from "@runas/ruleset-contracts"
import { parseCronosCharacterFile } from "@runas/cronos-core/lib/characterStorage"
import type { CronosCharacter } from "@runas/cronos-core/types/character"
import { CRONOS_CHARACTER_VERSION } from "@runas/cronos-core/types/character"
import { Button } from "@/components/ui/button"
import { useCharacterPanel } from "@/components/character/character-panel"
import { useCronosCharacter } from "./cronos-character-provider"

export function CronosCharacterGallery() {
  const { galleryEntries, activeGalleryId, createGalleryCharacter, importGalleryCharacter, useGalleryCharacter: activateGalleryCharacter, deleteGalleryCharacter, isReady } = useCronosCharacter()
  const { open } = useCharacterPanel()
  const inputRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState("")

  async function importFiles(files: FileList | null) {
    if (!files) return
    let accepted = 0
    for (const file of Array.from(files)) {
      try {
        const parsed = JSON.parse(await file.text()) as RulesetCharacterEnvelope<CronosCharacter> | CronosCharacter
        if ("rulesetId" in parsed && parsed.rulesetId !== "cronos") continue
        if (importGalleryCharacter(parseCronosCharacterFile(JSON.stringify("character" in parsed ? parsed.character : parsed)))) accepted += 1
      } catch {
        // Arquivos inválidos são ignorados e contabilizados na mensagem final.
      }
    }
    setMessage(`${accepted} ficha${accepted === 1 ? "" : "s"} de Cronos importada${accepted === 1 ? "" : "s"}.`)
    if (inputRef.current) inputRef.current.value = ""
  }

  function exportEntry(character: CronosCharacter) {
    const envelope: RulesetCharacterEnvelope<CronosCharacter> = { rulesetId: "cronos", schemaVersion: CRONOS_CHARACTER_VERSION, character }
    const blob = new Blob([JSON.stringify(envelope, null, 2)], { type: "application/json" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `${character.name || "personagem-cronos"}.json`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  if (!isReady) return <div className="rounded-[24px] border border-border bg-card p-6 text-sm text-muted-foreground">Carregando galeria de Cronos…</div>

  return <section><div className="flex flex-col gap-3 rounded-[22px] border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"><div><strong className="text-foreground">{galleryEntries.length}/100 fichas de Cronos</strong><p className="text-xs text-muted-foreground">Persistência independente do Livro Azul.</p></div><div className="flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={() => inputRef.current?.click()}><Upload /> Importar JSON</Button><Button type="button" onClick={() => { if (!createGalleryCharacter()) setMessage("A galeria já atingiu o limite de 100 fichas.") }}><Plus /> Nova ficha</Button><input ref={inputRef} type="file" multiple accept="application/json,.json" className="sr-only" onChange={(event) => void importFiles(event.target.files)} /></div></div>{message && <p className="mt-3 rounded-xl border border-border bg-muted/35 px-3 py-2 text-sm text-muted-foreground">{message}</p>}<div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{galleryEntries.map((entry) => { const active = entry.id === activeGalleryId; return <article key={entry.id} className={`rounded-[22px] border bg-card p-4 shadow-sm ${active ? "border-primary ring-2 ring-primary/15" : "border-border"}`}><div className="flex items-start justify-between gap-3">{entry.character.portraitDataUrl ? <div className="relative aspect-[2/3] w-20 overflow-hidden rounded-2xl border border-border bg-muted shadow-sm"><Image src={entry.character.portraitDataUrl} alt={`Retrato de ${entry.character.name || "personagem"}`} fill sizes="80px" unoptimized className="object-cover" /></div> : <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary"><UserRound className="size-6" /></span>}{active && <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-bold text-primary"><Check className="size-3" /> Em uso</span>}</div><h2 className="mt-4 truncate text-lg font-bold text-card-foreground">{entry.character.name || "Personagem sem nome"}</h2><p className="mt-1 text-sm text-muted-foreground">{entry.character.info.race} · Sincronia {entry.character.info.synchronization}</p><div className="mt-4 flex flex-wrap gap-2"><Button type="button" size="sm" variant={active ? "secondary" : "default"} onClick={() => { activateGalleryCharacter(entry.id); open() }}>{active ? "Abrir ficha" : "Usar ficha"}</Button><Button type="button" size="icon-sm" variant="outline" onClick={() => exportEntry(entry.character)} aria-label={`Exportar ${entry.character.name}`}><Download /></Button><Button type="button" size="icon-sm" variant="destructive" onClick={() => deleteGalleryCharacter(entry.id)} aria-label={`Excluir ${entry.character.name}`}><Trash2 /></Button></div></article> })}</div>{galleryEntries.length === 0 && <div className="mt-5 rounded-[24px] border border-dashed border-border bg-card/70 px-6 py-14 text-center"><UserRound className="mx-auto size-10 text-muted-foreground" /><h2 className="mt-3 font-bold text-foreground">Nenhuma ficha de Cronos na galeria</h2><p className="mt-1 text-sm text-muted-foreground">Crie uma ficha ou importe um JSON de Cronos.</p></div>}</section>
}
