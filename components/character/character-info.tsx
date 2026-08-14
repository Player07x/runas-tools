"use client"

import { ChevronDown } from "lucide-react"
import type { CharacterInfo as CharacterInfoType } from "@/types/character"
import { cn } from "@/lib/utils"

interface Props {
  name: string
  info: CharacterInfoType
  onNameChange: (value: string) => void
  onInfoChange: (key: keyof CharacterInfoType, value: string) => void
}

interface FieldProps {
  label: string
  value: string
  onChange?: (value: string) => void
  required?: boolean
  maxLength?: number
  inputMode?: "text" | "numeric" | "decimal"
  min?: number
  max?: number
  step?: number
  readOnly?: boolean
  className?: string
  inputClassName?: string
  placeholder?: string
}

function Field({
  label,
  value,
  onChange,
  required,
  maxLength,
  inputMode = "text",
  min,
  max,
  step,
  readOnly,
  className,
  inputClassName,
  placeholder,
}: FieldProps) {
  const type = inputMode === "text" ? "text" : "number"
  return (
    <label className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <span className="px-1 text-sm font-medium leading-tight text-panel-muted">
        {label}
        {required && <span className="ml-1 text-highlight" aria-label="obrigatório">*</span>}
      </span>
      <input
        type={type}
        value={value}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        required={required}
        maxLength={maxLength}
        inputMode={inputMode}
        min={min}
        max={max}
        step={step}
        readOnly={readOnly}
        placeholder={placeholder}
        className={cn(
          "h-11 min-w-0 rounded-xl border border-panel-border/35 bg-panel-input px-3.5 text-sm text-white outline-none transition focus:border-highlight/70 focus:ring-3 focus:ring-highlight/15 read-only:cursor-default read-only:bg-panel-input/65 read-only:text-panel-muted",
          inputClassName,
        )}
      />
    </label>
  )
}

function Select({
  label,
  value,
  onChange,
  options,
  required,
  className,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  required?: boolean
  className?: string
}) {
  return (
    <label className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <span className="px-1 text-sm font-medium leading-tight text-panel-muted">
        {label}
        {required && <span className="ml-1 text-highlight" aria-label="obrigatório">*</span>}
      </span>
      <span className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required={required}
          className="h-11 w-full appearance-none rounded-xl border border-panel-border/35 bg-panel-input px-3.5 pr-10 text-sm text-white outline-none transition focus:border-highlight/70 focus:ring-3 focus:ring-highlight/15"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-panel-muted" />
      </span>
    </label>
  )
}

export function CharacterInfo({ name, info, onNameChange, onInfoChange }: Props) {
  const raceOptions = [
    { value: "Personalizado", label: "Personalizado" },
    ...(info.race && info.race !== "Personalizado" ? [{ value: info.race, label: info.race }] : []),
  ]

  return (
    <section aria-labelledby="character-information-title" className="rounded-2xl border border-panel-border/45 bg-panel-elevated p-4 shadow-lg sm:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 id="character-information-title" className="text-base font-bold text-white">Informações gerais</h3>
          <p className="mt-1 text-sm text-panel-muted">Dados gerais do personagem.</p>
        </div>
        <div className="flex items-center justify-end gap-3">
          <span className="text-right text-xs font-semibold uppercase leading-tight tracking-wide text-panel-muted">Ano<br />Atual</span>
          <input
            aria-label="Ano atual"
            type="number"
            inputMode="numeric"
            value={info.currentYear}
            onChange={(event) => onInfoChange("currentYear", event.target.value)}
            className="size-14 rounded-full border-2 border-transparent bg-highlight text-center text-lg font-bold text-highlight-foreground outline-none shadow-md focus:border-white"
          />
          <span className="relative">
            <select
              aria-label="Calendário"
              value={info.calendar}
              onChange={(event) => onInfoChange("calendar", event.target.value)}
              className="h-11 appearance-none rounded-xl border border-panel-border/35 bg-panel-input pl-3.5 pr-9 text-sm text-panel-muted outline-none focus:border-highlight/70 focus:ring-3 focus:ring-highlight/15"
            >
              <option value="logi">Logi</option>
              <option value="ce">C.E.</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-panel-muted" />
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
        <Field label="Nome" value={name} onChange={onNameChange} maxLength={80} required className="sm:col-span-2" />

        <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-[minmax(0,1fr)_minmax(8rem,0.65fr)] min-[480px]:gap-0">
          <Select label="Raça" value={info.race} onChange={(value) => onInfoChange("race", value)} options={raceOptions} required />
          <Field label="Espécie" value={info.species} onChange={(value) => onInfoChange("species", value)} maxLength={20} inputClassName="min-[480px]:rounded-l-none" />
        </div>
        <Field label="Ofício" value={info.profession} onChange={(value) => onInfoChange("profession", value)} maxLength={30} />

        <Field label="Tamanho (m)" value={info.size} onChange={(value) => onInfoChange("size", value)} inputMode="decimal" min={0.01} step={0.01} required />
        <div className="grid grid-cols-[minmax(0,1fr)_6rem] gap-3">
          <Field label="Modificador de Tamanho (MT)" value={info.sizeModifier} readOnly />
          <Field label="Bônus" value={info.sizeModifierBonus} onChange={(value) => onInfoChange("sizeModifierBonus", value)} inputMode="numeric" step={1} />
        </div>

        <Field label="Peso (kg)" value={info.weight} onChange={(value) => onInfoChange("weight", value)} inputMode="decimal" min={0.01} step={0.01} required />
        <div className="grid grid-cols-[minmax(0,1fr)_6rem] gap-3">
          <Field label="Multiplicador de Peso (MP)" value={info.weightMultiplier} readOnly placeholder="Tabela não fornecida" />
          <Field label="Bônus" value={info.weightMultiplierBonus} onChange={(value) => onInfoChange("weightMultiplierBonus", value)} inputMode="decimal" step={0.1} />
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_6rem] gap-3">
          <Field label="Nascimento" value={info.birthDate} onChange={(value) => onInfoChange("birthDate", value)} maxLength={20} required placeholder="400/12/01 Logi" />
          <Field label="Idade" value={info.age} readOnly />
        </div>
        <Field label="Região" value={info.region} onChange={(value) => onInfoChange("region", value)} maxLength={40} />

        <Select
          label="Classe"
          value={info.characterClass}
          onChange={(value) => onInfoChange("characterClass", value)}
          options={[
            { value: "", label: "Selecione" },
            { value: "Reforço", label: "Reforço" },
            { value: "Ampliação", label: "Ampliação" },
            { value: "Invocação", label: "Invocação" },
          ]}
        />
        <Field label="Arquétipo" value={info.archetype} onChange={(value) => onInfoChange("archetype", value)} maxLength={40} />

        <Field label="Afinidade" value={info.affinity} readOnly />
        <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-[minmax(0,1fr)_minmax(8rem,0.85fr)]">
          <Field label="Eficiência (%)" value={info.efficiency} readOnly />
          <Field label="Essências" value={info.essences} onChange={(value) => onInfoChange("essences", value)} inputMode="numeric" min={0} step={1} required />
        </div>

        <Field label="Divindade" value={info.deity} onChange={(value) => onInfoChange("deity", value)} maxLength={40} />
        <div className="grid grid-cols-[minmax(0,1fr)_6rem] gap-3">
          <Field label="Alinhamento" value={info.alignment} readOnly />
          <Field label="Carma" value={info.karma} onChange={(value) => onInfoChange("karma", value)} inputMode="numeric" min={-60} max={60} step={1} required />
        </div>

        <Field label="Legado" value={info.legacy} onChange={(value) => onInfoChange("legacy", value)} maxLength={40} required />
        <div className="grid grid-cols-[minmax(0,1fr)_6rem] gap-3">
          <Field label="Raridade" value={info.legacyRarity} readOnly />
          <Field label="Pontos" value={info.legacyPoints} onChange={(value) => onInfoChange("legacyPoints", value)} inputMode="numeric" min={0} step={1} required />
        </div>
      </div>
      <p className="mt-5 text-xs text-panel-muted"><span className="text-highlight">*</span> Campo obrigatório</p>
    </section>
  )
}
