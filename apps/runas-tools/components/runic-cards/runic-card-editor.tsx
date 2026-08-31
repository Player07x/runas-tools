"use client"

import { useEffect, useRef, useState } from "react"
import { characterElements } from "@runas/core/data/elements"
import { Download, FileJson, ImageDown, RotateCcw, Upload } from "lucide-react"
import { ImageCropper } from "@/components/runic-cards/image-cropper"
import { RunicCardPreview } from "@/components/runic-cards/runic-card-preview"
import { Button } from "@/components/ui/button"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { SelectField } from "@/components/ui/select-field"
import { TextField } from "@/components/ui/text-field"
import { cardFilename, createEmptyRunicCard, createRunicCardFile, normalizeRunicCard, runicCardKinds, runicCardRarities, type RunicCard, type RunicCardKind } from "@/lib/runicCards"
import { saveExportedBlob, saveExportedJson } from "@/lib/fileExport"
import { cn } from "@/lib/utils"

const DRAFT_KEY = "runas-tools:runic-card-draft:v1"

export function RunicCardEditor() {
  const [card, setCard] = useState<RunicCard>(() => createEmptyRunicCard())
  const [ready, setReady] = useState(false)
  const [message, setMessage] = useState("")
  const [exporting, setExporting] = useState(false)
  const previewRef = useRef<HTMLDivElement>(null)
  const importInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(DRAFT_KEY)
      if (stored) setCard(normalizeRunicCard(JSON.parse(stored)))
    } catch {
      window.localStorage.removeItem(DRAFT_KEY)
    } finally {
      setReady(true)
    }
  }, [])

  useEffect(() => {
    if (!ready) return
    const timeout = window.setTimeout(() => window.localStorage.setItem(DRAFT_KEY, JSON.stringify(card)), 250)
    return () => window.clearTimeout(timeout)
  }, [card, ready])

  function update<K extends keyof RunicCard>(key: K, value: RunicCard[K]) {
    setCard((current) => ({ ...current, [key]: value }))
    setMessage("")
  }

  function changeKind(kind: RunicCardKind) {
    const defaults = createEmptyRunicCard(kind)
    setCard((current) => ({
      ...defaults,
      id: current.id,
      name: current.name,
      elementId: current.elementId,
      rarity: current.rarity,
      rulesHtml: current.rulesHtml,
      flavorText: current.flavorText,
      artDataUrl: current.artDataUrl,
    }))
    setMessage("")
  }

  async function importCard(file: File | undefined) {
    if (!file) return
    try {
      const imported = normalizeRunicCard(JSON.parse(await file.text()))
      setCard(imported)
      setMessage("Carta importada. O rascunho local foi atualizado.")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível importar a carta.")
    } finally {
      if (importInputRef.current) importInputRef.current.value = ""
    }
  }

  async function exportJson() {
    await saveExportedJson(createRunicCardFile(card), cardFilename(card, "json"))
    setMessage("JSON exportado com os dados e a arte da carta.")
  }

  async function exportPng() {
    const node = previewRef.current
    if (!node || exporting) return
    setExporting(true)
    setMessage("")
    try {
      const { toBlob } = await import("html-to-image")
      const blob = await toBlob(node, {
        cacheBust: true,
        pixelRatio: 1,
        canvasWidth: 1512,
        canvasHeight: 2112,
        backgroundColor: "transparent",
      })
      if (!blob) throw new Error("O navegador não conseguiu montar a imagem.")
      await saveExportedBlob(blob, cardFilename(card, "png"), "Carta Rúnica em PNG")
      setMessage("PNG exportado em alta resolução.")
    } catch (error) {
      setMessage(error instanceof Error ? `Falha ao exportar PNG: ${error.message}` : "Falha ao exportar PNG.")
    } finally {
      setExporting(false)
    }
  }

  function resetCard() {
    if (!window.confirm("Limpar o rascunho atual e começar uma nova carta?")) return
    const next = createEmptyRunicCard(card.kind)
    setCard(next)
    window.localStorage.removeItem(DRAFT_KEY)
    setMessage("Novo rascunho criado.")
  }

  const isCombatCard = card.kind === "adventurer" || card.kind === "troop"
  const hasCost = card.kind === "troop" || card.kind === "spell"

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border bg-card p-4 shadow-[0_12px_36px_rgba(30,36,55,0.07)] sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-5">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Criador de cartas</h2>
            <p className="mt-1 text-sm text-muted-foreground">O rascunho é salvo automaticamente neste navegador.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <input ref={importInputRef} className="sr-only" type="file" accept="application/json,.json" onChange={(event) => void importCard(event.target.files?.[0])} />
            <Button type="button" variant="outline" onClick={() => importInputRef.current?.click()}><Upload />Importar JSON</Button>
            <Button type="button" variant="ghost" onClick={resetCard}><RotateCcw />Nova carta</Button>
          </div>
        </div>

        <fieldset className="mt-5">
          <legend className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Categoria da carta</legend>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {runicCardKinds.map((kind) => (
              <button
                key={kind.value}
                type="button"
                aria-pressed={card.kind === kind.value}
                onClick={() => changeKind(kind.value)}
                className={cn(
                  "h-11 rounded-xl border px-3 text-sm font-bold transition",
                  card.kind === kind.value ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {kind.label}
              </button>
            ))}
          </div>
        </fieldset>
      </section>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(26rem,0.82fr)]">
        <section className="min-w-0 space-y-5 rounded-3xl border border-border bg-card p-4 shadow-[0_12px_36px_rgba(30,36,55,0.07)] sm:p-6" aria-label="Dados da carta">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Nome" value={card.name} onChange={(value) => update("name", value)} placeholder="Nome da carta" />
            <TextField label={card.kind === "spell" ? "Tipo de magia" : "Tipo"} value={card.type} onChange={(value) => update("type", value)} placeholder={card.kind === "spell" ? "Feitiço, Ritual, Magia Rápida…" : "Humano, Runa, Arma…"} />
            <SelectField label="Elemento" value={card.elementId} onChange={(value) => update("elementId", value)} options={characterElements.map((element) => ({ value: element.id, label: element.kind === "Fusão" ? `${element.name} · Fusão` : element.name }))} />
            {card.kind !== "adventurer" && <SelectField label="Raridade" value={card.rarity} onChange={(value) => update("rarity", value as RunicCard["rarity"])} options={runicCardRarities.map((rarity) => ({ value: rarity.value, label: `${rarity.label} · até ${rarity.copies} cópia${rarity.copies === 1 ? "" : "s"}` }))} />}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {hasCost && <NumberField label="Custo" value={card.cost} min={0} max={10} onChange={(value) => update("cost", value)} />}
            {card.kind === "adventurer" && <NumberField label="Ganho de Energia" value={card.energyGain} min={0} max={10} onChange={(value) => update("energyGain", value)} prefix="+" />}
            {isCombatCard && <NumberField label="Vida" value={card.life} min={0} max={999} onChange={(value) => update("life", value)} />}
            {isCombatCard && <NumberField label="Aura" value={card.aura} min={0} max={999} onChange={(value) => update("aura", value)} />}
            {isCombatCard && <NumberField label="Dano" value={card.damage} min={0} max={999} onChange={(value) => update("damage", value)} />}
            {isCombatCard && <SelectField label="Tipo de dano" value={card.damageKind} onChange={(value) => update("damageKind", value as RunicCard["damageKind"])} options={[{ value: "physical", label: "FIS · Físico" }, { value: "magical", label: "MAG · Mágico" }, { value: "hybrid", label: "FIS/MAG · Físico ou Mágico" }]} />}
          </div>

          <ImageCropper currentImage={card.artDataUrl} onApply={(dataUrl) => update("artDataUrl", dataUrl)} />

          <RichTextEditor label="Texto de regras" value={card.rulesHtml} onChange={(value) => update("rulesHtml", value)} maxLength={3000} />
          <TextField label="Flavor text" type="textarea" value={card.flavorText} onChange={(value) => update("flavorText", value)} placeholder="Uma frase narrativa curta…" />
        </section>

        <aside className="min-w-0 xl:sticky xl:top-24" aria-label="Prévia e exportação">
          <div className="rounded-3xl border border-border bg-card p-3 shadow-[0_12px_36px_rgba(30,36,55,0.09)] sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold tracking-tight">Prévia</h2>
                <p className="text-xs text-muted-foreground">Proporção física 63 × 88 mm.</p>
              </div>
              <Download className="size-5 text-muted-foreground" />
            </div>
            <RunicCardPreview ref={previewRef} card={card} />
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <Button type="button" variant="outline" onClick={() => void exportJson()}><FileJson />Exportar JSON</Button>
              <Button type="button" onClick={() => void exportPng()} disabled={exporting}><ImageDown />{exporting ? "Gerando…" : "Exportar PNG"}</Button>
            </div>
            {message && <p role="status" className="mt-3 rounded-xl bg-muted px-3 py-2 text-xs font-medium text-muted-foreground">{message}</p>}
          </div>
        </aside>
      </div>
    </div>
  )
}

function NumberField({ label, value, min, max, prefix, onChange }: { label: string; value: number; min: number; max: number; prefix?: string; onChange: (value: number) => void }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="flex h-11 items-center rounded-xl border border-input bg-background/70 px-3.5 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/25">
        {prefix && <span className="mr-1 text-sm font-bold text-muted-foreground">{prefix}</span>}
        <input className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-foreground outline-none" type="number" value={value} min={min} max={max} onChange={(event) => onChange(Math.min(max, Math.max(min, Number(event.target.value) || 0)))} />
      </span>
    </label>
  )
}
