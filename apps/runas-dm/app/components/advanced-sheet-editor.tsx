"use client"

import { useState } from "react"
import { ChevronDown, Plus, Trash2 } from "lucide-react"
import { attributeGroups } from "@runas/core/data/attributes"
import { characterElements } from "@runas/core/data/elements"
import { inventoryTypeOptions, inventoryUsageOptions } from "@runas/core/lib/inventoryCalculations"
import { synchronizeCharacterDerivedValues } from "@runas/core/lib/characterSynchronization"
import { calculateCharacterStatSnapshot } from "@runas/core/lib/characterStatCalculations"
import { masteryImprovementOptions } from "@runas/core/lib/masteryImprovements"
import type {
  AttributeKey, Character, CharacterAbility, CharacterBond, CharacterInfo, CharacterInventoryItem,
  CharacterNote, CharacterSkill, CharacterSpell, SecondaryAttributeKey,
} from "@runas/core/types/character"
import { AttributeBands } from "./attribute-bands"

type AdvancedTab = "information" | "statistics" | "skills" | "bonds" | "abilities" | "inventory" | "spells" | "notes"

const tabs: Array<{ id: AdvancedTab; label: string }> = [
  { id: "information", label: "Informações" }, { id: "statistics", label: "Estatísticas" },
  { id: "skills", label: "Perícias" }, { id: "bonds", label: "Vínculos" },
  { id: "abilities", label: "Habilidades" }, { id: "inventory", label: "Inventário" },
  { id: "spells", label: "Magias" }, { id: "notes", label: "Anotações" },
]

const costResourceOptions = [
  { value: "none", label: "Nenhum" }, { value: "other", label: "Outro" },
  { value: "pv", label: "PV" }, { value: "pa", label: "PA" }, { value: "pe", label: "PE" },
  { value: "paExtra", label: "PA extra" }, { value: "peTemporary", label: "PE temporário" },
]

const infoGroups: Array<{ title: string; hint: string; fields: Array<{ key: keyof CharacterInfo; label: string }> }> = [
  { title: "Origem e identidade", hint: "Quem é a criatura no mundo", fields: [
    { key: "currentYear", label: "Ano atual" }, { key: "race", label: "Raça" }, { key: "species", label: "Espécie" },
    { key: "profession", label: "Profissão" }, { key: "characterClass", label: "Classe" }, { key: "archetype", label: "Arquétipo" },
    { key: "birthDate", label: "Nascimento" }, { key: "age", label: "Idade" }, { key: "region", label: "Região" },
  ] },
  { title: "Essência e legado", hint: "Afinidade, destino e progressão", fields: [
    { key: "affinity", label: "Afinidade" }, { key: "efficiency", label: "Eficiência" }, { key: "alignment", label: "Alinhamento" },
    { key: "essences", label: "Essências" }, { key: "karma", label: "Karma" }, { key: "deity", label: "Divindade" },
    { key: "legacy", label: "Legado" }, { key: "legacyPoints", label: "Pontos de legado" }, { key: "legacyRarity", label: "Raridade do legado" },
  ] },
  { title: "Escala física", hint: "Tamanho, peso e capacidade de carga", fields: [
    { key: "sizeBase", label: "Tamanho base" }, { key: "sizeReal", label: "Tamanho real" }, { key: "sizeModifier", label: "Modificador de tamanho" },
    { key: "sizeModifierBonus", label: "Bônus de tamanho" }, { key: "weightBase", label: "Peso base" }, { key: "weightBonus", label: "Bônus de peso" },
    { key: "weightReal", label: "Peso real" }, { key: "scaleMultiplier", label: "Multiplicador de escala" }, { key: "loadBase", label: "Carga base" },
  ] },
]

function uid(prefix: string) { return `${prefix}-${crypto.randomUUID()}` }

export function AdvancedSheetEditor({ character, onChange }: { character: Character; onChange: (character: Character) => void }) {
  const [activeTab, setActiveTab] = useState<AdvancedTab>("information")
  function update(mutator: (draft: Character) => void) {
    const draft = structuredClone(character)
    mutator(draft)
    onChange(synchronizeCharacterDerivedValues(character, draft))
  }

  return <div className="full-sheet-editor">
    <nav className="full-sheet-tabs" aria-label="Seções da ficha completa">{tabs.map((tab) => <button key={tab.id} className={activeTab === tab.id ? "active" : ""} onClick={() => setActiveTab(tab.id)}>{tab.label}</button>)}</nav>
    <div className="full-sheet-content" data-section={activeTab}>
      {activeTab === "information" && <InformationSection character={character} update={update} />}
      {activeTab === "statistics" && <StatisticsSection character={character} update={update} />}
      {activeTab === "skills" && <SkillsSection items={character.skills} update={update} />}
      {activeTab === "bonds" && <BondsSection items={character.bonds} update={update} />}
      {activeTab === "abilities" && <AbilitiesSection items={character.abilities} update={update} />}
      {activeTab === "inventory" && <InventorySection items={character.inventory} skills={character.skills} update={update} />}
      {activeTab === "spells" && <SpellsSection items={character.spells} update={update} />}
      {activeTab === "notes" && <NotesSection items={character.notes} update={update} />}
    </div>
  </div>
}

type UpdateCharacter = (mutator: (draft: Character) => void) => void

function InformationSection({ character, update }: { character: Character; update: UpdateCharacter }) {
  return <AdvancedSection title="Informações" description="Identidade, origem, escala e progressão da criatura.">
    <div className="advanced-identity-hero"><div className={`advanced-portrait-rune ${character.portraitDataUrl ? "has-portrait" : ""}`} aria-hidden="true">{character.portraitDataUrl ? <img src={character.portraitDataUrl} alt="" /> : <span>{character.name.slice(0, 1) || "R"}</span>}</div><div className="advanced-identity-fields"><Field label="Nome da criatura" value={character.name} onChange={(value) => update((draft) => { draft.name = value })} /><Select label="Calendário" value={character.info.calendar} options={[{ value: "logi", label: "Logi" }, { value: "ce", label: "Élfico" }]} onChange={(value) => update((draft) => { draft.info.calendar = value as CharacterInfo["calendar"] })} /></div><div className="advanced-identity-mark"><span>Ficha completa</span><strong>{character.info.affinity || "Sem afinidade"}</strong><small>Eficiência {character.info.efficiency || "0"}%</small></div></div>
    <div className="advanced-info-board">{infoGroups.map((group) => <section className="advanced-info-card" key={group.title}><header><div><h4>{group.title}</h4><p>{group.hint}</p></div><span aria-hidden="true">◇</span></header><div className="advanced-field-grid">{group.fields.map((field) => <Field key={field.key} label={field.label} value={character.info[field.key]} onChange={(value) => update((draft) => { draft.info[field.key] = value as never })} />)}</div></section>)}</div>
  </AdvancedSection>
}

function StatisticsSection({ character, update }: { character: Character; update: UpdateCharacter }) {
  const snapshot = calculateCharacterStatSnapshot(character.attributes, character.info, character.stats, character.skills, character.abilities)
  function restoreStats() {
    update((draft) => {
      draft.stats.pv = snapshot.pvMax
      draft.stats.pa = snapshot.paMax
      draft.stats.paExtra = snapshot.paExtraMax
      draft.stats.pe = snapshot.peMax
      draft.stats.peTemporary = snapshot.peMax
      draft.stats.determination = snapshot.determinationMax
      draft.stats.casualty = snapshot.casualtyMax
      draft.stats.focusCurrent = snapshot.focusMaximum
    })
  }
  const statGroups: Array<{ title: string; hint: string; tone: string; fields: Array<{ key: keyof Character["stats"]; label: string }> }> = [
    { title: "Vitalidade", hint: "Vida atual e ajustes do máximo", tone: "vitality", fields: [
      { key: "pvBonus", label: "Modificador de PV máximo" }, { key: "pv", label: "PV atual" },
    ] },
    { title: "Proteção e energia", hint: "Recursos gastos durante o encontro", tone: "resources", fields: [
      { key: "paBonus", label: "Modificador de PA máximo" }, { key: "pa", label: "PA atual" },
      { key: "paExtraBonus", label: "Modificador de PA extra" }, { key: "paExtra", label: "PA extra atual" },
      { key: "peBonus", label: "Modificador de PE máximo" }, { key: "pe", label: "PE atual" },
      { key: "peTemporary", label: "PE temporário" },
    ] },
    { title: "Controle narrativo", hint: "Determinação, casualidade e foco", tone: "narrative", fields: [
      { key: "determinationBonus", label: "Modificador de determinação" }, { key: "determination", label: "Determinação atual" },
      { key: "casualtyBonus", label: "Modificador de casualidade" }, { key: "casualty", label: "Casualidade atual" },
      { key: "focusModifier", label: "Modificador de foco" }, { key: "focusCurrent", label: "Foco atual" },
    ] },
    { title: "Movimento e carga", hint: "Capacidade física e deslocamento", tone: "movement", fields: [
      { key: "loadBonus", label: "Modificador de carga máxima" }, { key: "currentLoad", label: "Carga atual" },
      { key: "movementBonus", label: "Modificador de deslocamento" },
    ] },
    { title: "Defesa e combate", hint: "Resistências, leituras e poder ofensivo", tone: "combat", fields: [
      { key: "armorRdf", label: "RDF da armadura" }, { key: "armorRdm", label: "RDM da armadura" },
      { key: "naturalRdf", label: "RDF natural" }, { key: "naturalRdm", label: "RDM natural" }, { key: "mt", label: "MT" },
      { key: "willModifier", label: "Modificador de vontade" }, { key: "chanceModifier", label: "Modificador de acaso" },
      { key: "perceptionModifier", label: "Modificador de percepção" }, { key: "firstImpressionsBonus", label: "Primeiras impressões" },
    ] },
  ]
  return <AdvancedSection title="Estatísticas" description="Atributos, recursos, defesas, elemento e efeitos.">
    <div className="statistics-banner"><span>Leitura de combate</span><strong>{character.info.race || "Criatura sem raça"}</strong><small>{character.info.affinity || "Sem afinidade"}</small><button className="restore-stats-button" onClick={restoreStats}>Restaurar estatísticas</button></div>
    <div className="derived-stat-grid"><DerivedStat label="PV máximo" value={snapshot.pvMax} /><DerivedStat label="PA máximo" value={snapshot.paMax} /><DerivedStat label="PE máximo" value={snapshot.peMax} /><DerivedStat label="Deslocamento" value={`${snapshot.movement} m`} /><DerivedStat label="Carga" value={snapshot.loadCapacity} /><DerivedStat label="Foco máximo" value={snapshot.focusMaximum} /></div>
    <h4 className="advanced-subtitle">Atributos</h4><AttributeBands attributes={character.attributes} onChange={(key: AttributeKey, value) => update((draft) => { draft.attributes[key] = value })} />
    <h4 className="advanced-subtitle">Recursos e modificadores</h4><div className="stat-group-board">{statGroups.map((group) => <section className={`stat-group ${group.tone}`} key={group.title}><header><span className="stat-group-mark" aria-hidden="true" /><div><h5>{group.title}</h5><p>{group.hint}</p></div></header><div className="stat-group-fields">{group.fields.map((field) => <NumberField key={field.key} label={field.label} value={character.stats[field.key] as number} onChange={(value) => update((draft) => { (draft.stats[field.key] as number) = value })} />)}</div></section>)}</div>
    <div className="advanced-field-grid"><Select label="Elemento" value={character.stats.elementId} options={[{ value: "none", label: "Nenhum" }, ...characterElements.map((element) => ({ value: element.id, label: element.name }))]} onChange={(value) => update((draft) => { const element = characterElements.find((candidate) => candidate.id === value); draft.stats.elementId = value; draft.stats.resistances = [...(element?.resistances ?? [])]; draft.stats.weaknesses = [...(element?.weaknesses ?? [])] })} /><Field label="Resistências" value={character.stats.resistances.join(", ")} onChange={(value) => update((draft) => { draft.stats.resistances = splitList(value) })} /><Field label="Fraquezas" value={character.stats.weaknesses.join(", ")} onChange={(value) => update((draft) => { draft.stats.weaknesses = splitList(value) })} /><TextArea label="Efeitos" value={character.stats.effects} onChange={(value) => update((draft) => { draft.stats.effects = value })} /></div>
    <h4 className="advanced-subtitle">Melhorias de maestria</h4><div className="advanced-field-grid compact mastery-cost-grid">{masteryImprovementOptions.map((option) => <NumberField key={option.key} label={`${option.name} / ${option.cost} pontos`} value={character.stats.masteryImprovements[option.key]} onChange={(next) => update((draft) => { draft.stats.masteryImprovements[option.key] = next })} />)}</div>
  </AdvancedSection>
}

function SkillsSection({ items, update }: { items: CharacterSkill[]; update: UpdateCharacter }) {
  return <AdvancedSection title="Perícias" description="Perícias padrão e exclusivas, com atributo, pontos e modificador." action={() => update((draft) => { draft.skills.push({ id: uid("skill"), name: "Nova perícia", attributeKey: "knowledge", points: 0, modifier: 0, locked: false }) })}>
    <RecordList empty="Nenhuma perícia cadastrada.">{items.map((item, index) => <RecordCard key={item.id} title={item.name} summary={`${attributeGroups.flatMap((group) => group.attributes).find((attribute) => attribute.key === item.attributeKey)?.name ?? "Sem atributo"} · ${item.points} pontos · mod. ${item.modifier}`} defaultOpen={items.length <= 6 || index < 4} locked={item.locked} onRemove={item.locked ? undefined : () => update((draft) => { draft.skills = draft.skills.filter((candidate) => candidate.id !== item.id) })}><Field label="Nome" value={item.name} onChange={(value) => update((draft) => { find(draft.skills, item.id).name = value })} /><Select label="Atributo" value={item.attributeKey} options={[{ value: "", label: "Nenhum" }, ...attributeGroups.flatMap((group) => group.attributes.map((attribute) => ({ value: attribute.key, label: attribute.name })))]} onChange={(value) => update((draft) => { find(draft.skills, item.id).attributeKey = value as SecondaryAttributeKey | "" })} /><NumberField label="Pontos" value={item.points} onChange={(value) => update((draft) => { find(draft.skills, item.id).points = value })} /><NumberField label="Modificador" value={item.modifier} onChange={(value) => update((draft) => { find(draft.skills, item.id).modifier = value })} /></RecordCard>)}</RecordList>
  </AdvancedSection>
}

function BondsSection({ items, update }: { items: CharacterBond[]; update: UpdateCharacter }) {
  return <AdvancedSection title="Vínculos" description="Vínculos, categorias, pontos e modificadores." action={() => update((draft) => { draft.bonds.push({ id: uid("bond"), category: "", name: "Novo vínculo", points: 0, modifier: 0 }) })}><RecordList empty="Nenhum vínculo cadastrado.">{items.map((item, index) => <RecordCard key={item.id} title={item.name} summary={`${item.category || "Sem categoria"} · ${item.points} pontos · mod. ${item.modifier}`} defaultOpen={items.length <= 6 || index < 4} onRemove={() => update((draft) => { draft.bonds = draft.bonds.filter((candidate) => candidate.id !== item.id) })}><Field label="Categoria" value={item.category} onChange={(value) => update((draft) => { find(draft.bonds, item.id).category = value })} /><Field label="Nome" value={item.name} onChange={(value) => update((draft) => { find(draft.bonds, item.id).name = value })} /><NumberField label="Pontos" value={item.points} onChange={(value) => update((draft) => { find(draft.bonds, item.id).points = value })} /><NumberField label="Modificador" value={item.modifier} onChange={(value) => update((draft) => { find(draft.bonds, item.id).modifier = value })} /></RecordCard>)}</RecordList></AdvancedSection>
}

function AbilitiesSection({ items, update }: { items: CharacterAbility[]; update: UpdateCharacter }) {
  return <AdvancedSection title="Habilidades" description="Habilidades raciais, de combate e demais categorias, incluindo custos." action={() => update((draft) => { draft.abilities.push({ id: uid("ability"), category: "", name: "Nova habilidade", description: "", permanentModifiers: "", costType: "none", costMode: "fixed", costValue: 0, costText: "" }) })}><RecordList empty="Nenhuma habilidade cadastrada.">{items.map((item, index) => <RecordCard key={item.id} title={item.name} summary={`${item.category || "Sem categoria"}${item.costText ? ` · ${item.costText}` : item.costValue ? ` · custo ${item.costValue}` : ""}`} defaultOpen={items.length <= 6 || index < 4} onRemove={() => update((draft) => { draft.abilities = draft.abilities.filter((candidate) => candidate.id !== item.id) })}><Field label="Categoria" value={item.category} onChange={(value) => update((draft) => { find(draft.abilities, item.id).category = value })} /><Field label="Nome" value={item.name} onChange={(value) => update((draft) => { find(draft.abilities, item.id).name = value })} /><Select label="Recurso de custo" value={item.costType} options={costResourceOptions} onChange={(value) => update((draft) => { find(draft.abilities, item.id).costType = value as CharacterAbility["costType"] })} /><Select label="Modo do custo" value={item.costMode} options={[{ value: "fixed", label: "Fixo" }, { value: "relative", label: "Relativo" }]} onChange={(value) => update((draft) => { find(draft.abilities, item.id).costMode = value as CharacterAbility["costMode"] })} /><NumberField label="Valor do custo" value={item.costValue} onChange={(value) => update((draft) => { find(draft.abilities, item.id).costValue = value })} /><Field label="Custo em texto" value={item.costText} onChange={(value) => update((draft) => { find(draft.abilities, item.id).costText = value })} /><TextArea label="Modificadores permanentes" value={item.permanentModifiers} onChange={(value) => update((draft) => { find(draft.abilities, item.id).permanentModifiers = value })} /><TextArea label="Descrição" value={item.description} onChange={(value) => update((draft) => { find(draft.abilities, item.id).description = value })} /></RecordCard>)}</RecordList></AdvancedSection>
}

function InventorySection({ items, skills, update }: { items: CharacterInventoryItem[]; skills: CharacterSkill[]; update: UpdateCharacter }) {
  return <AdvancedSection title="Inventário" description="Itens, equipamento, quantidade, dano, defesa e durabilidade." action={() => update((draft) => { draft.inventory.push({ id: uid("item"), usage: "stored", name: "Novo item", type: "other", affinity: 0, bondPoints: 0, baseWeight: 0, quantity: 1, applyScaleWeight: false, damage: "", rdf: 0, rdm: 0, prCurrent: null, prMaximum: null, enchantmentSpellId: "", bondId: "", bondAbilityId: "", skillId: "", description: "" }) })}><RecordList empty="Nenhum item cadastrado.">{items.map((item, index) => <RecordCard key={item.id} title={`${item.quantity}× ${item.name}`} summary={`${inventoryUsageOptions.find((option) => option.value === item.usage)?.label ?? "Item"} · ${inventoryTypeOptions.find((option) => option.value === item.type)?.label ?? "Outro"}${item.damage ? ` · ${item.damage}` : ""}`} defaultOpen={items.length <= 6 || index < 4} onRemove={() => update((draft) => { draft.inventory = draft.inventory.filter((candidate) => candidate.id !== item.id) })}><Field label="Nome" value={item.name} onChange={(value) => update((draft) => { find(draft.inventory, item.id).name = value })} /><Select label="Uso" value={item.usage} options={inventoryUsageOptions} onChange={(value) => update((draft) => { find(draft.inventory, item.id).usage = value as CharacterInventoryItem["usage"] })} /><Select label="Tipo" value={item.type} options={inventoryTypeOptions} onChange={(value) => update((draft) => { find(draft.inventory, item.id).type = value as CharacterInventoryItem["type"] })} /><NumberField label="Quantidade" value={item.quantity} onChange={(value) => update((draft) => { find(draft.inventory, item.id).quantity = value })} /><NumberField label="Afinidade" value={item.affinity} onChange={(value) => update((draft) => { find(draft.inventory, item.id).affinity = Math.max(0, Math.min(4, value)) as CharacterInventoryItem["affinity"] })} /><NumberField label="Pontos de vínculo" value={item.bondPoints} onChange={(value) => update((draft) => { find(draft.inventory, item.id).bondPoints = value })} /><NumberField label="Peso base" value={item.baseWeight} onChange={(value) => update((draft) => { find(draft.inventory, item.id).baseWeight = value })} /><BooleanField label="Aplicar escala ao peso" value={item.applyScaleWeight} onChange={(value) => update((draft) => { find(draft.inventory, item.id).applyScaleWeight = value })} /><Field label="Dano" value={item.damage} onChange={(value) => update((draft) => { find(draft.inventory, item.id).damage = value })} /><NumberField label="RDF" value={item.rdf} onChange={(value) => update((draft) => { find(draft.inventory, item.id).rdf = value })} /><NumberField label="RDM" value={item.rdm} onChange={(value) => update((draft) => { find(draft.inventory, item.id).rdm = value })} /><NullableNumber label="PR atual" value={item.prCurrent} onChange={(value) => update((draft) => { find(draft.inventory, item.id).prCurrent = value })} /><NullableNumber label="PR máximo" value={item.prMaximum} onChange={(value) => update((draft) => { find(draft.inventory, item.id).prMaximum = value })} /><Field label="Magia de encantamento (id)" value={item.enchantmentSpellId} onChange={(value) => update((draft) => { find(draft.inventory, item.id).enchantmentSpellId = value })} /><Field label="Vínculo (id)" value={item.bondId} onChange={(value) => update((draft) => { find(draft.inventory, item.id).bondId = value })} /><Field label="Habilidade de vínculo (id)" value={item.bondAbilityId} onChange={(value) => update((draft) => { find(draft.inventory, item.id).bondAbilityId = value })} /><Select label="Perícia do equipamento" value={item.skillId} options={[{ value: "", label: "Nenhuma" }, ...skills.map((skill) => ({ value: skill.id, label: skill.name }))]} onChange={(value) => update((draft) => { find(draft.inventory, item.id).skillId = value })} /><TextArea label="Descrição" value={item.description} onChange={(value) => update((draft) => { find(draft.inventory, item.id).description = value })} /></RecordCard>)}</RecordList></AdvancedSection>
}

function SpellsSection({ items, update }: { items: CharacterSpell[]; update: UpdateCharacter }) {
  return <AdvancedSection title="Magias" description="Magias, alcance, duração, conjuração e custos." action={() => update((draft) => { draft.spells.push({ id: uid("spell"), category: "", name: "Nova magia", description: "", costType: "none", costMode: "fixed", costValue: 0, costText: "", magicType: "spell", rangeType: "personal", rangeText: "", area: "", duration: "", castingSkill: "" }) })}><RecordList empty="Nenhuma magia cadastrada.">{items.map((item) => <RecordCard key={item.id} title={item.name} onRemove={() => update((draft) => { draft.spells = draft.spells.filter((candidate) => candidate.id !== item.id) })}><Field label="Categoria" value={item.category} onChange={(value) => update((draft) => { find(draft.spells, item.id).category = value })} /><Field label="Nome" value={item.name} onChange={(value) => update((draft) => { find(draft.spells, item.id).name = value })} /><Select label="Tipo de magia" value={item.magicType} options={[{ value: "aura", label: "Aura" }, { value: "quick", label: "Rápida" }, { value: "spell", label: "Feitiço" }, { value: "ritual", label: "Ritual" }, { value: "enchantment", label: "Encantamento" }]} onChange={(value) => update((draft) => { find(draft.spells, item.id).magicType = value as CharacterSpell["magicType"] })} /><Select label="Tipo de alcance" value={item.rangeType} options={[{ value: "touch", label: "Toque" }, { value: "personal", label: "Pessoal" }, { value: "projectile", label: "Projétil" }, { value: "targets", label: "Alvos" }, { value: "area", label: "Área" }]} onChange={(value) => update((draft) => { find(draft.spells, item.id).rangeType = value as CharacterSpell["rangeType"] })} /><Field label="Alcance" value={item.rangeText} onChange={(value) => update((draft) => { find(draft.spells, item.id).rangeText = value })} /><Field label="Área" value={item.area} onChange={(value) => update((draft) => { find(draft.spells, item.id).area = value })} /><Field label="Duração" value={item.duration} onChange={(value) => update((draft) => { find(draft.spells, item.id).duration = value })} /><Field label="Perícia de conjuração" value={item.castingSkill} onChange={(value) => update((draft) => { find(draft.spells, item.id).castingSkill = value })} /><Select label="Recurso de custo" value={item.costType} options={costResourceOptions} onChange={(value) => update((draft) => { find(draft.spells, item.id).costType = value as CharacterSpell["costType"] })} /><Select label="Modo do custo" value={item.costMode} options={[{ value: "fixed", label: "Fixo" }, { value: "relative", label: "Relativo" }]} onChange={(value) => update((draft) => { find(draft.spells, item.id).costMode = value as CharacterSpell["costMode"] })} /><NumberField label="Valor do custo" value={item.costValue} onChange={(value) => update((draft) => { find(draft.spells, item.id).costValue = value })} /><Field label="Custo em texto" value={item.costText} onChange={(value) => update((draft) => { find(draft.spells, item.id).costText = value })} /><TextArea label="Descrição" value={item.description} onChange={(value) => update((draft) => { find(draft.spells, item.id).description = value })} /></RecordCard>)}</RecordList></AdvancedSection>
}

function NotesSection({ items, update }: { items: CharacterNote[]; update: UpdateCharacter }) {
  return <AdvancedSection title="Anotações" description="Registros livres organizados por categoria e data." action={() => update((draft) => { draft.notes.push({ id: uid("note"), category: "", name: "Nova anotação", description: "", date: "" }) })}><RecordList empty="Nenhuma anotação cadastrada.">{items.map((item) => <RecordCard key={item.id} title={item.name} onRemove={() => update((draft) => { draft.notes = draft.notes.filter((candidate) => candidate.id !== item.id) })}><Field label="Categoria" value={item.category} onChange={(value) => update((draft) => { find(draft.notes, item.id).category = value })} /><Field label="Nome" value={item.name} onChange={(value) => update((draft) => { find(draft.notes, item.id).name = value })} /><Field label="Data" value={item.date} onChange={(value) => update((draft) => { find(draft.notes, item.id).date = value })} /><TextArea label="Descrição" value={item.description} onChange={(value) => update((draft) => { find(draft.notes, item.id).description = value })} /></RecordCard>)}</RecordList></AdvancedSection>
}

function find<T extends { id: string }>(items: T[], id: string): T { const item = items.find((candidate) => candidate.id === id); if (!item) throw new Error("Registro não encontrado"); return item }
function splitList(value: string) { return value.split(/[,\n]/).map((item) => item.trim()).filter(Boolean) }
function AdvancedSection({ title, description, action, children }: { title: string; description: string; action?: () => void; children: React.ReactNode }) { return <section className="advanced-section"><header><div><h3>{title}</h3><p>{description}</p></div>{action && <button className="primary-button" onClick={action}><Plus size={16} /> Adicionar</button>}</header>{children}</section> }
function RecordList({ empty, children }: { empty: string; children: React.ReactNode }) { return <div className="advanced-record-list">{Array.isArray(children) && children.length === 0 ? <p className="advanced-empty">{empty}</p> : children}</div> }
function RecordCard({ title, summary, defaultOpen = true, locked = false, onRemove, children }: { title: string; summary?: string; defaultOpen?: boolean; locked?: boolean; onRemove?: () => void; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen)
  return <article className={`advanced-record ${open ? "open" : "collapsed"}`}><header><button className="record-toggle" onClick={() => setOpen((value) => !value)} aria-expanded={open}><ChevronDown size={16} /><span><strong>{title}</strong>{summary && <small>{summary}</small>}</span><em>{open ? "Recolher" : "Exibir ficha completa"}</em></button>{locked ? <span>Protegida</span> : onRemove && <button className="icon-button subtle danger-icon" onClick={onRemove} title="Remover"><Trash2 size={15} /></button>}</header>{open && <div className="advanced-field-grid">{children}</div>}</article>
}
function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="field"><span>{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} /></label> }
function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) { return <label className="field number-field"><span>{label}</span><input type="number" value={Number.isFinite(value) ? value : 0} onChange={(event) => onChange(Number(event.target.value))} /></label> }
function NullableNumber({ label, value, onChange }: { label: string; value: number | null; onChange: (value: number | null) => void }) { return <label className="field number-field"><span>{label}</span><input type="number" value={value ?? ""} placeholder="—" onChange={(event) => onChange(event.target.value === "" ? null : Number(event.target.value))} /></label> }
function BooleanField({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) { return <label className="advanced-check"><input type="checkbox" checked={value} onChange={(event) => onChange(event.target.checked)} /><span>{label}</span></label> }
function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="field wide"><span>{label}</span><textarea value={value} onChange={(event) => onChange(event.target.value)} /></label> }
function Select({ label, value, options, onChange }: { label: string; value: string; options: Array<{ value: string; label: string }>; onChange: (value: string) => void }) { return <label className="field"><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label> }
function DerivedStat({ label, value }: { label: string; value: string | number }) { return <div className="derived-stat"><span>{label}</span><strong>{value}</strong></div> }
