"use client"

import { useState } from "react"
import { attributeGroups } from "@runas/core/data/attributes"
import type { AttributeKey, CharacterAttributes } from "@runas/core/types/character"

function AttributeInput({ value, minimum, onChange }: { value: number; minimum: number; onChange: (value: number) => void }) {
  const [draft, setDraft] = useState(String(value))
  function update(raw: string, blur = false) {
    setDraft(raw)
    if (raw === "" || raw === "+" || raw === "-") {
      if (blur) { setDraft(String(minimum)); onChange(minimum) }
      return
    }
    const parsed = Number(raw)
    if (Number.isFinite(parsed)) onChange(Math.trunc(parsed))
  }
  return <input inputMode="numeric" value={draft} onChange={(event) => update(event.target.value)} onBlur={() => update(draft, true)} />
}

export function AttributeBands({ attributes, onChange }: { attributes: CharacterAttributes; onChange: (key: AttributeKey, value: number) => void }) {
  return <div className="attribute-bands">{attributeGroups.map((group) => <div className={`attribute-band ${group.id}`} key={group.id}><strong className="attribute-band-name">{group.name}</strong><label className="attribute-primary"><span className="sr-only">{group.name}</span><AttributeInput key={attributes[group.primary.key]} value={attributes[group.primary.key]} minimum={1} onChange={(value) => onChange(group.primary.key, value)} /></label>{group.attributes.map((attribute) => <label className="attribute-secondary" key={attribute.key}><span>{attribute.name.toLocaleLowerCase("pt-BR")}</span><AttributeInput key={attributes[attribute.key]} value={attributes[attribute.key]} minimum={0} onChange={(value) => onChange(attribute.key, value)} /></label>)}</div>)}</div>
}
