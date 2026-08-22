"use client"

import { useMemo, useState } from "react"
import type { Character } from "@/types/character"
import { calculateCharacterStatSnapshot } from "@/lib/characterStatCalculations"
import { calculateAttributeTest, calculateSkillLevel, calculateSkillModifier } from "@/lib/skillCalculations"
import { calculateBondQuality, calculateBondTest, formatSigned } from "@/lib/bondCalculations"
import { calculateEquippedArmorDefense, calculateItemRealWeight, formatWeight, inventoryTypeLabel, inventoryUsageLabel, itemRarity } from "@/lib/inventoryCalculations"
import { getAttributeDef } from "@/data/attributes"

type Tab = "info" | "stats" | "skills" | "bonds" | "abilities" | "inventory" | "spells" | "notes"

const tabs: { id: Tab; label: string }[] = [
  { id: "info", label: "Informação" },
  { id: "stats", label: "Estatísticas" },
  { id: "skills", label: "Perícias" },
  { id: "bonds", label: "Vínculos" },
  { id: "abilities", label: "Habilidades" },
  { id: "inventory", label: "Inventário" },
  { id: "spells", label: "Magias" },
  { id: "notes", label: "Anotações" },
]

function plainText(value: string): string {
  return value.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim()
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="rounded-xl border border-border bg-background/55 p-3"><span className="text-xs text-muted-foreground">{label}</span><div className="mt-1 text-sm font-semibold text-foreground">{value || "—"}</div></div>
}

export function CharacterReadonlySheet({ character }: { character: Character }) {
  const [activeTab, setActiveTab] = useState<Tab>("info")
  const snapshot = useMemo(() => calculateCharacterStatSnapshot(character.attributes, character.info, character.stats, character.skills, character.abilities), [character])
  const defense = calculateEquippedArmorDefense(character.inventory)

  return <div>
    <div className="grid grid-cols-4 gap-1 rounded-[18px] bg-muted p-1 sm:grid-cols-8" role="tablist" aria-label="Seções da ficha em modo leitura">
      {tabs.map((tab) => <button key={tab.id} type="button" role="tab" aria-selected={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} className={`min-h-10 rounded-xl px-1 text-xs font-bold transition ${activeTab === tab.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>{tab.label}</button>)}
    </div>

    <div className="mt-4">
      {activeTab === "info" && <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><Field label="Nome" value={character.name} /><Field label="Raça" value={character.info.race} /><Field label="Espécie" value={character.info.species} /><Field label="Ofício" value={character.info.profession} /><Field label="Classe" value={character.info.characterClass} /><Field label="Arquétipo" value={character.info.archetype} /><Field label="Tamanho real" value={`${character.info.sizeReal} m`} /><Field label="MT" value={character.info.sizeModifier} /><Field label="Afinidade" value={character.info.affinity} /><Field label="Alinhamento" value={character.info.alignment} /><Field label="Região" value={character.info.region} /><Field label="Legado" value={character.info.legacy} /></div>}

      {activeTab === "stats" && <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Field label="PV" value={`${character.stats.pv} / ${snapshot.pvMax}`} /><Field label="PA" value={`${character.stats.pa} / ${snapshot.paMax}`} /><Field label="PE" value={`${character.stats.pe} / ${snapshot.peMax}`} />{character.stats.paExtra > 0 && <Field label="PA Extra" value={`${character.stats.paExtra} / ${snapshot.paExtraMax}`} />}<Field label="PE Temporário" value={`${character.stats.peTemporary} / ${snapshot.peTemporaryMax}`} /><Field label="Deslocamento" value={`${snapshot.movement} m`} /><Field label="Primeiras Impressões" value={formatSigned(snapshot.firstImpressions)} /><Field label="Carga" value={`${formatWeight(character.stats.currentLoad)} / ${formatWeight(snapshot.loadCapacity)} kg`} /><Field label="RDF da armadura" value={defense.rdf} /><Field label="RDM da armadura" value={defense.rdm} /><Field label="Determinação" value={`${character.stats.determination} / ${snapshot.determinationMax}`} /><Field label="Casualidade" value={`${character.stats.casualty} / ${snapshot.casualtyMax}`} /></div>}

      {activeTab === "skills" && <ListEmpty empty={character.skills.length === 0} label="Nenhuma perícia cadastrada."><div className="space-y-2">{character.skills.map((skill) => { const test = skill.attributeKey ? calculateAttributeTest(character.attributes, skill.attributeKey) + calculateSkillModifier(skill) : null; return <article key={skill.id} className="grid gap-2 rounded-xl border border-border bg-background/55 p-3 sm:grid-cols-[minmax(8rem,1fr)_5rem_5rem_minmax(7rem,1fr)_4rem]"><strong>{skill.name}</strong><span className="text-sm">Teste {test ?? "—"}</span><span className="text-sm">Nível {calculateSkillLevel(skill.points)}</span><span className="text-sm text-muted-foreground">{skill.attributeKey ? getAttributeDef(skill.attributeKey)?.name : "Sem atributo"}</span><span className="text-sm">{formatSigned(skill.modifier)}</span></article>})}</div></ListEmpty>}

      {activeTab === "bonds" && <ListEmpty empty={character.bonds.length === 0} label="Nenhum vínculo cadastrado."><div className="space-y-2">{character.bonds.map((bond) => { const quality = calculateBondQuality(bond.points); return <article key={bond.id} className="grid gap-2 rounded-xl border border-border bg-background/55 p-3 sm:grid-cols-[minmax(8rem,1fr)_5rem_minmax(7rem,1fr)_4rem]"><strong>{bond.name}</strong><span className="text-sm">Teste {calculateBondTest(character.attributes, character.stats, bond)}</span><span className="text-sm text-muted-foreground">{quality.name}</span><span className="text-sm">{formatSigned(quality.level)}</span></article>})}</div></ListEmpty>}

      {activeTab === "abilities" && <ListEmpty empty={character.abilities.length === 0} label="Nenhuma habilidade cadastrada."><div className="grid gap-3 sm:grid-cols-2">{character.abilities.map((ability) => <article key={ability.id} className="rounded-xl border border-border bg-background/55 p-4"><span className="text-xs font-semibold text-muted-foreground">{ability.category || "Sem categoria"}</span><h3 className="mt-1 font-bold">{ability.name}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{plainText(ability.description) || "Sem descrição"}</p><p className="mt-2 text-xs font-semibold">Custo: {ability.costType === "none" ? "Nenhum" : ability.costType === "other" ? ability.costText : `${ability.costValue} ${ability.costType}`}</p></article>)}</div></ListEmpty>}

      {activeTab === "inventory" && <ListEmpty empty={character.inventory.length === 0} label="Nenhum item cadastrado."><div className="space-y-2">{character.inventory.map((item) => <article key={item.id} className="grid gap-2 rounded-xl border border-border bg-background/55 p-3 sm:grid-cols-[7rem_minmax(8rem,1fr)_7rem_5rem_minmax(8rem,1fr)]"><span className="text-sm font-semibold text-muted-foreground">{inventoryUsageLabel(item.usage)}</span><strong>{item.name}</strong><span className="text-sm">{inventoryTypeLabel(item.type)}</span><span className="text-sm">{formatWeight(calculateItemRealWeight(item, character.info.scaleMultiplier))} kg</span><span className="text-sm text-muted-foreground">{itemRarity(item.bondPoints)}{item.damage ? ` · ${item.damage}` : ""}</span></article>)}</div></ListEmpty>}

      {activeTab === "spells" && <ListEmpty empty={character.spells.length === 0} label="Nenhuma magia cadastrada."><div className="grid gap-3 sm:grid-cols-2">{character.spells.map((spell) => <article key={spell.id} className="rounded-xl border border-border bg-background/55 p-4"><span className="text-xs font-semibold text-muted-foreground">{spell.magicType} · {spell.rangeType}</span><h3 className="mt-1 font-bold">{spell.name}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{plainText(spell.description) || "Sem descrição"}</p><p className="mt-2 text-xs font-semibold">Duração: {spell.duration || "—"} · Conjuração: {spell.castingSkill || "—"}</p></article>)}</div></ListEmpty>}

      {activeTab === "notes" && <ListEmpty empty={character.notes.length === 0} label="Nenhuma anotação cadastrada."><div className="grid gap-3 sm:grid-cols-2">{character.notes.map((note) => <article key={note.id} className="rounded-xl border border-border bg-background/55 p-4"><span className="text-xs font-semibold text-muted-foreground">{note.category || "Sem categoria"} · {note.date || "Sem data"}</span><h3 className="mt-1 font-bold">{note.name}</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{plainText(note.description) || "Sem descrição"}</p></article>)}</div></ListEmpty>}
    </div>
  </div>
}

function ListEmpty({ empty, label, children }: { empty: boolean; label: string; children: React.ReactNode }) {
  return empty ? <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">{label}</p> : children
}
