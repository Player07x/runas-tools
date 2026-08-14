import type { AttributeKey } from "@/types/character"
import type { SelectOption } from "@/components/ui/select-field"
import { allAttributes } from "@/data/attributes"

/** Opções do select de atributo, incluindo "Nenhum". */
export const attributeSelectOptions: SelectOption[] = [
  { value: "none", label: "Nenhum" },
  ...allAttributes.map((a) => ({ value: a.key, label: a.name })),
]

export function isAttributeKey(value: string): value is AttributeKey {
  return allAttributes.some((a) => a.key === value)
}
