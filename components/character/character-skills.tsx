"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { ChevronDown, Dices, History, Plus, Sparkles, Trash2, WandSparkles } from "lucide-react"
import type {
  CharacterAttributes,
  CharacterInfo,
  CharacterSkill,
  CharacterStats,
  SecondaryAttributeKey,
} from "@/types/character"
import type { SkillRoll, SkillTestConfig, SpecialDieId } from "@/types/skillTest"
import { damageAttributes } from "@/data/attributes"
import { specialDice } from "@/data/skills"
import { calculateCharacterStatSnapshot } from "@/lib/characterStatCalculations"
import {
  applyDeterminationToRoll,
  calculateAttributeTest,
  calculateSkillLevel,
  calculateSkillModifier,
  compareSkillRolls,
  findCharacterSkill,
  formatSkillRollOutcome,
  getBestSkillRoll,
  normalizeSkillName,
  parseSkillExpression,
  rollSkillTest,
} from "@/lib/skillCalculations"
import { cn } from "@/lib/utils"

interface Props {
  attributes: CharacterAttributes
  info: CharacterInfo
  skills: CharacterSkill[]
  stats: CharacterStats
  onSkillChange: (id: string, updates: Partial<CharacterSkill>) => void
  onAddSkill: (skill: CharacterSkill) => void
  onRemoveSkill: (id: string) => void
  onStatsChange: (updates: Partial<CharacterStats>) => void
}

interface QuickRollResult {
  diceRolls: [number, number]
  diceSum: number
  margin: number
  label: string
}

function EditableInteger({
  value,
  onChange,
  label,
  min,
  max,
  readOnly,
  className,
}: {
  value: number
  onChange?: (value: number) => void
  label: string
  min?: number
  max?: number
  readOnly?: boolean
  className?: string
}) {
  const editing = useRef(false)
  const [draft, setDraft] = useState(String(Math.trunc(Number.isFinite(value) ? value : 0)))

  useEffect(() => {
    if (!editing.current) setDraft(String(Math.trunc(Number.isFinite(value) ? value : 0)))
  }, [value])

  function normalize(raw: string): number {
    const parsed = Number(raw)
    const fallback = min && min > 0 ? min : 0
    if (!raw.trim() || !Number.isFinite(parsed)) return fallback
    return Math.min(max ?? Number.POSITIVE_INFINITY, Math.max(min ?? Number.NEGATIVE_INFINITY, Math.trunc(parsed)))
  }

  function commit() {
    editing.current = false
    const next = normalize(draft)
    setDraft(String(next))
    if (onChange && next !== value) onChange(next)
  }

  return (
    <input
      type="number"
      inputMode="numeric"
      aria-label={label}
      value={draft}
      min={min}
      max={max}
      readOnly={readOnly || !onChange}
      onFocus={() => { editing.current = true }}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur()
      }}
      onChange={onChange ? (event) => {
        const nextDraft = event.target.value
        setDraft(nextDraft)
        if (!nextDraft.trim() || nextDraft === "-") return
        const parsed = Number(nextDraft)
        if (Number.isFinite(parsed)) onChange(normalize(nextDraft))
      } : undefined}
      className={cn(
        "h-10 min-w-0 rounded-xl border border-input bg-background/65 px-2 text-center text-sm tabular-nums text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/25 read-only:cursor-default read-only:text-muted-foreground",
        className,
      )}
    />
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="mb-1 block text-[0.62rem] font-medium uppercase tracking-wide text-muted-foreground">{children}</span>
}

function resultTone(outcome: SkillRoll["outcome"]): string {
  if (outcome === "critical-success") return "border-emerald-500/45 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
  if (outcome === "success") return "border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300"
  if (outcome === "critical-failure") return "border-red-500/45 bg-red-500/10 text-red-700 dark:text-red-300"
  return "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
}

export function CharacterSkills({
  attributes,
  info,
  skills,
  stats,
  onSkillChange,
  onAddSkill,
  onRemoveSkill,
  onStatsChange,
}: Props) {
  const firstSkill = skills[0]
  const initialConfig: SkillTestConfig = firstSkill
    ? {
        attributeKey: firstSkill.attributeKey,
        skillName: firstSkill.name,
        skillModifier: calculateSkillModifier(firstSkill),
        masterModifier: 0,
        otherModifiers: 0,
        specialDieId: "none",
      }
    : {
        attributeKey: "",
        skillName: "",
        skillModifier: 0,
        masterModifier: 0,
        otherModifiers: 0,
        specialDieId: "none",
      }
  const [config, setConfig] = useState<SkillTestConfig>(initialConfig)
  const [quickTest, setQuickTest] = useState(0)
  const [quickResult, setQuickResult] = useState<QuickRollResult | null>(null)
  const [quickExpression, setQuickExpression] = useState("")
  const [parserMessage, setParserMessage] = useState<string | null>(null)
  const [history, setHistory] = useState<SkillRoll[]>([])
  const [activeRoll, setActiveRoll] = useState<SkillRoll | null>(null)
  const calculatorRef = useRef<HTMLElement>(null)
  const snapshot = useMemo(
    () => calculateCharacterStatSnapshot(attributes, info, stats, skills),
    [attributes, info, skills, stats],
  )

  function clearRolls() {
    setHistory([])
    setActiveRoll(null)
  }

  function changeConfig<K extends keyof SkillTestConfig>(key: K, value: SkillTestConfig[K]) {
    setConfig((current) => ({ ...current, [key]: value }))
    clearRolls()
  }

  function historyLimit(rolls: SkillRoll[]): number {
    const specialUses = rolls.filter((roll) => roll.specialDieId !== "none").length
    return Math.min(25, Math.max(10, snapshot.casualtyMax) + specialUses)
  }

  function performRoll(
    nextConfig = config,
    previousHistory = history,
    previousActive = activeRoll,
    useBestChanceResult = false,
  ) {
    let comparisonRoll = previousActive
    let comparisonHistory = previousHistory
    if (nextConfig.specialDieId === "luck" && !comparisonRoll) {
      const initialRoll = rollSkillTest({ config: { ...nextConfig, specialDieId: "none" }, attributes })
      if (initialRoll) {
        comparisonRoll = initialRoll
        comparisonHistory = [initialRoll, ...comparisonHistory]
      }
    }
    const roll = rollSkillTest({ config: nextConfig, attributes })
    if (!roll) return
    const allRolls = [roll, ...comparisonHistory]
    const nextHistory = allRolls.slice(0, historyLimit(allRolls))
    let displayed = roll
    if (nextConfig.specialDieId === "luck" && comparisonRoll && compareSkillRolls(comparisonRoll, roll) > 0) {
      displayed = comparisonRoll
    }
    if (useBestChanceResult) displayed = getBestSkillRoll(nextHistory) ?? roll
    setHistory(nextHistory)
    setActiveRoll(displayed)
  }

  function rollQuickTest() {
    const diceRolls: [number, number] = [Math.floor(Math.random() * 10) + 1, Math.floor(Math.random() * 10) + 1]
    const diceSum = diceRolls[0] + diceRolls[1]
    const margin = quickTest - diceSum
    const label = diceRolls[0] === 1 && diceRolls[1] === 1
      ? "Sucesso Crítico"
      : diceRolls[0] === 10 && diceRolls[1] === 10
        ? "Fracasso Crítico"
        : `${margin >= 0 ? "Sucesso" : "Fracasso"} por ${margin >= 0 ? "+" : ""}${margin}`
    setQuickResult({ diceRolls, diceSum, margin, label })
  }

  function applyQuickExpression() {
    const parsed = parseSkillExpression(quickExpression, skills)
    const nextConfig: SkillTestConfig = {
      attributeKey: parsed.attributeKey,
      skillName: parsed.skillName,
      skillModifier: parsed.skillModifier,
      masterModifier: parsed.masterModifier,
      otherModifiers: 0,
      specialDieId: parsed.specialDieId,
    }
    setConfig(nextConfig)
    clearRolls()
    if (!parsed.attributeKey && parsed.source !== "empty") {
      setParserMessage("Perícia exclusiva: selecione manualmente o atributo para liberar a rolagem.")
    } else if (parsed.source === "system-skill") {
      setParserMessage("Perícia encontrada no sistema, mas ausente da ficha: Mod. -3 aplicado.")
    } else if (parsed.source === "empty") {
      setParserMessage("Digite um atributo ou uma perícia.")
    } else {
      setParserMessage("Campos preenchidos a partir da entrada rápida.")
    }
  }

  function rollListedSkill(skill: CharacterSkill) {
    const nextConfig: SkillTestConfig = {
      attributeKey: skill.attributeKey,
      skillName: skill.name,
      skillModifier: calculateSkillModifier(skill),
      masterModifier: 0,
      otherModifiers: 0,
      specialDieId: "none",
    }
    setConfig(nextConfig)
    setParserMessage(null)
    setHistory([])
    setActiveRoll(null)
    performRoll(nextConfig, [], null)
    requestAnimationFrame(() => {
      calculatorRef.current?.focus({ preventScroll: true })
      calculatorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    })
  }

  function addSkill() {
    const id = typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `skill-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    onAddSkill({ id, name: "Nova perícia", attributeKey: "", points: 0, modifier: 0, locked: false })
  }

  function useDetermination() {
    if (!activeRoll || stats.determination <= 0) return
    const modified = applyDeterminationToRoll(activeRoll)
    setHistory((rolls) => rolls.map((roll) => roll.id === activeRoll.id ? modified : roll))
    setActiveRoll(modified)
    onStatsChange({ determination: stats.determination - 1 })
  }

  function useCasualty() {
    if (!activeRoll || stats.casualty <= 0) return
    const isChance = normalizeSkillName(activeRoll.skillName) === "acaso"
    const isCritical = activeRoll.outcome === "critical-success" || activeRoll.outcome === "critical-failure"
    if (!isChance && isCritical) return
    onStatsChange({ casualty: stats.casualty - 1 })
    performRoll(config, history, activeRoll, isChance)
  }

  const activeIsChance = normalizeSkillName(activeRoll?.skillName ?? "") === "acaso"
  const casualtyBlocked = !!activeRoll && !activeIsChance && (
    activeRoll.outcome === "critical-success" || activeRoll.outcome === "critical-failure"
  )
  const attributeValue = config.attributeKey ? calculateAttributeTest(attributes, config.attributeKey) : null

  return (
    <section aria-labelledby="character-skills-title" className="rounded-b-[27px] rounded-t-none border border-border bg-card p-4 shadow-sm sm:p-7">
      <header className="mb-6">
        <p id="character-skills-title" className="text-lg text-muted-foreground">Perícias e testes do personagem.</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Os testes, recursos e históricos são calculados e salvos somente neste navegador.
        </p>
      </header>

      <div className="grid gap-3 lg:grid-cols-2">
        <article className="rounded-[20px] border border-border bg-muted/30 p-3 sm:p-4">
          <h3 className="text-sm font-bold text-foreground">Teste rápido</h3>
          <p className="mt-1 text-xs text-muted-foreground">Informe o total do teste e role 2d10 sem abrir o resumo.</p>
          <div className="mt-3 flex gap-2">
            <EditableInteger value={quickTest} onChange={setQuickTest} label="Valor do teste rápido" className="h-11 flex-1 text-base font-semibold" />
            <button type="button" onClick={rollQuickTest} className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition hover:brightness-110" aria-label="Rolar teste rápido">
              <Dices className="size-5" />
            </button>
          </div>
          {quickResult && (
            <output className="mt-3 block rounded-xl border border-border bg-background/65 px-3 py-2 text-sm">
              <strong>{quickResult.label}</strong>
              <span className="ml-2 text-muted-foreground">({quickResult.diceRolls[0]} + {quickResult.diceRolls[1]} = {quickResult.diceSum})</span>
            </output>
          )}
        </article>

        <article className="rounded-[20px] border border-border bg-muted/30 p-3 sm:p-4">
          <h3 className="text-sm font-bold text-foreground">Entrada rápida</h3>
          <p className="mt-1 text-xs text-muted-foreground">Formato: Força+4 (lendário) ou Lâminas-2 (sorte).</p>
          <div className="mt-3 flex flex-col gap-2 min-[430px]:flex-row">
            <input
              type="text"
              value={quickExpression}
              maxLength={80}
              onChange={(event) => setQuickExpression(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.nativeEvent.isComposing) applyQuickExpression()
              }}
              placeholder="Força+4 (lendário)"
              aria-label="Entrada rápida de teste"
              className="h-11 min-w-0 flex-1 rounded-xl border border-input bg-background/65 px-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-ring focus:ring-2 focus:ring-ring/25"
            />
            <button type="button" onClick={applyQuickExpression} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-secondary px-4 text-sm font-semibold text-secondary-foreground transition hover:bg-accent">
              <WandSparkles className="size-4" /> Preencher
            </button>
          </div>
          {parserMessage && <p className="mt-2 text-xs text-muted-foreground">{parserMessage}</p>}
        </article>
      </div>

      <article className="mt-5 overflow-hidden rounded-[22px] border border-border bg-muted/25">
        <div className="flex flex-col gap-2 border-b border-border px-3 py-3 min-[430px]:flex-row min-[430px]:items-center min-[430px]:justify-between sm:px-4">
          <div>
            <h3 className="font-bold text-foreground">Perícias</h3>
            <p className="text-xs text-muted-foreground">Nível automático pelo total acumulado de pontos.</p>
          </div>
          <button type="button" onClick={addSkill} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-background px-3 text-sm font-semibold text-muted-foreground transition hover:text-foreground">
            <Plus className="size-4" /> Adicionar perícia
          </button>
        </div>

        <div className="space-y-2 p-2 sm:p-3">
          <div className="hidden grid-cols-[2.75rem_minmax(7rem,1.2fr)_3.75rem_3.5rem_minmax(7rem,1fr)_3.75rem_3.75rem_2.5rem] gap-2 px-2 text-center text-[0.62rem] uppercase tracking-wide text-muted-foreground md:grid">
            <span>Rolar</span><span>Nome</span><span>Teste</span><span>Nível</span><span>Atributo</span><span>Pontos</span><span>Mod.</span><span />
          </div>
          {skills.map((skill) => {
            const level = calculateSkillLevel(skill.points)
            const test = skill.attributeKey
              ? calculateAttributeTest(attributes, skill.attributeKey) + level + skill.modifier
              : null
            return (
              <div key={skill.id} className="grid grid-cols-6 items-end gap-2 rounded-[18px] border border-border bg-background/55 p-2 md:grid-cols-[2.75rem_minmax(7rem,1.2fr)_3.75rem_3.5rem_minmax(7rem,1fr)_3.75rem_3.75rem_2.5rem] md:items-center">
                <button
                  type="button"
                  onClick={() => rollListedSkill(skill)}
                  disabled={!skill.attributeKey}
                  aria-label={`Rolar teste de ${skill.name}`}
                  title={skill.attributeKey ? `Rolar ${skill.name}` : "Selecione um atributo para rolar"}
                  className="col-span-1 inline-flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-35 md:col-auto"
                >
                  <Dices className="size-4.5" />
                </button>
                <label className="col-span-4 min-w-0 md:col-auto">
                  <FieldLabel>Nome</FieldLabel>
                  <input
                    type="text"
                    value={skill.name}
                    maxLength={30}
                    readOnly={skill.locked}
                    onChange={(event) => onSkillChange(skill.id, { name: event.target.value.slice(0, 30) })}
                    aria-label="Nome da perícia"
                    className="h-10 w-full min-w-0 rounded-xl border border-input bg-background/65 px-3 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/25 read-only:cursor-default read-only:border-transparent read-only:bg-transparent read-only:font-semibold"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => onRemoveSkill(skill.id)}
                  disabled={skill.locked}
                  aria-label={`Remover ${skill.name}`}
                  title={skill.locked ? "Esta perícia padrão não pode ser removida" : `Remover ${skill.name}`}
                  className="col-span-1 inline-flex size-10 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-25 md:col-auto md:col-start-8 md:row-start-1"
                >
                  <Trash2 className="size-4" />
                </button>
                <label className="col-span-1 md:col-auto md:col-start-3">
                  <FieldLabel>Teste</FieldLabel>
                  {test === null
                    ? <output aria-label={`Teste de ${skill.name} indisponível`} className="flex h-10 w-full items-center justify-center rounded-xl border border-input bg-background/65 text-sm font-semibold text-muted-foreground">—</output>
                    : <EditableInteger value={test} label={`Teste de ${skill.name}`} readOnly className="w-full font-semibold" />}
                </label>
                <label className="col-span-1 md:col-auto">
                  <FieldLabel>Nível</FieldLabel>
                  <EditableInteger value={level} label={`Nível de ${skill.name}`} readOnly className="w-full" />
                </label>
                <label className="relative col-span-2 md:col-auto">
                  <FieldLabel>Atributo</FieldLabel>
                  <select
                    value={skill.attributeKey}
                    onChange={(event) => onSkillChange(skill.id, { attributeKey: event.target.value as SecondaryAttributeKey | "" })}
                    aria-label={`Atributo de ${skill.name}`}
                    className="h-10 w-full appearance-none rounded-xl border border-input bg-background/65 px-2 pr-7 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/25"
                  >
                    <option value="">Selecione</option>
                    {damageAttributes.map((attribute) => <option key={attribute.key} value={attribute.key}>{attribute.name}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute bottom-3 right-2 size-4 text-muted-foreground" />
                </label>
                <label className="col-span-1 md:col-auto">
                  <FieldLabel>Pontos</FieldLabel>
                  <EditableInteger value={skill.points} min={0} onChange={(points) => onSkillChange(skill.id, { points })} label={`Pontos de ${skill.name}`} className="w-full" />
                </label>
                <label className="col-span-1 md:col-auto">
                  <FieldLabel>Mod.</FieldLabel>
                  <EditableInteger value={skill.modifier} onChange={(modifier) => onSkillChange(skill.id, { modifier })} label={`Modificador de ${skill.name}`} className="w-full" />
                </label>
              </div>
            )
          })}
        </div>
      </article>

      <article ref={calculatorRef} tabIndex={-1} className="mt-5 scroll-mt-4 rounded-[22px] border border-border bg-muted/25 p-3 outline-none sm:p-5">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="size-4.5 text-primary" />
          <div>
            <h3 className="font-bold text-foreground">Calculadora de testes</h3>
            <p className="text-xs text-muted-foreground">A rolagem usa o atributo primário + secundário e todos os modificadores abaixo.</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <label className="relative min-w-0">
            <FieldLabel>Atributo</FieldLabel>
            <select
              value={config.attributeKey}
              onChange={(event) => changeConfig("attributeKey", event.target.value as SecondaryAttributeKey | "")}
              className="h-11 w-full appearance-none rounded-xl border border-input bg-background/65 px-3 pr-9 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/25"
            >
              <option value="">Selecione</option>
              {damageAttributes.map((attribute) => <option key={attribute.key} value={attribute.key}>{attribute.name}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute bottom-3.5 right-3 size-4 text-muted-foreground" />
            <span className="mt-1 block text-[0.65rem] text-muted-foreground">Valor: {attributeValue ?? "—"}</span>
          </label>
          <label className="min-w-0">
            <FieldLabel>Perícia (opcional)</FieldLabel>
            <input
              type="text"
              value={config.skillName}
              maxLength={30}
              onChange={(event) => {
                const name = event.target.value.slice(0, 30)
                const saved = findCharacterSkill(skills, name)
                setConfig((current) => ({
                  ...current,
                  skillName: name,
                  skillModifier: saved
                    ? calculateSkillModifier(saved)
                    : name.trim()
                      ? current.skillModifier
                      : 0,
                  attributeKey: saved?.attributeKey || current.attributeKey,
                }))
                clearRolls()
              }}
              className="h-11 w-full rounded-xl border border-input bg-background/65 px-3 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/25"
            />
          </label>
          <label>
            <FieldLabel>Mod. da perícia</FieldLabel>
            <EditableInteger value={config.skillModifier} onChange={(value) => changeConfig("skillModifier", value)} label="Modificador da perícia" className="h-11 w-full" />
          </label>
          <label>
            <FieldLabel>Mod. do Mestre</FieldLabel>
            <EditableInteger value={config.masterModifier} onChange={(value) => changeConfig("masterModifier", value)} label="Modificador do Mestre" className="h-11 w-full" />
          </label>
          <label>
            <FieldLabel>Outros Mod.</FieldLabel>
            <EditableInteger value={config.otherModifiers} onChange={(value) => changeConfig("otherModifiers", value)} label="Outros modificadores" className="h-11 w-full" />
          </label>
          <div>
            <FieldLabel>Dado especial?</FieldLabel>
            <div className="grid h-11 grid-cols-2 overflow-hidden rounded-xl border border-input bg-background/65 p-1">
              <button type="button" onClick={() => changeConfig("specialDieId", "none")} className={cn("rounded-lg text-sm font-semibold transition", config.specialDieId === "none" ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:text-foreground")}>Não</button>
              <button type="button" onClick={() => changeConfig("specialDieId", config.specialDieId === "none" ? "luck" : config.specialDieId)} className={cn("rounded-lg text-sm font-semibold transition", config.specialDieId !== "none" ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:text-foreground")}>Sim</button>
            </div>
          </div>
          {config.specialDieId !== "none" && (
            <label className="relative min-w-0">
              <FieldLabel>Selecionar dado especial</FieldLabel>
              <select
                value={config.specialDieId}
                onChange={(event) => changeConfig("specialDieId", event.target.value as SpecialDieId)}
                className="h-11 w-full appearance-none rounded-xl border border-input bg-background/65 px-3 pr-9 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/25"
              >
                {specialDice.filter((die) => die.id !== "none").map((die) => <option key={die.id} value={die.id}>{die.label}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute bottom-3.5 right-3 size-4 text-muted-foreground" />
            </label>
          )}
        </div>

        <button
          type="button"
          onClick={() => performRoll()}
          disabled={!config.attributeKey}
          className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 font-bold text-primary-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
        >
          <Dices className="size-5" /> Rolar teste
        </button>
        {!config.attributeKey && <p className="mt-2 text-xs text-destructive">Selecione um atributo para habilitar a rolagem.</p>}
      </article>

      {activeRoll && (
        <article className={cn("mt-5 rounded-[22px] border p-4 sm:p-5", resultTone(activeRoll.outcome))}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] opacity-75">Resultado</p>
              <h3 className="mt-1 text-2xl font-black">{formatSkillRollOutcome(activeRoll)}</h3>
              <p className="mt-1 text-sm opacity-80">Dados: {activeRoll.diceRolls[0]} + {activeRoll.diceRolls[1]} = {activeRoll.diceSum}</p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs sm:min-w-64">
              <span className="rounded-xl bg-background/45 px-2 py-2"><small className="block opacity-70">Base</small><strong>{activeRoll.baseTest}</strong></span>
              <span className="rounded-xl bg-background/45 px-2 py-2"><small className="block opacity-70">Mod.</small><strong>{activeRoll.totalModifiers >= 0 ? "+" : ""}{activeRoll.totalModifiers}</strong></span>
              <span className="rounded-xl bg-background/45 px-2 py-2"><small className="block opacity-70">Total</small><strong>{activeRoll.totalTest}</strong></span>
            </div>
          </div>

          <details className="mt-4 rounded-xl bg-background/45 px-3 py-2 text-sm">
            <summary className="cursor-pointer font-semibold">Resumo dos cálculos</summary>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-4">
              <div><dt className="opacity-65">Teste base</dt><dd className="font-bold">{activeRoll.baseTest}</dd></div>
              <div><dt className="opacity-65">Total de Mod.</dt><dd className="font-bold">{activeRoll.totalModifiers >= 0 ? "+" : ""}{activeRoll.totalModifiers}</dd></div>
              <div><dt className="opacity-65">Teste total</dt><dd className="font-bold">{activeRoll.totalTest}</dd></div>
              <div><dt className="opacity-65">Margem</dt><dd className="font-bold">{activeRoll.margin >= 0 ? "+" : ""}{activeRoll.margin}</dd></div>
            </dl>
          </details>

          {(stats.determination > 0 || stats.casualty > 0) && (
            <div className="mt-4 flex flex-col gap-2 min-[430px]:flex-row">
              {stats.determination > 0 && (
                <button type="button" onClick={useDetermination} className="inline-flex h-10 items-center justify-center rounded-xl bg-background/55 px-3 text-sm font-semibold transition hover:bg-background">
                  Usar Determinação ({stats.determination})
                </button>
              )}
              {stats.casualty > 0 && (
                <button
                  type="button"
                  onClick={useCasualty}
                  disabled={casualtyBlocked}
                  title={casualtyBlocked ? "Críticos só podem ser refeitos em testes de Acaso" : "Rolar novamente usando Casualidade"}
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-background/55 px-3 text-sm font-semibold transition hover:bg-background disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Usar Casualidade ({stats.casualty})
                </button>
              )}
            </div>
          )}
        </article>
      )}

      {history.length > 0 && (
        <article className="mt-5 rounded-[22px] border border-border bg-muted/25 p-3 sm:p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="inline-flex items-center gap-2 font-bold"><History className="size-4" /> Histórico</h3>
            <span className="text-xs text-muted-foreground">{history.length}/{historyLimit(history)}</span>
          </div>
          <ol className="mt-3 space-y-2">
            {history.map((roll) => (
              <li key={roll.id} className={cn("rounded-xl border px-3 py-2 text-sm", roll.id === activeRoll?.id ? "border-primary/55 bg-primary/10" : "border-border bg-background/55")}>
                <strong>{formatSkillRollOutcome(roll)}</strong>
                <span className="ml-2 text-muted-foreground">({roll.diceRolls[0]} + {roll.diceRolls[1]} = {roll.diceSum})</span>
              </li>
            ))}
          </ol>
        </article>
      )}
    </section>
  )
}
