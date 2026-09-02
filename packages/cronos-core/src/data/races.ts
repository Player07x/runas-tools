export const cronosRaces = [
  "Anão",
  "Arcanjo",
  "Bestial",
  "Colosso",
  "Demônio de Chifres Brancos",
  "Demônio de Chifres Negros",
  "Dopple",
  "Elfo Lunar",
  "Elfo Solar",
  "Humano",
  "Metamorfo",
  "Serafim",
  "Slime",
  "Personalizado",
] as const

export const cronosRaceOptions = cronosRaces.map((race) => ({ value: race, label: race }))
