import type { RulesetDefinition } from "@runas/ruleset-contracts"

export const rulesets: RulesetDefinition[] = [
  {
    id: "runas-blue",
    name: "Runas: Livro Azul",
    shortName: "Livro Azul",
    description: "A ficha original e todas as regras atuais do Runas Tools.",
  },
  {
    id: "cronos",
    name: "Sagas de Cronos",
    shortName: "Cronos",
    description: "Sincronia, Aura, Fama e regras próprias de Sagas de Cronos.",
  },
]

export function getRulesetDefinition(id: RulesetDefinition["id"]): RulesetDefinition {
  return rulesets.find((ruleset) => ruleset.id === id) ?? rulesets[0]
}
