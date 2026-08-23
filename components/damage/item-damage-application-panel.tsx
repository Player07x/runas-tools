"use client"

import { useMemo, useState } from "react"
import { ClipboardCheck, PackageSearch, Sparkles, X } from "lucide-react"
import { useCharacter } from "@/components/character/character-provider"
import { Button } from "@/components/ui/button"
import { NumberInput } from "@/components/ui/number-input"
import { SegmentedToggle } from "@/components/ui/segmented-toggle"
import { SelectField } from "@/components/ui/select-field"
import { TextField } from "@/components/ui/text-field"
import { elementOptions, getCharacterElement } from "@/data/elements"
import { parseFixedDamage, simulateDamageApplication } from "@/lib/damageApplication"
import type { DamageResult } from "@/types/damage"

interface Props {
  rolledResult: DamageResult | null
}

function forItem(value: string, prMaximum: number): string {
  return value
    .replace(/seu personagem/gi, "o item")
    .replace(/o personagem/gi, "o item")
    .replace(/personagem/gi, "item")
    .replace(/PV(s)?/g, "PR$1")
    .replace(/recupera 0 PR atuais/gi, `recupera ${Math.ceil(prMaximum / 2)} PR atuais`)
}

export function ItemDamageApplicationPanel({ rolledResult }: Props) {
  const { character, updateCharacter } = useCharacter()
  const sortedItems = useMemo(() => character.inventory
    .map((item, index) => ({ item, index }))
    .sort((left, right) => Number(right.item.usage === "equipped") - Number(left.item.usage === "equipped") || left.index - right.index)
    .map(({ item }) => item), [character.inventory])
  const [choosingItem, setChoosingItem] = useState(false)
  const [itemId, setItemId] = useState("")
  const [itemName, setItemName] = useState("")
  const [damageInput, setDamageInput] = useState("")
  const [pr, setPr] = useState(0)
  const [prMaximum, setPrMaximum] = useState(0)
  const [otherMultiplier, setOtherMultiplier] = useState("1x")
  const [elementId, setElementId] = useState("none")
  const [mtEnabled, setMtEnabled] = useState(true)
  const [mtValue, setMtValue] = useState(character.stats.mt)
  const [rdf, setRdf] = useState(0)
  const [rdm, setRdm] = useState(0)
  const [loss, setLoss] = useState(0)
  const [steps, setSteps] = useState<string[]>([])
  const [notices, setNotices] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [hasApplied, setHasApplied] = useState(false)
  const [applyMessage, setApplyMessage] = useState<string | null>(null)

  const broken = loss > 0 && pr - loss <= 0
  const resultText = loss > 0 ? `-${loss} PRs${broken ? " (QUEBRADO)" : ""}` : "0 PRs"

  function clearResult() {
    setLoss(0)
    setSteps([])
    setNotices([])
    setError(null)
    setHasApplied(false)
    setApplyMessage(null)
  }

  function chooseItem(nextId: string) {
    const item = character.inventory.find((candidate) => candidate.id === nextId)
    if (!item) return
    setItemId(item.id)
    setItemName(item.name || "Item sem nome")
    setPr(Math.max(0, item.prCurrent ?? 0))
    setPrMaximum(Math.max(0, item.prMaximum ?? item.prCurrent ?? 0))
    setRdf(Math.max(0, item.rdf))
    setRdm(Math.max(0, item.rdm))
    setMtEnabled(true)
    setMtValue(character.stats.mt)
    setChoosingItem(false)
    clearResult()
  }

  function useRolledDamage() {
    if (!rolledResult) return
    setDamageInput(`${Math.max(0, rolledResult.totalBeforeReduction)} ${rolledResult.damageTypeName}`)
    clearResult()
  }

  function simulate() {
    const parsed = parseFixedDamage(damageInput)
    if (!parsed.value) {
      setError(parsed.error)
      setLoss(0)
      setSteps([])
      setNotices([])
      return
    }
    const element = getCharacterElement(elementId)
    const simulation = simulateDamageApplication({
      damage: parsed.value,
      mtEnabled,
      mtValue,
      rdf,
      rdm,
      attributeBonuses: { vitality: 0, power: 0, faith: 0, luck: 0 },
      layers: [{
        resource: "pv",
        current: pr,
        resistances: element?.resistances ?? [],
        weaknesses: element?.weaknesses ?? [],
        multiplier: otherMultiplier,
      }],
    })
    setError(simulation.error)
    setSteps(simulation.value?.steps.map((step) => forItem(step, prMaximum)) ?? [])
    setNotices(simulation.value?.notices.map((notice) => forItem(notice, prMaximum)) ?? [])
    const change = simulation.value?.changes.find((candidate) => candidate.resource === "pv")
    setLoss(Math.max(0, -(change?.amount ?? 0)))
    setHasApplied(false)
    setApplyMessage(null)
  }

  function applyDamage() {
    if (!itemId || loss <= 0 || hasApplied) return
    const nextPr = Math.max(0, pr - loss)
    updateCharacter((previous) => ({
      ...previous,
      inventory: previous.inventory.map((item) => item.id === itemId ? { ...item, prCurrent: nextPr } : item),
    }))
    setHasApplied(true)
    setApplyMessage(nextPr === 0 ? "Dano aplicado. O item foi quebrado." : `Dano aplicado. PR atual: ${nextPr}.`)
  }

  return (
    <section aria-label="Aplicação de dano em item" className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-5">
        <div className="rounded-2xl border border-primary/25 bg-primary/5 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-foreground">Dados do item</p>
              <p className="mt-1 text-xs text-muted-foreground">{itemId ? `Vinculado a “${itemName}”.` : "Escolha um item do inventário para importar e aplicar seus PRs."}</p>
            </div>
            <Button type="button" variant="outline" onClick={() => setChoosingItem((current) => !current)}><PackageSearch /> Escolher Item</Button>
          </div>
          {choosingItem && (
            <div className="mt-4 rounded-xl border border-border bg-card p-3">
              <div className="flex items-center justify-between gap-2"><p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Inventário — equipados primeiro</p><button type="button" onClick={() => setChoosingItem(false)} aria-label="Fechar lista"><X className="size-4" /></button></div>
              {sortedItems.length === 0
                ? <p className="mt-3 text-sm text-muted-foreground">O inventário está vazio.</p>
                : <div className="mt-3 grid max-h-72 gap-2 overflow-y-auto sm:grid-cols-2">{sortedItems.map((item) => <button type="button" key={item.id} onClick={() => chooseItem(item.id)} className="rounded-xl border border-border bg-background px-3 py-2 text-left text-sm transition hover:border-primary/50 hover:bg-primary/5"><strong className="block truncate">{item.name || "Item sem nome"}</strong><span className="text-xs text-muted-foreground">{item.usage === "equipped" ? "Equipado · " : ""}PR {item.prCurrent ?? 0}/{item.prMaximum ?? 0}</span></button>)}</div>}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <TextField label="Dano Causado" value={damageInput} onChange={(value) => { setDamageInput(value); clearResult() }} placeholder="15 cortante" />
            <button type="button" disabled={!rolledResult} onClick={useRolledDamage} className="self-start text-xs font-semibold text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-45">Usar o Dano Rolado{rolledResult ? ` (${rolledResult.totalBeforeReduction} ${rolledResult.damageTypeName})` : ""}</button>
          </div>
          <SelectField label="Elemento no Objeto" value={elementId} onChange={(value) => { setElementId(value); clearResult() }} options={elementOptions} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <NumberInput label="PR Atual" value={pr} min={0} onChange={(value) => { setPr(Math.max(0, Math.trunc(value))); clearResult() }} />
          <NumberInput label="PR Máximo" value={prMaximum} min={0} onChange={(value) => { setPrMaximum(Math.max(0, Math.trunc(value))); clearResult() }} />
          <TextField label="Outros Multiplicadores" value={otherMultiplier} onChange={(value) => { setOtherMultiplier(value); clearResult() }} placeholder="1x, 2x ou 1/2" />
          <SegmentedToggle label="Aplicar MT?" value={mtEnabled ? "yes" : "no"} onChange={(value) => { setMtEnabled(value === "yes"); clearResult() }} options={[{ value: "yes", label: "Sim" }, { value: "no", label: "Não" }]} />
          <NumberInput label="MT do Item" value={mtValue} onChange={(value) => { setMtValue(Math.trunc(value)); clearResult() }} />
          <NumberInput label="RDF do Item" value={rdf} min={0} onChange={(value) => { setRdf(Math.max(0, Math.trunc(value))); clearResult() }} />
          <NumberInput label="RDM do Item" value={rdm} min={0} onChange={(value) => { setRdm(Math.max(0, Math.trunc(value))); clearResult() }} />
        </div>

        <Button type="button" size="lg" onClick={simulate} className="w-full sm:w-auto sm:self-start"><Sparkles /> Simular Dano</Button>
        {error && <p role="alert" className="rounded-xl border border-destructive/35 bg-destructive/10 p-3 text-sm font-medium text-destructive">{error}</p>}

        {(loss > 0 || steps.length > 0 || notices.length > 0) && (
          <div className={`rounded-2xl border p-4 sm:p-5 ${broken ? "border-black bg-black text-white" : "border-primary/30 bg-primary/5"}`}>
            <h3 className={`text-sm font-bold ${broken ? "text-white" : "text-foreground"}`}>Resumo dos danos no item</h3>
            <p className="mt-3 text-lg font-extrabold">{resultText}</p>
            {notices.length > 0 && <ul className={`mt-4 space-y-2 rounded-xl border p-4 text-sm ${broken ? "border-white/20 bg-white/10" : "border-primary/25 bg-background/70"}`}>{notices.map((notice, index) => <li key={`${notice}-${index}`}>{notice}</li>)}</ul>}
            {steps.length > 0 && <details className="mt-4"><summary className={`cursor-pointer text-xs font-bold ${broken ? "text-white/80" : "text-muted-foreground"}`}>Ver cálculo transparente</summary><ol className={`mt-2 list-decimal space-y-1 pl-5 text-xs ${broken ? "text-white/70" : "text-muted-foreground"}`}>{steps.map((step, index) => <li key={`${step}-${index}`}>{step}</li>)}</ol></details>}
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button type="button" onClick={applyDamage} disabled={!itemId || loss <= 0 || hasApplied}><ClipboardCheck /> Aplicar Dano no Item</Button>
              {!itemId && <span className={`text-xs ${broken ? "text-white/70" : "text-muted-foreground"}`}>Use “Escolher Item” para habilitar a aplicação.</span>}
              {applyMessage && <span className={`text-xs font-semibold ${broken ? "text-green-300" : "text-primary"}`}>{applyMessage}</span>}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
