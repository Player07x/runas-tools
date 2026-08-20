"use client"

import type {
  AttributeKey,
  CharacterCalendar,
  CharacterInfo as InfoType,
  CharacterSkill,
  CharacterStats as StatsType,
} from "@/types/character"
import { attributeGroups } from "@/data/attributes"
import { calculateLoadBase, convertCalendarYear, deriveCharacterInfo, modifierToNumber } from "@/lib/characterCalculations"
import { calculateCharacterStatSnapshot } from "@/lib/characterStatCalculations"
import { cn } from "@/lib/utils"
import { useCharacter } from "./character-provider"
import { CharacterInfo } from "./character-info"
import { CharacterStats } from "./character-stats"
import { CharacterSkills } from "./character-skills"
import { CharacterActions } from "./character-actions"
import { SaveIndicator } from "./save-indicator"

export type CharacterTab = "information" | "statistics" | "skills"

interface CharacterSheetProps {
  activeTab: CharacterTab
  onActiveTabChange: (tab: CharacterTab) => void
}

const unavailableTabs = ["Vínculos", "Inventário", "Magias", "Anotações"]
const availableTabs: { id: CharacterTab | "abilities"; label: string }[] = [
  { id: "information", label: "Informação" },
  { id: "statistics", label: "Estatísticas" },
  { id: "skills", label: "Perícias" },
  { id: "abilities", label: "Habilidades" },
]

export function CharacterSheet({ activeTab, onActiveTabChange }: CharacterSheetProps) {
  const { character, updateCharacter, isReady } = useCharacter()

  function setName(value: string) {
    updateCharacter((prev) => ({ ...prev, name: value.slice(0, 80) }))
  }

  function setInfo(key: keyof InfoType, value: string) {
    updateCharacter((prev) => {
      let nextInfo: InfoType = { ...prev.info, [key]: value }
      if (key === "calendar" && (value === "logi" || value === "ce")) {
        nextInfo = {
          ...nextInfo,
          currentYear: convertCalendarYear(prev.info.currentYear, prev.info.calendar, value as CharacterCalendar),
          calendar: value,
        }
      }
      nextInfo = deriveCharacterInfo(nextInfo)
      nextInfo.loadBase = calculateLoadBase(prev.attributes.physical, prev.attributes.strength, nextInfo.scaleMultiplier)
      const stats = { ...prev.stats, mt: modifierToNumber(nextInfo.sizeModifier) }
      const snapshot = calculateCharacterStatSnapshot(prev.attributes, nextInfo, stats, prev.skills)
      stats.paExtra = Math.min(stats.paExtra, snapshot.paExtraMax)
      stats.peTemporary = Math.min(stats.peTemporary, snapshot.peMax)
      return {
        ...prev,
        info: nextInfo,
        stats,
      }
    })
  }

  function setAttribute(key: AttributeKey, value: number) {
    updateCharacter((prev) => {
      const attributes = { ...prev.attributes }
      const group = attributeGroups.find((item) => item.primary.key === key || item.attributes.some((attr) => attr.key === key))
      if (!group) return prev
      if (group.primary.key === key) {
        const primary = Math.max(1, Math.floor(value || 0))
        attributes[key] = primary
        for (const attribute of group.attributes) attributes[attribute.key] = Math.min(attributes[attribute.key], primary)
      } else {
        attributes[key] = Math.min(attributes[group.primary.key], Math.max(0, Math.floor(value || 0)))
      }
      const info = {
        ...prev.info,
        loadBase: calculateLoadBase(attributes.physical, attributes.strength, prev.info.scaleMultiplier),
      }
      const snapshot = calculateCharacterStatSnapshot(attributes, info, prev.stats, prev.skills)
      return {
        ...prev,
        attributes,
        info,
        stats: {
          ...prev.stats,
          paExtra: Math.min(prev.stats.paExtra, snapshot.paExtraMax),
          peTemporary: Math.min(prev.stats.peTemporary, snapshot.peMax),
          focusCurrent: Math.min(prev.stats.focusCurrent, snapshot.focusMaximum),
        },
      }
    })
  }

  function setStats(updates: Partial<StatsType>) {
    updateCharacter((prev) => {
      const stats = { ...prev.stats, ...updates }
      const snapshot = calculateCharacterStatSnapshot(prev.attributes, prev.info, stats, prev.skills)
      stats.paExtra = Math.min(snapshot.paExtraMax, Math.max(0, stats.paExtra))
      stats.peTemporary = Math.min(snapshot.peMax, Math.max(0, stats.peTemporary))
      stats.focusCurrent = Math.min(snapshot.focusMaximum, Math.max(0, stats.focusCurrent))
      return { ...prev, stats }
    })
  }

  function setSkill(id: string, updates: Partial<CharacterSkill>) {
    updateCharacter((prev) => {
      const skills = prev.skills.map((skill) => skill.id === id ? { ...skill, ...updates } : skill)
      const snapshot = calculateCharacterStatSnapshot(prev.attributes, prev.info, prev.stats, skills)
      return {
        ...prev,
        skills,
        stats: { ...prev.stats, focusCurrent: Math.min(prev.stats.focusCurrent, snapshot.focusMaximum) },
      }
    })
  }

  function addSkill(skill: CharacterSkill) {
    updateCharacter((prev) => ({ ...prev, skills: [...prev.skills, skill] }))
  }

  function removeSkill(id: string) {
    updateCharacter((prev) => ({ ...prev, skills: prev.skills.filter((skill) => skill.locked || skill.id !== id) }))
  }

  if (!isReady) {
    return <p className="px-4 py-8 text-sm text-muted-foreground">Carregando ficha…</p>
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-[20px] border border-border bg-card px-3 py-2.5 shadow-sm sm:rounded-[27px] sm:px-7 sm:py-4">
        <div className="flex items-center justify-between gap-2 sm:block">
          <SaveIndicator />
          <CharacterActions />
        </div>
      </section>

      <div className="relative">
        <div className="relative z-20 grid grid-cols-3 gap-x-px bg-muted sm:hidden" role="tablist" aria-label="Seções da ficha">
          {availableTabs.filter((tab) => tab.id !== "abilities").map((tab) => {
            const isActive = tab.id === activeTab
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onActiveTabChange(tab.id as CharacterTab)}
                aria-selected={isActive}
                role="tab"
                className={cn(
                  "relative h-14 min-w-0 rounded-t-[20px] border-x border-t border-transparent px-1 text-sm font-bold transition-colors",
                  isActive
                    ? "z-10 border-border bg-card text-foreground shadow-sm after:absolute after:-bottom-0.5 after:inset-x-0 after:h-1 after:bg-card"
                    : "bg-secondary text-secondary-foreground active:bg-accent",
                )}
              >
                <span className="block truncate">{tab.label}</span>
              </button>
            )
          })}
        </div>

        <div className="relative z-0 -mb-px hidden grid-cols-4 gap-x-px sm:grid">
          {unavailableTabs.map((label) => (
            <button
              key={label}
              type="button"
              disabled
              title="Ainda não disponível"
              className="h-14 rounded-t-[20px] border-t border-border bg-muted px-3 pb-px text-base font-bold text-muted-foreground disabled:cursor-not-allowed sm:h-12 sm:rounded-t-[27px] sm:px-2"
            >
              {label}
            </button>
          ))}
        </div>
        <div className="relative z-20 hidden grid-cols-4 gap-x-px bg-muted sm:grid" role="tablist" aria-label="Seções da ficha">
            {availableTabs.map((tab) => {
              const isAvailable = tab.id !== "abilities"
              const isActive = tab.id === activeTab
              return (
                <button
                  key={tab.id}
                  type="button"
                  disabled={!isAvailable}
                  onClick={isAvailable ? () => onActiveTabChange(tab.id as CharacterTab) : undefined}
                  aria-selected={isActive}
                  role="tab"
                  className={cn(
                    "relative h-14 rounded-t-[20px] border-x border-t border-transparent px-3 text-base font-bold transition-colors sm:h-12 sm:rounded-t-[27px] sm:px-2",
                    isActive
                      ? "z-10 border-border bg-card text-foreground shadow-sm after:absolute after:-bottom-0.5 after:inset-x-0 after:h-1 after:bg-card"
                      : "bg-secondary text-secondary-foreground hover:bg-accent",
                    !isAvailable && "cursor-not-allowed opacity-60 hover:bg-secondary",
                  )}
                >
                  {tab.label}
                </button>
              )
            })}
        </div>

        <div role="tabpanel" className="relative z-10 -mt-px">
          {activeTab === "information" && (
            <CharacterInfo name={character.name} info={character.info} onNameChange={setName} onInfoChange={setInfo} />
          )}
          {activeTab === "statistics" && (
            <CharacterStats
              attributes={character.attributes}
              info={character.info}
              stats={character.stats}
              skills={character.skills}
              onAttributeChange={setAttribute}
              onStatsChange={setStats}
            />
          )}
          {activeTab === "skills" && (
            <CharacterSkills
              attributes={character.attributes}
              skills={character.skills}
              onSkillChange={setSkill}
              onAddSkill={addSkill}
              onRemoveSkill={removeSkill}
            />
          )}
        </div>
      </div>
    </div>
  )
}
