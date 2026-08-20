"use client"

import { useRouter } from "next/navigation"
import { ChevronDown, Dices, Plus, Trash2 } from "lucide-react"
import type { CharacterAttributes, CharacterSkill, SecondaryAttributeKey } from "@/types/character"
import { damageAttributes } from "@/data/attributes"
import { calculateAttributeTest, calculateSkillLevel } from "@/lib/skillCalculations"
import { SkillIntegerInput } from "@/components/skill-test/skill-integer-input"
import { useCharacterPanel } from "./character-panel"

interface Props {
  attributes: CharacterAttributes
  skills: CharacterSkill[]
  onSkillChange: (id: string, updates: Partial<CharacterSkill>) => void
  onAddSkill: (skill: CharacterSkill) => void
  onRemoveSkill: (id: string) => void
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="mb-1 block text-[0.62rem] font-medium uppercase tracking-wide text-muted-foreground">{children}</span>
}

export function CharacterSkills({ attributes, skills, onSkillChange, onAddSkill, onRemoveSkill }: Props) {
  const router = useRouter()
  const { close } = useCharacterPanel()

  function openSkillCalculator(skill: CharacterSkill) {
    if (!skill.attributeKey) return
    close()
    router.push(`/calculadora-testes?skill=${encodeURIComponent(skill.id)}&roll=${Date.now()}`)
  }

  function addSkill() {
    const id = typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `skill-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    onAddSkill({ id, name: "Nova perícia", attributeKey: "", points: 0, modifier: 0, locked: false })
  }

  return (
    <section aria-labelledby="character-skills-title" className="rounded-b-[27px] rounded-t-none border border-border bg-card p-4 shadow-sm sm:p-7">
      <header className="mb-5">
        <p id="character-skills-title" className="text-lg text-muted-foreground">Perícias do personagem.</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Edite as perícias abaixo ou use o dado para abrir a Calculadora de Testes com os dados preenchidos e a rolagem pronta.
        </p>
      </header>

      <article className="overflow-hidden rounded-[22px] border border-border bg-muted/25">
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
                  onClick={() => openSkillCalculator(skill)}
                  disabled={!skill.attributeKey}
                  aria-label={`Abrir Calculadora de Testes e rolar ${skill.name}`}
                  title={skill.attributeKey ? `Abrir calculadora e rolar ${skill.name}` : "Selecione um atributo para rolar"}
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
                    : <SkillIntegerInput value={test} label={`Teste de ${skill.name}`} readOnly className="w-full font-semibold" />}
                </label>
                <label className="col-span-1 md:col-auto">
                  <FieldLabel>Nível</FieldLabel>
                  <SkillIntegerInput value={level} label={`Nível de ${skill.name}`} readOnly className="w-full" />
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
                  <SkillIntegerInput value={skill.points} min={0} onChange={(points) => onSkillChange(skill.id, { points })} label={`Pontos de ${skill.name}`} className="w-full" />
                </label>
                <label className="col-span-1 md:col-auto">
                  <FieldLabel>Mod.</FieldLabel>
                  <SkillIntegerInput value={skill.modifier} onChange={(modifier) => onSkillChange(skill.id, { modifier })} label={`Modificador de ${skill.name}`} className="w-full" />
                </label>
              </div>
            )
          })}
        </div>
      </article>
    </section>
  )
}
