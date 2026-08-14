import type { DamageType } from "@/types/damage"

/**
 * Lista estática de tipos de dano do sistema Runas: Livro Azul.
 *
 * A lista definitiva ainda NÃO foi fornecida pelo sistema.
 * Portanto, apenas "Queimadura" é usada como exemplo.
 *
 * Para cadastrar um novo tipo de dano, basta adicionar um objeto aqui:
 *   - id: identificador único (slug, sem espaços)
 *   - name: nome exibido ao usuário
 *   - abbreviations: apelidos aceitos pelo parser (mínimo 3 caracteres)
 *   - category: "physical" | "magical" (define se usa RDF ou RDM)
 */
export const damageTypes: DamageType[] = [
  {
    id: "queimadura",
    name: "Queimadura",
    abbreviations: ["queim", "quei"],
    category: "magical",
  },
]

export function getDamageType(id: string): DamageType | undefined {
  return damageTypes.find((d) => d.id === id)
}
