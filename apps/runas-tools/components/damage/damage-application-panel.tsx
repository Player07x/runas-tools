"use client"

import { useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { AlertTriangle, ClipboardCheck, Dices, Eraser, RotateCcw, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { NumberInput } from "@/components/ui/number-input"
import { SegmentedToggle } from "@/components/ui/segmented-toggle"
import { SelectField } from "@/components/ui/select-field"
import { TextField } from "@/components/ui/text-field"
import { TokenInput } from "@/components/ui/token-input"
import { useCharacter } from "@/components/character/character-provider"
import { damageTypes } from "@runas/core/data/damageTypes"
import { elementOptions, getCharacterElement } from "@runas/core/data/elements"
import {
  getDamageResourceLabel,
  parseAppliedChanges,
  parseFixedDamage,
  simulateDamageApplication,
} from "@runas/core/lib/damageApplication"
import { calculateCharacterStatSnapshot } from "@runas/core/lib/characterStatCalculations"
import { calculateAttributeTest, calculateSkillModifier, determineSkillRollOutcome, findCharacterSkill } from "@runas/core/lib/skillCalculations"
import type { AppliedDamageChange, DamageResourceKey, DamageResult, SpecialDamageTest } from "@runas/core/types/damage"
import type { SkillRollOutcome } from "@runas/core/types/skillTest"
import type { Character } from "@runas/core/types/character"
import { ItemDamageApplicationPanel } from "./item-damage-application-panel"

interface Props {
  rolledResult: DamageResult | null
}

interface ElementState {
  elementId: string
  resistances: string[]
  weaknesses: string[]
}

interface QuickDamageTestResult {
  diceRolls: [number, number]
  diceSum: number
  testValue: number
  margin: number
  outcome: SkillRollOutcome
}

const emptyElement: ElementState = { elementId: "none", resistances: [], weaknesses: [] }
const damageSuggestions = ["Todos os Físicos", "Todos os Mágicos", ...damageTypes.map((item) => item.name)]

function elementState(elementId: string): ElementState {
  const element = getCharacterElement(elementId)
  return element
    ? { elementId, resistances: [...element.resistances], weaknesses: [...element.weaknesses] }
    : { ...emptyElement }
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? ""
}

function OptionalIntegerField({
  label,
  value,
  onChange,
}: {
  label: string
  value: number | null
  onChange: (value: number | null) => void
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        step={1}
        value={value ?? ""}
        placeholder="Opcional"
        onChange={(event) => {
          const next = event.target.value
          onChange(next === "" ? null : Math.max(0, Math.trunc(Number(next) || 0)))
        }}
        className="h-11 w-full rounded-xl border border-input bg-background/70 px-3.5 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:bg-background focus-visible:ring-3 focus-visible:ring-ring/25"
      />
    </label>
  )
}

function ElementFields({
  title,
  state,
  multiplier,
  onStateChange,
  onMultiplierChange,
}: {
  title: string
  state: ElementState
  multiplier: string
  onStateChange: (state: ElementState) => void
  onMultiplierChange: (value: string) => void
}) {
  return (
    <div className="rounded-2xl border border-border bg-muted/35 p-4">
      <h3 className="mb-3 text-sm font-bold text-foreground">{title}</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SelectField
          label="Elemento"
          value={state.elementId}
          options={elementOptions}
          onChange={(value) => onStateChange(elementState(value))}
        />
        <TextField
          label="Outro Multiplicador"
          value={multiplier}
          onChange={onMultiplierChange}
          placeholder="1x, 2x ou 1/2"
        />
        <TokenInput
          label="Resistência"
          values={state.resistances}
          suggestions={damageSuggestions}
          onChange={(resistances) => onStateChange({ ...state, resistances })}
        />
        <TokenInput
          label="Fraqueza"
          values={state.weaknesses}
          suggestions={damageSuggestions}
          onChange={(weaknesses) => onStateChange({ ...state, weaknesses })}
        />
      </div>
    </div>
  )
}

export function DamageApplicationPanel({ rolledResult }: Props) {
  const [activeTab, setActiveTab] = useState<"target" | "item">("target")
  return (
    <div>
      <div role="tablist" aria-label="Tipo de aplicação de dano" className="mb-4 grid grid-cols-2 rounded-2xl border border-border bg-muted/45 p-1">
        <button type="button" role="tab" aria-selected={activeTab === "target"} onClick={() => setActiveTab("target")} className={`min-h-11 rounded-xl px-3 text-sm font-bold transition ${activeTab === "target" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>Aplicar Dano em Alvo</button>
        <button type="button" role="tab" aria-selected={activeTab === "item"} onClick={() => setActiveTab("item")} className={`min-h-11 rounded-xl px-3 text-sm font-bold transition ${activeTab === "item" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>Aplicar Dano em Item</button>
      </div>
      {activeTab === "target" ? <TargetDamageApplicationPanel rolledResult={rolledResult} /> : <ItemDamageApplicationPanel rolledResult={rolledResult} />}
    </div>
  )
}

function TargetDamageApplicationPanel({ rolledResult }: Props) {
  const { character, updateCharacter, isReady } = useCharacter()
  const snapshot = useMemo(
    () => calculateCharacterStatSnapshot(character.attributes, character.info, character.stats, character.skills, character.abilities),
    [character],
  )
  const [usingOwnSheet, setUsingOwnSheet] = useState(true)
  const [targetName, setTargetName] = useState(character.name)
  const [damageInput, setDamageInput] = useState("")
  const [pv, setPv] = useState(character.stats.pv)
  const [pvMaximum, setPvMaximum] = useState<number | null>(snapshot.pvMax)
  const [pa, setPa] = useState(character.stats.pa)
  const [pe, setPe] = useState(character.stats.pe)
  const [peTemporary, setPeTemporary] = useState(character.stats.peTemporary)
  const [paExtra, setPaExtra] = useState(character.stats.paExtra)
  const [lifeHasElement, setLifeHasElement] = useState(false)
  const [lifeElement, setLifeElement] = useState<ElementState>(emptyElement)
  const [auraElement, setAuraElement] = useState<ElementState>({
    elementId: character.stats.elementId,
    resistances: [...character.stats.resistances],
    weaknesses: [...character.stats.weaknesses],
  })
  const [extraAuraElement, setExtraAuraElement] = useState<ElementState>(emptyElement)
  const [lifeMultiplier, setLifeMultiplier] = useState("1x")
  const [auraMultiplier, setAuraMultiplier] = useState("1x")
  const [extraAuraMultiplier, setExtraAuraMultiplier] = useState("1x")
  const [auraBreak, setAuraBreak] = useState("1/2")
  const [extraAuraBreak, setExtraAuraBreak] = useState("1x")
  const [rdf, setRdf] = useState(Math.max(0, character.stats.armorRdf + character.stats.naturalRdf))
  const [rdm, setRdm] = useState(Math.max(0, character.stats.armorRdm + character.stats.naturalRdm))
  const [mtEnabled, setMtEnabled] = useState(true)
  const [mtValue, setMtValue] = useState(character.stats.mt)
  const [vitalityBonus, setVitalityBonus] = useState(character.attributes.vitality)
  const [powerBonus, setPowerBonus] = useState(character.attributes.power)
  const [faithBonus, setFaithBonus] = useState(character.attributes.faith)
  const [luckBonus, setLuckBonus] = useState(character.attributes.luck)
  const [vitalityTest, setVitalityTest] = useState(() => calculateAttributeTest(character.attributes, "vitality"))
  const [sanityTest, setSanityTest] = useState(() => calculateSanityTest(character))
  const [simulationSteps, setSimulationSteps] = useState<string[]>([])
  const [notices, setNotices] = useState<string[]>([])
  const [specialTest, setSpecialTest] = useState<SpecialDamageTest | null>(null)
  const [quickTestResult, setQuickTestResult] = useState<QuickDamageTestResult | null>(null)
  const [resultText, setResultText] = useState("")
  const [simulationError, setSimulationError] = useState<string | null>(null)
  const [applyMessage, setApplyMessage] = useState<string | null>(null)
  const [confirmation, setConfirmation] = useState<{ warnings: string[]; changes: AppliedDamageChange[] } | null>(null)

  const target = firstName(targetName) || "Alvo"
  const parsedSummary = useMemo(() => resultText ? parseAppliedChanges(resultText) : { value: null, error: null }, [resultText])
  const totalDamage = parsedSummary.value?.reduce((total, change) => total + Math.max(0, -change.amount), 0) ?? 0
  const fatal = parsedSummary.value?.some((change) => normalizeNote(change.note).includes("fulminante")) ?? false

  function markExternalTarget() {
    setUsingOwnSheet(false)
    setApplyMessage(null)
  }

  function loadOwnSheet() {
    setTargetName(character.name)
    setPv(character.stats.pv)
    setPvMaximum(snapshot.pvMax)
    setPa(character.stats.pa)
    setPe(character.stats.pe)
    setPeTemporary(character.stats.peTemporary)
    setPaExtra(character.stats.paExtra)
    setAuraElement({
      elementId: character.stats.elementId,
      resistances: [...character.stats.resistances],
      weaknesses: [...character.stats.weaknesses],
    })
    setRdf(Math.max(0, character.stats.armorRdf + character.stats.naturalRdf))
    setRdm(Math.max(0, character.stats.armorRdm + character.stats.naturalRdm))
    setMtEnabled(true)
    setMtValue(character.stats.mt)
    setVitalityBonus(character.attributes.vitality)
    setPowerBonus(character.attributes.power)
    setFaithBonus(character.attributes.faith)
    setLuckBonus(character.attributes.luck)
    setVitalityTest(calculateAttributeTest(character.attributes, "vitality"))
    setSanityTest(calculateSanityTest(character))
    if (rolledResult) {
      setDamageInput(`${Math.max(0, rolledResult.totalBeforeReduction)} ${rolledResult.damageTypeName}`)
    }
    setUsingOwnSheet(true)
    setApplyMessage(null)
  }

  function clearTargetFields() {
    setUsingOwnSheet(false)
    setTargetName("")
    setDamageInput("")
    setPv(0)
    setPvMaximum(null)
    setPa(0)
    setPe(0)
    setPeTemporary(0)
    setPaExtra(0)
    setLifeHasElement(false)
    setLifeElement({ ...emptyElement })
    setAuraElement({ ...emptyElement })
    setExtraAuraElement({ ...emptyElement })
    setLifeMultiplier("1x")
    setAuraMultiplier("1x")
    setExtraAuraMultiplier("1x")
    setAuraBreak("1/2")
    setExtraAuraBreak("1x")
    setRdf(0)
    setRdm(0)
    setMtEnabled(false)
    setMtValue(0)
    setVitalityBonus(0)
    setPowerBonus(0)
    setFaithBonus(0)
    setLuckBonus(0)
    setVitalityTest(0)
    setSanityTest(0)
    setSimulationSteps([])
    setNotices([])
    setSpecialTest(null)
    setQuickTestResult(null)
    setResultText("")
    setSimulationError(null)
    setApplyMessage(null)
    setConfirmation(null)
  }

  function useRolledDamage() {
    if (!rolledResult) return
    setDamageInput(`${Math.max(0, rolledResult.totalBeforeReduction)} ${rolledResult.damageTypeName}`)
    setSimulationError(null)
  }

  function simulate(specialTestSucceeded: boolean | null = null) {
    const parsed = parseFixedDamage(damageInput)
    if (!parsed.value) {
      setSimulationError(parsed.error)
      setSimulationSteps([])
      setNotices([])
      setSpecialTest(null)
      setQuickTestResult(null)
      setResultText("")
      return
    }
    const simulation = simulateDamageApplication({
      damage: parsed.value,
      mtEnabled,
      mtValue,
      rdf,
      rdm,
      attributeBonuses: { vitality: vitalityBonus, power: powerBonus, faith: faithBonus, luck: luckBonus },
      specialTestSucceeded,
      layers: [
        {
          resource: "paExtra",
          current: paExtra,
          resistances: extraAuraElement.elementId === "none" ? [] : extraAuraElement.resistances,
          weaknesses: extraAuraElement.elementId === "none" ? [] : extraAuraElement.weaknesses,
          multiplier: extraAuraMultiplier,
          breakMultiplier: extraAuraBreak,
        },
        {
          resource: "pa",
          current: pa,
          resistances: auraElement.resistances,
          weaknesses: auraElement.weaknesses,
          multiplier: auraMultiplier,
          breakMultiplier: auraBreak,
        },
        {
          resource: "pv",
          current: pv,
          maximum: pvMaximum ?? undefined,
          resistances: lifeHasElement ? lifeElement.resistances : [],
          weaknesses: lifeHasElement ? lifeElement.weaknesses : [],
          multiplier: lifeMultiplier,
        },
      ],
    })
    setSimulationError(simulation.error)
    setSimulationSteps(simulation.value?.steps ?? [])
    setNotices(simulation.value?.notices ?? [])
    setSpecialTest(simulation.value?.specialTest ?? null)
    setResultText(simulation.value?.resultText ?? "")
    setApplyMessage(null)
  }

  function rollSpecialTest() {
    if (!specialTest) return
    const base = specialTest.kind === "vitality" ? vitalityTest : sanityTest
    const testValue = base - specialTest.penalty
    const diceRolls: [number, number] = [Math.floor(Math.random() * 10) + 1, Math.floor(Math.random() * 10) + 1]
    applyQuickTestResult(diceRolls, testValue)
  }

  function applyQuickTestResult(diceRolls: [number, number], testValue: number) {
    const diceSum = diceRolls[0] + diceRolls[1]
    const margin = testValue - diceSum
    const outcome = determineSkillRollOutcome(diceRolls, margin)
    setQuickTestResult({ diceRolls, diceSum, testValue, margin, outcome })
    simulate(outcome === "success" || outcome === "critical-success")
  }

  function useDetermination() {
    if (!quickTestResult || character.stats.determination <= 0 || isCritical(quickTestResult.outcome)) return
    updateCharacter((previous) => ({ ...previous, stats: { ...previous.stats, determination: previous.stats.determination - 1 } }))
    applyQuickTestResult(quickTestResult.diceRolls, quickTestResult.testValue + 1)
  }

  function useCasualty() {
    if (!quickTestResult || character.stats.casualty <= 0 || isCritical(quickTestResult.outcome)) return
    updateCharacter((previous) => ({ ...previous, stats: { ...previous.stats, casualty: previous.stats.casualty - 1 } }))
    const diceRolls: [number, number] = [Math.floor(Math.random() * 10) + 1, Math.floor(Math.random() * 10) + 1]
    applyQuickTestResult(diceRolls, quickTestResult.testValue)
  }

  function resourceLimits(resource: DamageResourceKey): { current: number; maximum: number } {
    if (resource === "pv") return { current: character.stats.pv, maximum: snapshot.pvMax }
    if (resource === "pa") return { current: character.stats.pa, maximum: snapshot.paMax }
    if (resource === "paExtra") return { current: character.stats.paExtra, maximum: snapshot.paExtraMax }
    if (resource === "pe") return { current: character.stats.pe, maximum: snapshot.peMax }
    return { current: character.stats.peTemporary, maximum: snapshot.peTemporaryMax }
  }

  function requestApply() {
    if (!parsedSummary.value || parsedSummary.error || !usingOwnSheet) return
    const warnings: string[] = []
    for (const change of parsedSummary.value) {
      const limits = resourceLimits(change.resource)
      const next = limits.current + change.amount
      if (change.resource !== "pv" && next < 0) {
        warnings.push(`${getDamageResourceLabel(change.resource)} ficaria em ${next}; o valor será fixado em 0.`)
      }
      if (next > limits.maximum) {
        warnings.push(`${getDamageResourceLabel(change.resource)} ultrapassaria o máximo ${limits.maximum}; o excedente será perdido.`)
      }
    }
    if (warnings.length > 0) setConfirmation({ warnings, changes: parsedSummary.value })
    else applyChanges(parsedSummary.value)
  }

  function applyChanges(changes: AppliedDamageChange[]) {
    const deltas = Object.fromEntries(changes.map((change) => [change.resource, change.amount])) as Partial<Record<DamageResourceKey, number>>
    const nextPv = Math.min(snapshot.pvMax, character.stats.pv + (deltas.pv ?? 0))
    const nextPa = clamp(character.stats.pa + (deltas.pa ?? 0), 0, snapshot.paMax)
    const nextPaExtra = clamp(character.stats.paExtra + (deltas.paExtra ?? 0), 0, snapshot.paExtraMax)
    const nextPe = clamp(character.stats.pe + (deltas.pe ?? 0), 0, snapshot.peMax)
    const nextPeTemporary = clamp(character.stats.peTemporary + (deltas.peTemporary ?? 0), 0, snapshot.peTemporaryMax)
    updateCharacter((previous) => ({
      ...previous,
      stats: {
        ...previous.stats,
        pv: nextPv,
        pa: nextPa,
        paExtra: nextPaExtra,
        pe: nextPe,
        peTemporary: nextPeTemporary,
      },
    }))
    setPv(nextPv)
    setPa(nextPa)
    setPaExtra(nextPaExtra)
    setPe(nextPe)
    setPeTemporary(nextPeTemporary)
    setConfirmation(null)
    setApplyMessage("Alterações aplicadas e salvas na ficha.")
  }

  return (
    <div>
        <section aria-label="Aplicação de dano" className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5">
            <div className="rounded-2xl border border-primary/25 bg-primary/5 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold text-foreground">Dados do alvo</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {usingOwnSheet ? "Vinculado à ficha atual. Os valores abaixo foram importados." : "Alvo externo: somente a simulação está disponível."}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={loadOwnSheet} disabled={!isReady}>
                    <RotateCcw /> Usar minha ficha
                  </Button>
                  <Button type="button" variant="outline" onClick={clearTargetFields}>
                    <Eraser /> Limpar
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField label="Nome do Alvo (opcional)" value={targetName} onChange={setTargetName} placeholder="Primeiro nome usado nos campos" />
              <div className="flex flex-col gap-1.5">
                <TextField label="Dano Causado" value={damageInput} onChange={setDamageInput} placeholder="15 queimadura" />
                <button type="button" disabled={!rolledResult} onClick={useRolledDamage} className="self-start text-xs font-semibold text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-45">
                  Usar o Dano Rolado{rolledResult ? ` (${rolledResult.totalBeforeReduction} ${rolledResult.damageTypeName})` : ""}
                </button>
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-bold text-foreground">Recursos de {target}</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <NumberInput label={`PV Atual (${target})`} value={pv} onChange={(value) => { markExternalTarget(); setPv(Math.trunc(value)) }} />
                <OptionalIntegerField label={`PV Máximo (${target})`} value={pvMaximum} onChange={(value) => { markExternalTarget(); setPvMaximum(value) }} />
                <NumberInput label={`PA Atual (${target})`} value={pa} min={0} onChange={(value) => { markExternalTarget(); setPa(Math.trunc(value)) }} />
                <NumberInput label={`PA Extra (${target})`} value={paExtra} min={0} onChange={(value) => { markExternalTarget(); setPaExtra(Math.trunc(value)) }} />
                <NumberInput label={`PE Atual (${target})`} value={pe} min={0} onChange={(value) => { markExternalTarget(); setPe(Math.trunc(value)) }} />
                <NumberInput label={`PE Temporário / PE Extra (${target})`} value={peTemporary} min={0} onChange={(value) => { markExternalTarget(); setPeTemporary(Math.trunc(value)) }} />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Danos padrão seguem PA Extra → PA → PV. Danos especiais aplicam automaticamente suas exceções de aura, RD e recursos.</p>
            </div>

            <details className="rounded-2xl border border-border bg-muted/35 p-4">
              <summary className="cursor-pointer text-sm font-bold text-foreground">Defesas e testes de danos especiais</summary>
              <p className="mt-2 text-xs text-muted-foreground">Valores importados da ficha. Edite-os para simular um alvo externo.</p>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <NumberInput label="Bônus de Vitalidade" value={vitalityBonus} onChange={(value) => { markExternalTarget(); setVitalityBonus(Math.trunc(value)) }} />
                <NumberInput label="Bônus de Poder" value={powerBonus} onChange={(value) => { markExternalTarget(); setPowerBonus(Math.trunc(value)) }} />
                <NumberInput label="Bônus de Fé" value={faithBonus} onChange={(value) => { markExternalTarget(); setFaithBonus(Math.trunc(value)) }} />
                <NumberInput label="Bônus de Sorte" value={luckBonus} onChange={(value) => { markExternalTarget(); setLuckBonus(Math.trunc(value)) }} />
                <NumberInput label="Teste de Vitalidade" value={vitalityTest} onChange={(value) => { markExternalTarget(); setVitalityTest(Math.trunc(value)) }} />
                <NumberInput label="Teste de Sanidade" value={sanityTest} onChange={(value) => { markExternalTarget(); setSanityTest(Math.trunc(value)) }} />
              </div>
            </details>

            <ElementFields title="Aura Extra" state={extraAuraElement} multiplier={extraAuraMultiplier} onStateChange={setExtraAuraElement} onMultiplierChange={setExtraAuraMultiplier} />
            <ElementFields title="Aura Atual" state={auraElement} multiplier={auraMultiplier} onStateChange={setAuraElement} onMultiplierChange={setAuraMultiplier} />

            <div className="rounded-2xl border border-border bg-muted/35 p-4">
              <SegmentedToggle label="Elemento na Vida?" value={lifeHasElement ? "yes" : "no"} onChange={(value) => setLifeHasElement(value === "yes")} options={[{ value: "no", label: "Não" }, { value: "yes", label: "Sim" }]} />
              {lifeHasElement && <div className="mt-4"><ElementFields title="Vida" state={lifeElement} multiplier={lifeMultiplier} onStateChange={setLifeElement} onMultiplierChange={setLifeMultiplier} /></div>}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <TextField label="Quebra da Aura Extra" value={extraAuraBreak} onChange={setExtraAuraBreak} placeholder="1x" />
              <TextField label="Quebra da Aura" value={auraBreak} onChange={setAuraBreak} placeholder="1/2" />
              <SegmentedToggle label="Aplicar MT?" value={mtEnabled ? "yes" : "no"} onChange={(value) => setMtEnabled(value === "yes")} options={[{ value: "yes", label: "Sim" }, { value: "no", label: "Não" }]} />
              <NumberInput label="MT do Alvo" value={mtValue} onChange={(value) => setMtValue(Math.trunc(value))} />
              <NumberInput label="RDF do Alvo" value={rdf} min={0} onChange={(value) => setRdf(Math.trunc(value))} />
              <NumberInput label="RDM do Alvo" value={rdm} min={0} onChange={(value) => setRdm(Math.trunc(value))} />
            </div>

            <Button type="button" size="lg" onClick={() => { setQuickTestResult(null); simulate() }} className="w-full sm:w-auto sm:self-start">
              <Sparkles /> Simular Dano
            </Button>

            {simulationError && <p role="alert" className="rounded-xl border border-destructive/35 bg-destructive/10 p-3 text-sm font-medium text-destructive">{simulationError}</p>}

            {(resultText || simulationSteps.length > 0 || notices.length > 0 || specialTest) && (
              <div className={`rounded-2xl border p-4 sm:p-5 ${fatal ? "border-black bg-black text-white" : "border-primary/30 bg-primary/5"}`}>
                <h3 className={`text-sm font-bold ${fatal ? "text-white" : "text-foreground"}`}>Resumo dos danos</h3>
                {resultText && <label className="mt-3 block">
                  <span className={`mb-1.5 block text-xs font-medium ${fatal ? "text-white/70" : "text-muted-foreground"}`}>Resultado editável</span>
                  <textarea
                    value={resultText}
                    onChange={(event) => { setResultText(event.target.value); setApplyMessage(null) }}
                    rows={3}
                    className={`w-full resize-y rounded-xl border px-3.5 py-3 text-sm font-semibold outline-none focus:ring-3 ${fatal ? "border-white/25 bg-white/10 text-white focus:ring-white/20" : "border-input bg-background text-foreground focus:ring-ring/25"}`}
                  />
                </label>}
                <p className={`mt-3 text-base font-extrabold ${fatal ? "text-white" : "text-foreground"}`}>Dano Total Sofrido: {totalDamage}</p>
                {parsedSummary.error && <p role="alert" className={`mt-2 text-xs font-semibold ${fatal ? "text-red-300" : "text-destructive"}`}>{parsedSummary.error}</p>}
                {simulationSteps.length > 0 && (
                  <details className="mt-4">
                    <summary className={`cursor-pointer text-xs font-bold ${fatal ? "text-white/80" : "text-muted-foreground"}`}>Ver cálculo transparente</summary>
                    <ol className={`mt-2 list-decimal space-y-1 pl-5 text-xs leading-relaxed ${fatal ? "text-white/70" : "text-muted-foreground"}`}>
                      {simulationSteps.map((step, index) => <li key={`${step}-${index}`}>{step}</li>)}
                    </ol>
                  </details>
                )}
                {notices.length > 0 && (
                  <ul className={`mt-4 space-y-2 rounded-xl border p-4 text-sm leading-relaxed ${fatal ? "border-white/20 bg-white/10" : "border-primary/25 bg-background/70"}`}>
                    {notices.map((notice, index) => <li key={`${notice}-${index}`}>{notice}</li>)}
                  </ul>
                )}
                {specialTest && (
                  <div className={`mt-4 rounded-xl border p-4 ${fatal ? "border-white/20 bg-white/10" : "border-border bg-background/70"}`}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-bold">{specialTest.label}{specialTest.penalty > 0 ? ` − ${specialTest.penalty}` : ""}</p>
                        <p className={`mt-1 text-xs ${fatal ? "text-white/70" : "text-muted-foreground"}`}>Valor final: {(specialTest.kind === "vitality" ? vitalityTest : sanityTest) - specialTest.penalty}</p>
                      </div>
                      <Button type="button" onClick={rollSpecialTest}><Dices /> Rolar teste rápido</Button>
                    </div>
                    {quickTestResult && (
                      <div className="mt-3">
                        <p className="text-sm font-bold">{formatQuickOutcome(quickTestResult)} — {quickTestResult.diceRolls[0]} + {quickTestResult.diceRolls[1]} = {quickTestResult.diceSum}</p>
                      </div>
                    )}
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <Button type="button" variant="outline" onClick={useDetermination} disabled={!quickTestResult || character.stats.determination <= 0 || isCritical(quickTestResult.outcome)}>Usar Determinação ({character.stats.determination})</Button>
                      <Button type="button" variant="outline" onClick={useCasualty} disabled={!quickTestResult || character.stats.casualty <= 0 || isCritical(quickTestResult.outcome)}>Usar Casualidade ({character.stats.casualty})</Button>
                    </div>
                  </div>
                )}
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Button type="button" onClick={requestApply} disabled={!usingOwnSheet || !parsedSummary.value || Boolean(parsedSummary.error)}>
                    <ClipboardCheck /> Aplicar na Ficha
                  </Button>
                  {!usingOwnSheet && <span className={`text-xs ${fatal ? "text-white/70" : "text-muted-foreground"}`}>Use “Usar minha ficha” para liberar a aplicação.</span>}
                  {applyMessage && <span className={`text-xs font-semibold ${fatal ? "text-green-300" : "text-primary"}`}>{applyMessage}</span>}
                </div>
              </div>
            )}
          </div>
        </section>

      {confirmation && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-3 backdrop-blur-[2px]">
          <div role="dialog" aria-modal="true" aria-labelledby="damage-confirm-title" className="w-full max-w-lg rounded-[24px] border border-border bg-card p-5 shadow-2xl sm:p-6">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive"><AlertTriangle /></span>
              <div>
                <h2 id="damage-confirm-title" className="font-bold text-foreground">Confirmar limites da ficha</h2>
                <p className="mt-1 text-sm text-muted-foreground">Algumas alterações precisam ser ajustadas às regras dos recursos.</p>
              </div>
            </div>
            <ul className="mt-4 list-disc space-y-2 rounded-xl border border-destructive/25 bg-destructive/10 p-4 pl-8 text-sm leading-relaxed text-foreground">
              {confirmation.warnings.map((warning) => <li key={warning}>{warning}</li>)}
            </ul>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setConfirmation(null)}>Cancelar</Button>
              <Button type="button" onClick={() => applyChanges(confirmation.changes)}>Sim, aplicar com ajustes</Button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value))
}

function normalizeNote(value?: string): string {
  return (value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR")
}

function calculateSanityTest(character: Character): number {
  const skill = findCharacterSkill(character.skills, "Sanidade")
  if (skill?.attributeKey) return calculateAttributeTest(character.attributes, skill.attributeKey) + calculateSkillModifier(skill)
  return calculateAttributeTest(character.attributes, "intelligence") - 4
}

function isCritical(outcome: SkillRollOutcome): boolean {
  return outcome === "critical-success" || outcome === "critical-failure"
}

function formatQuickOutcome(result: QuickDamageTestResult): string {
  if (result.outcome === "critical-success") return "Sucesso Crítico"
  if (result.outcome === "critical-failure") return "Fracasso Crítico"
  return `${result.outcome === "success" ? "Sucesso" : "Fracasso"} por ${result.margin >= 0 ? "+" : ""}${result.margin}`
}
