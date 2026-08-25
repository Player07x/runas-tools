import type { AttributeKey } from "@runas/core/types/character"
import type { SelectOption } from "@/components/ui/select-field"
import { damageAttributes } from "@runas/core/data/attributes"

/** Opções do select de atributo, incluindo "Nenhum". */
export const attributeSelectOptions: SelectOption[] = [
  { value: "none", label: "Nenhum" },
  ...damageAttributes.map((attribute) => ({ value: attribute.key, label: attribute.name })),
]

export function isAttributeKey(value: string): value is AttributeKey {
  return damageAttributes.some((attribute) => attribute.key === value)
}
