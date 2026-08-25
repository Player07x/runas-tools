"use client"

import { attributeGroups } from "@runas/core/data/attributes"
import type { AttributeKey, CharacterAttributes } from "@runas/core/types/character"

export function AttributeBands({ attributes, onChange }: { attributes: CharacterAttributes; onChange: (key: AttributeKey, value: number) => void }) {
  return <div className="attribute-bands">{attributeGroups.map((group) => <div className={`attribute-band ${group.id}`} key={group.id}><strong className="attribute-band-name">{group.name}</strong><label className="attribute-primary"><span className="sr-only">{group.name}</span><input type="number" value={attributes[group.primary.key]} onChange={(event) => onChange(group.primary.key, Number(event.target.value))} /></label>{group.attributes.map((attribute) => <label className="attribute-secondary" key={attribute.key}><span>{attribute.name.toLocaleLowerCase("pt-BR")}</span><input type="number" value={attributes[attribute.key]} onChange={(event) => onChange(attribute.key, Number(event.target.value))} /></label>)}</div>)}</div>
}
