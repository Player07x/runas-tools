export const races = [
  "Humano",
  "Fauno",
  "Elemental",
  "Elfo",
  "Fada",
  "Gigante",
  "Goblinóide",
  "Cogumelita",
  "Autômato",
  "Fractus",
  "Anjo",
  "Corrompido",
  "Personalizado",
] as const

export const raceOptions = races.map((race) => ({ value: race, label: race }))
