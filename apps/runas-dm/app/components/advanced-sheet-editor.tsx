"use client"

import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { attributeGroups } from "@runas/core/data/attributes"
import { characterElements } from "@runas/core/data/elements"
import { inventoryTypeOptions, inventoryUsageOptions } from "@runas/core/lib/inventoryCalculations"
import type {
  Character, CharacterAbility, CharacterBond, CharacterInfo, CharacterInventoryItem,
  CharacterNote, CharacterSkill, CharacterSpell, SecondaryAttributeKey,
} from "@runas/core/types/character"

type AdvancedTab = "information" | "statistics" | "skills" | "bonds" | "abilities" | "inventory" | "spells" | "notes"

const tabs: Array<{ id: AdvancedTab; label: string }> = [
  { id: "information", label: "Informações" }, { id: "statistics", label: "Estatísticas" },
  { id: "skills", label: "Perícias" }, { id: "bonds", label: "Vínculos" },
  { id: "abilities", label: "Habilidades" }, { id: "inventory", label: "Inventário" },
  { id: "spells", label: "Magias" }, { id: "notes", label: "Anotações" },
]

const infoFields: Array<{ key: keyof CharacterInfo; label: string }> = [
  { key: "currentYear", label: "Ano atual" }, { key: "race", label: "Raça" }, { key: "species", label: "Espécie" },
  { key: "profession", label: "Profissão" }, { key: "characterClass", label: "Classe" }, { key: "archetype", label: "Arquétipo" },
  { key: "birthDate", label: "Nascimento" }, { key: "age", label: "Idade" }, { key: "region", label: "Região" },
  { key: "affinity", label: "Afinidade" }, { key: "efficiency", label: "Eficiência" }, { key: "alignment", label: "Alinhamento" },
  { key: "essences", label: "Essências" }, { key: "karma", label: "Karma" }, { key: "deity", label: "Divindade" },
  { key: "legacy", label: "Legado" }, { key: "legacyPoints", label: "Pontos de legado" }, { key: "legacyRarity", label: "Raridade do legado" },
  { key: "sizeBase", label: "Tamanho base" }, { key: "sizeReal", label: "Tamanho real" }, { key: "sizeModifier", label: "Modificador de tamanho" },
  { key: "sizeModifierBonus", label: "Bônus de tamanho" }, { key: "weightBase", label: "Peso base" }, { key: "weightBonus", label: "Bônus de peso" },
  { key: "weightReal", label: "Peso real" }, { key: "scaleMultiplier", label: "Multiplicador de escala" }, { key: "loadBase", label: "Carga base" },
]

function uid(prefix: string) { return `${prefix}-${crypto.randomUUID()}` }

export function AdvancedSheetEditor({ character, onChange }: { character: Character; onChange: (character: Character) => void }) {
  const [activeTab, setActiveTab] = useState<AdvancedTab>("information")
  function update(mutator: (draft: Character) => void) {
    const draft = structuredClone(character)
    mutator(draft)
    onChange(draft)
  }

  return <div className="full-sheet-editor">
    <nav className="full-sheet-tabs" aria-label="Seções da ficha completa">{tabs.map((tab) => <button key={tab.id} className={activeTab === tab.id ? "active" : ""} onClick={() => setActiveTab(tab.id)}>{tab.label}</button>)}</nav>
    <div className="full-sheet-content">
      {activeTab === "information" && <InformationSection character={character} update={update} />}
      {activeTab === "statistics" && <StatisticsSection character={character} update={update} />}
      {activeTab === "skills" && <SkillsSection items={character.skills} update={update} />}
      {activeTab === "bonds" && <BondsSection items={character.bonds} update={update} />}
      {activeTab === "abilities" && <AbilitiesSection items={character.abilities} update={update} />}
      {activeTab === "inventory" && <InventorySection items={character.inventory} update={update} />}
      {activeTab === "spells" && <SpellsSection items={character.spells} update={update} />}
      {activeTab === "notes" && <NotesSection items={character.notes} update={update} />}
    </div>
  </div>
}

type UpdateCharacter = (mutator: (draft: Character) => void) => void

function InformationSection({ character, update }: { character: Character; update: UpdateCharacter }) {
  return <AdvancedSection title="Informações" description="Identidade, origem, escala e progressão da criatura.">
    <div className="advanced-field-grid"><Field label="Nome" value={character.name} onChange={(value) => update((draft) => { draft.name = value })} />
      <Select label="Calendário" value={character.info.calendar} options={[{ value: "logi", label: "Logi" }, { value: "ce", label: "Élfico" }]} onChange={(value) => update((draft) => { draft.info.calendar = value as CharacterInfo["calendar"] })} />
      {infoFields.map((field) => <Field key={field.key} label={field.label} value={character.info[field.key]} onChange={(value) => update((draft) => { draft.info[field.key] = value as never })} />)}
    </div>
  </AdvancedSection>
}

function StatisticsSection({ character, update }: { character: Character; update: UpdateCharacter }) {
  const statFields: Array<{ key: keyof Character["stats"]; label: string }> = [
    { key: "pv", label: "PV atual" }, { key: "pvBonus", label: "Bônus de PV" }, { key: "pa", label: "PA atual" }, { key: "paBonus", label: "Bônus de PA" },
    { key: "paExtra", label: "PA extra" }, { key: "paExtraBonus", label: "Bônus de PA extra" }, { key: "pe", label: "PE atual" }, { key: "peBonus", label: "Bônus de PE" },
    { key: "peTemporary", label: "PE temporário" }, { key: "determination", label: "Determinação" }, { key: "determinationBonus", label: "Bônus de determinação" },
    { key: "casualty", label: "Casualidade" }, { key: "casualtyBonus", label: "Bônus de casualidade" }, { key: "focusCurrent", label: "Foco atual" },
    { key: "focusModifier", label: "Modificador de foco" }, { key: "currentLoad", label: "Carga atual" }, { key: "loadBonus", label: "Bônus de carga" },
    { key: "willModifier", label: "Mod. Vontade" }, { key: "chanceModifier", label: "Mod. Acaso" }, { key: "perceptionModifier", label: "Mod. Percepção" },
    { key: "movementBonus", label: "Bônus de deslocamento" }, { key: "firstImpressionsBonus", label: "Primeiras impressões" }, { key: "armorRdf", label: "RDF armadura" },
    { key: "armorRdm", label: "RDM armadura" }, { key: "naturalRdf", label: "RDF natural" }, { key: "naturalRdm", label: "RDM natural" }, { key: "mt", label: "MT" },
  ]
  return <AdvancedSection title="Estatísticas" description="Atributos, recursos, defesas, elemento e efeitos.">
    <h4 className="advanced-subtitle">Atributos</h4><div className="advanced-attribute-grid">{attributeGroups.map((group) => <div key={group.id}><NumberField label={group.primary.abbr} value={character.attributes[group.primary.key]} onChange={(value) => update((draft) => { draft.attributes[group.primary.key] = value })} />{group.attributes.map((attribute) => <NumberField key={attribute.key} label={attribute.abbr} value={character.attributes[attribute.key]} onChange={(value) => update((draft) => { draft.attributes[attribute.key] = value })} />)}</div>)}</div>
    <h4 className="advanced-subtitle">Recursos e modificadores</h4><div className="advanced-field-grid compact">{statFields.map((field) => <NumberField key={field.key} label={field.label} value={character.stats[field.key] as number} onChange={(value) => update((draft) => { (draft.stats[field.key] as number) = value })} />)}</div>
    <div className="advanced-field-grid"><Select label="Elemento" value={character.stats.elementId} options={[{ value: "none", label: "Nenhum" }, ...characterElements.map((element) => ({ value: element.id, label: element.name }))]} onChange={(value) => update((draft) => { draft.stats.elementId = value })} /><Field label="Resistências" value={character.stats.resistances.join(", ")} onChange={(value) => update((draft) => { draft.stats.resistances = splitList(value) })} /><Field label="Fraquezas" value={character.stats.weaknesses.join(", ")} onChange={(value) => update((draft) => { draft.stats.weaknesses = splitList(value) })} /><TextArea label="Efeitos" value={character.stats.effects} onChange={(value) => update((draft) => { draft.stats.effects = value })} /></div>
    <h4 className="advanced-subtitle">Melhorias de maestria</h4><div className="advanced-field-grid compact">{Object.entries(character.stats.masteryImprovements).map(([key, value]) => <NumberField key={key} label={key} value={value} onChange={(next) => update((draft) => { draft.stats.masteryImprovements[key as keyof typeof draft.stats.masteryImprovements] = next })} />)}</div>
  </AdvancedSection>
}

function SkillsSection({ items, update }: { items: CharacterSkill[]; update: UpdateCharacter }) {
  return <AdvancedSection title="Perícias" description="Perícias padrão e exclusivas, com atributo, pontos e modificador." action={() => update((draft) => { draft.skills.push({ id: uid("skill"), name: "Nova perícia", attributeKey: "knowledge", points: 0, modifier: 0, locked: false }) })}>
    <RecordList empty="Nenhuma perícia cadastrada.">{items.map((item) => <RecordCard key={item.id} title={item.name} locked={item.locked} onRemove={item.locked ? undefined : () => update((draft) => { draft.skills = draft.skills.filter((candidate) => candidate.id !== item.id) })}><Field label="Nome" value={item.name} onChange={(value) => update((draft) => { find(draft.skills, item.id).name = value })} /><Select label="Atributo" value={item.attributeKey} options={[{ value: "", label: "Nenhum" }, ...attributeGroups.flatMap((group) => group.attributes.map((attribute) => ({ value: attribute.key, label: attribute.name })))]} onChange={(value) => update((draft) => { find(draft.skills, item.id).attributeKey = value as SecondaryAttributeKey | "" })} /><NumberField label="Pontos" value={item.points} onChange={(value) => update((draft) => { find(draft.skills, item.id).points = value })} /><NumberField label="Modificador" value={item.modifier} onChange={(value) => update((draft) => { find(draft.skills, item.id).modifier = value })} /></RecordCard>)}</RecordList>
  </AdvancedSection>
}

function BondsSection({ items, update }: { items: CharacterBond[]; update: UpdateCharacter }) {
  return <AdvancedSection title="Vínculos" description="Vínculos, categorias, pontos e modificadores." action={() => update((draft) => { draft.bonds.push({ id: uid("bond"), category: "", name: "Novo vínculo", points: 0, modifier: 0 }) })}><RecordList empty="Nenhum vínculo cadastrado.">{items.map((item) => <RecordCard key={item.id} title={item.name} onRemove={() => update((draft) => { draft.bonds = draft.bonds.filter((candidate) => candidate.id !== item.id) })}><Field label="Categoria" value={item.category} onChange={(value) => update((draft) => { find(draft.bonds, item.id).category = value })} /><Field label="Nome" value={item.name} onChange={(value) => update((draft) => { find(draft.bonds, item.id).name = value })} /><NumberField label="Pontos" value={item.points} onChange={(value) => update((draft) => { find(draft.bonds, item.id).points = value })} /><NumberField label="Modificador" value={item.modifier} onChange={(value) => update((draft) => { find(draft.bonds, item.id).modifier = value })} /></RecordCard>)}</RecordList></AdvancedSection>
}

function AbilitiesSection({ items, update }: { items: CharacterAbility[]; update: UpdateCharacter }) {
  return <AdvancedSection title="Habilidades" description="Habilidades raciais, de combate e demais categorias, incluindo custos." action={() => update((draft) => { draft.abilities.push({ id: uid("ability"), category: "", name: "Nova habilidade", description: "", permanentModifiers: "", costType: "none", costMode: "fixed", costValue: 0, costText: "" }) })}><RecordList empty="Nenhuma habilidade cadastrada.">{items.map((item) => <RecordCard key={item.id} title={item.name} onRemove={() => update((draft) => { draft.abilities = draft.abilities.filter((candidate) => candidate.id !== item.id) })}><Field label="Categoria" value={item.category} onChange={(value) => update((draft) => { find(draft.abilities, item.id).category = value })} /><Field label="Nome" value={item.name} onChange={(value) => update((draft) => { find(draft.abilities, item.id).name = value })} /><Select label="Recurso de custo" value={item.costType} options={["none", "other", "pv", "pa", "pe", "paExtra", "peTemporary"].map((value) => ({ value, label: value }))} onChange={(value) => update((draft) => { find(draft.abilities, item.id).costType = value as CharacterAbility["costType"] })} /><Select label="Modo do custo" value={item.costMode} options={[{ value: "fixed", label: "Fixo" }, { value: "relative", label: "Relativo" }]} onChange={(value) => update((draft) => { find(draft.abilities, item.id).costMode = value as CharacterAbility["costMode"] })} /><NumberField label="Valor do custo" value={item.costValue} onChange={(value) => update((draft) => { find(draft.abilities, item.id).costValue = value })} /><Field label="Custo em texto" value={item.costText} onChange={(value) => update((draft) => { find(draft.abilities, item.id).costText = value })} /><TextArea label="Modificadores permanentes" value={item.permanentModifiers} onChange={(value) => update((draft) => { find(draft.abilities, item.id).permanentModifiers = value })} /><TextArea label="Descrição" value={item.description} onChange={(value) => update((draft) => { find(draft.abilities, item.id).description = value })} /></RecordCard>)}</RecordList></AdvancedSection>
}

function InventorySection({ items, update }: { items: CharacterInventoryItem[]; update: UpdateCharacter }) {
  return <AdvancedSection title="Inventário" description="Itens, equipamento, quantidade, dano, defesa e durabilidade." action={() => update((draft) => { draft.inventory.push({ id: uid("item"), usage: "stored", name: "Novo item", type: "other", affinity: 0, bondPoints: 0, baseWeight: 0, quantity: 1, applyScaleWeight: false, damage: "", rdf: 0, rdm: 0, prCurrent: null, prMaximum: null, enchantmentSpellId: "", bondId: "", bondAbilityId: "", skillId: "", description: "" }) })}><RecordList empty="Nenhum item cadastrado.">{items.map((item) => <RecordCard key={item.id} title={`${item.quantity}× ${item.name}`} onRemove={() => update((draft) => { draft.inventory = draft.inventory.filter((candidate) => candidate.id !== item.id) })}><Field label="Nome" value={item.name} onChange={(value) => update((draft) => { find(draft.inventory, item.id).name = value })} /><Select label="Uso" value={item.usage} options={inventoryUsageOptions} onChange={(value) => update((draft) => { find(draft.inventory, item.id).usage = value as CharacterInventoryItem["usage"] })} /><Select label="Tipo" value={item.type} options={inventoryTypeOptions} onChange={(value) => update((draft) => { find(draft.inventory, item.id).type = value as CharacterInventoryItem["type"] })} /><NumberField label="Quantidade" value={item.quantity} onChange={(value) => update((draft) => { find(draft.inventory, item.id).quantity = value })} /><NumberField label="Afinidade" value={item.affinity} onChange={(value) => update((draft) => { find(draft.inventory, item.id).affinity = Math.max(0, Math.min(4, value)) as CharacterInventoryItem["affinity"] })} /><NumberField label="Pontos de vínculo" value={item.bondPoints} onChange={(value) => update((draft) => { find(draft.inventory, item.id).bondPoints = value })} /><NumberField label="Peso base" value={item.baseWeight} onChange={(value) => update((draft) => { find(draft.inventory, item.id).baseWeight = value })} /><BooleanField label="Aplicar escala ao peso" value={item.applyScaleWeight} onChange={(value) => update((draft) => { find(draft.inventory, item.id).applyScaleWeight = value })} /><Field label="Dano" value={item.damage} onChange={(value) => update((draft) => { find(draft.inventory, item.id).damage = value })} /><NumberField label="RDF" value={item.rdf} onChange={(value) => update((draft) => { find(draft.inventory, item.id).rdf = value })} /><NumberField label="RDM" value={item.rdm} onChange={(value) => update((draft) => { find(draft.inventory, item.id).rdm = value })} /><NullableNumber label="PR atual" value={item.prCurrent} onChange={(value) => update((draft) => { find(draft.inventory, item.id).prCurrent = value })} /><NullableNumber label="PR máximo" value={item.prMaximum} onChange={(value) => update((draft) => { find(draft.inventory, item.id).prMaximum = value })} /><Field label="Magia de encantamento (id)" value={item.enchantmentSpellId} onChange={(value) => update((draft) => { find(draft.inventory, item.id).enchantmentSpellId = value })} /><Field label="Vínculo (id)" value={item.bondId} onChange={(value) => update((draft) => { find(draft.inventory, item.id).bondId = value })} /><Field label="Habilidade de vínculo (id)" value={item.bondAbilityId} onChange={(value) => update((draft) => { find(draft.inventory, item.id).bondAbilityId = value })} /><Field label="Perícia (id)" value={item.skillId} onChange={(value) => update((draft) => { find(draft.inventory, item.id).skillId = value })} /><TextArea label="Descrição" value={item.description} onChange={(value) => update((draft) => { find(draft.inventory, item.id).description = value })} /></RecordCard>)}</RecordList></AdvancedSection>
}

function SpellsSection({ items, update }: { items: CharacterSpell[]; update: UpdateCharacter }) {
  return <AdvancedSection title="Magias" description="Magias, alcance, duração, conjuração e custos." action={() => update((draft) => { draft.spells.push({ id: uid("spell"), category: "", name: "Nova magia", description: "", costType: "none", costMode: "fixed", costValue: 0, costText: "", magicType: "spell", rangeType: "personal", rangeText: "", area: "", duration: "", castingSkill: "" }) })}><RecordList empty="Nenhuma magia cadastrada.">{items.map((item) => <RecordCard key={item.id} title={item.name} onRemove={() => update((draft) => { draft.spells = draft.spells.filter((candidate) => candidate.id !== item.id) })}><Field label="Categoria" value={item.category} onChange={(value) => update((draft) => { find(draft.spells, item.id).category = value })} /><Field label="Nome" value={item.name} onChange={(value) => update((draft) => { find(draft.spells, item.id).name = value })} /><Select label="Tipo de magia" value={item.magicType} options={[{ value: "aura", label: "Aura" }, { value: "quick", label: "Rápida" }, { value: "spell", label: "Feitiço" }, { value: "ritual", label: "Ritual" }, { value: "enchantment", label: "Encantamento" }]} onChange={(value) => update((draft) => { find(draft.spells, item.id).magicType = value as CharacterSpell["magicType"] })} /><Select label="Tipo de alcance" value={item.rangeType} options={[{ value: "touch", label: "Toque" }, { value: "personal", label: "Pessoal" }, { value: "projectile", label: "Projétil" }, { value: "targets", label: "Alvos" }, { value: "area", label: "Área" }]} onChange={(value) => update((draft) => { find(draft.spells, item.id).rangeType = value as CharacterSpell["rangeType"] })} /><Field label="Alcance" value={item.rangeText} onChange={(value) => update((draft) => { find(draft.spells, item.id).rangeText = value })} /><Field label="Área" value={item.area} onChange={(value) => update((draft) => { find(draft.spells, item.id).area = value })} /><Field label="Duração" value={item.duration} onChange={(value) => update((draft) => { find(draft.spells, item.id).duration = value })} /><Field label="Perícia de conjuração" value={item.castingSkill} onChange={(value) => update((draft) => { find(draft.spells, item.id).castingSkill = value })} /><Select label="Recurso de custo" value={item.costType} options={["none", "other", "pv", "pa", "pe", "paExtra", "peTemporary"].map((value) => ({ value, label: value }))} onChange={(value) => update((draft) => { find(draft.spells, item.id).costType = value as CharacterSpell["costType"] })} /><Select label="Modo do custo" value={item.costMode} options={[{ value: "fixed", label: "Fixo" }, { value: "relative", label: "Relativo" }]} onChange={(value) => update((draft) => { find(draft.spells, item.id).costMode = value as CharacterSpell["costMode"] })} /><NumberField label="Valor do custo" value={item.costValue} onChange={(value) => update((draft) => { find(draft.spells, item.id).costValue = value })} /><Field label="Custo em texto" value={item.costText} onChange={(value) => update((draft) => { find(draft.spells, item.id).costText = value })} /><TextArea label="Descrição" value={item.description} onChange={(value) => update((draft) => { find(draft.spells, item.id).description = value })} /></RecordCard>)}</RecordList></AdvancedSection>
}

function NotesSection({ items, update }: { items: CharacterNote[]; update: UpdateCharacter }) {
  return <AdvancedSection title="Anotações" description="Registros livres organizados por categoria e data." action={() => update((draft) => { draft.notes.push({ id: uid("note"), category: "", name: "Nova anotação", description: "", date: "" }) })}><RecordList empty="Nenhuma anotação cadastrada.">{items.map((item) => <RecordCard key={item.id} title={item.name} onRemove={() => update((draft) => { draft.notes = draft.notes.filter((candidate) => candidate.id !== item.id) })}><Field label="Categoria" value={item.category} onChange={(value) => update((draft) => { find(draft.notes, item.id).category = value })} /><Field label="Nome" value={item.name} onChange={(value) => update((draft) => { find(draft.notes, item.id).name = value })} /><Field label="Data" value={item.date} onChange={(value) => update((draft) => { find(draft.notes, item.id).date = value })} /><TextArea label="Descrição" value={item.description} onChange={(value) => update((draft) => { find(draft.notes, item.id).description = value })} /></RecordCard>)}</RecordList></AdvancedSection>
}

function find<T extends { id: string }>(items: T[], id: string): T { const item = items.find((candidate) => candidate.id === id); if (!item) throw new Error("Registro não encontrado"); return item }
function splitList(value: string) { return value.split(/[,\n]/).map((item) => item.trim()).filter(Boolean) }
function AdvancedSection({ title, description, action, children }: { title: string; description: string; action?: () => void; children: React.ReactNode }) { return <section className="advanced-section"><header><div><h3>{title}</h3><p>{description}</p></div>{action && <button className="primary-button" onClick={action}><Plus size={16} /> Adicionar</button>}</header>{children}</section> }
function RecordList({ empty, children }: { empty: string; children: React.ReactNode }) { return <div className="advanced-record-list">{Array.isArray(children) && children.length === 0 ? <p className="advanced-empty">{empty}</p> : children}</div> }
function RecordCard({ title, locked = false, onRemove, children }: { title: string; locked?: boolean; onRemove?: () => void; children: React.ReactNode }) { return <article className="advanced-record"><header><strong>{title}</strong>{locked ? <span>Protegida</span> : onRemove && <button className="icon-button subtle danger-icon" onClick={onRemove} title="Remover"><Trash2 size={15} /></button>}</header><div className="advanced-field-grid">{children}</div></article> }
function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="field"><span>{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} /></label> }
function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) { return <label className="field number-field"><span>{label}</span><input type="number" value={Number.isFinite(value) ? value : 0} onChange={(event) => onChange(Number(event.target.value))} /></label> }
function NullableNumber({ label, value, onChange }: { label: string; value: number | null; onChange: (value: number | null) => void }) { return <label className="field number-field"><span>{label}</span><input type="number" value={value ?? ""} placeholder="—" onChange={(event) => onChange(event.target.value === "" ? null : Number(event.target.value))} /></label> }
function BooleanField({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) { return <label className="advanced-check"><input type="checkbox" checked={value} onChange={(event) => onChange(event.target.checked)} /><span>{label}</span></label> }
function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="field wide"><span>{label}</span><textarea value={value} onChange={(event) => onChange(event.target.value)} /></label> }
function Select({ label, value, options, onChange }: { label: string; value: string; options: Array<{ value: string; label: string }>; onChange: (value: string) => void }) { return <label className="field"><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label> }
