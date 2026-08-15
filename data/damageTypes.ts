import type { DamageType } from "@/types/damage"

/**
 * Lista estática de tipos de dano do sistema Runas: Livro Azul.
 *
 * Para cadastrar um novo tipo de dano, basta adicionar um objeto aqui:
 *   - id: identificador único (slug, sem espaços)
 *   - name: nome exibido ao usuário
 *   - abbreviations: apelidos aceitos pelo parser (mínimo 3 caracteres)
 *   - category: "physical" | "magical" | "special"
 *     (danos especiais ignoram RDF e RDM)
 */
export const damageTypes: DamageType[] = [
  { id: "contundente", name: "Contundente", abbreviations: ["cont"], category: "physical" },
  { id: "cortante", name: "Cortante", abbreviations: ["cort"], category: "physical" },
  { id: "perfurante", name: "Perfurante", abbreviations: ["perf"], category: "physical" },
  {
    id: "queimadura",
    name: "Queimadura",
    abbreviations: ["queim", "quei"],
    category: "magical",
  },
  { id: "congelante", name: "Congelante", abbreviations: ["cong"], category: "magical" },
  { id: "eletrico", name: "Elétrico", abbreviations: ["eletric", "elet"], category: "magical" },
  { id: "corrosivo", name: "Corrosivo", abbreviations: ["corr"], category: "magical" },
  { id: "energia", name: "Energia", abbreviations: ["ener"], category: "magical" },
  { id: "impacto", name: "Impacto", abbreviations: ["imp"], category: "special" },
  { id: "radiacao", name: "Radiação", abbreviations: ["rad"], category: "special" },
  { id: "absorcao", name: "Absorção", abbreviations: ["abs"], category: "special" },
  { id: "necrotico", name: "Necrótico", abbreviations: ["necro"], category: "special" },
  { id: "espectral", name: "Espectral", abbreviations: ["espec"], category: "special" },
  { id: "toxina", name: "Toxina", abbreviations: ["tox"], category: "special" },
  { id: "psiquica", name: "Psíquica", abbreviations: ["psi"], category: "special" },
  { id: "virtual", name: "Virtual", abbreviations: ["virt"], category: "special" },
  { id: "cosmico", name: "Cósmico", abbreviations: ["cos"], category: "special" },
  { id: "estelar", name: "Estelar", abbreviations: ["est"], category: "special" },
  { id: "abissal", name: "Abissal", abbreviations: ["abis"], category: "special" },
  { id: "temporal", name: "Temporal", abbreviations: ["temp"], category: "special" },
]

export function getDamageType(id: string): DamageType | undefined {
  return damageTypes.find((d) => d.id === id)
}
