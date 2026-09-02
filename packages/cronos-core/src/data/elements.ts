export const cronosElements = [
  { id: "agua", name: "Água", color: "#4f9bd9" },
  { id: "ar", name: "Ar", color: "#9bcbd1" },
  { id: "cristal", name: "Cristal", color: "#b57ddd" },
  { id: "fogo", name: "Fogo", color: "#d85b48" },
  { id: "gelo", name: "Gelo", color: "#80bce6" },
  { id: "luz", name: "Luz", color: "#e4c75b" },
  { id: "metal", name: "Metal", color: "#8a8e99" },
  { id: "natureza", name: "Natureza", color: "#65a55c" },
  { id: "pedra", name: "Pedra", color: "#8e7967" },
  { id: "puro", name: "Puro", color: "#e6e4d9" },
  { id: "raio", name: "Raio", color: "#e5bd3f" },
  { id: "sombra", name: "Sombra", color: "#665578" },
  { id: "terra", name: "Terra", color: "#b47a50" },
  { id: "toxico", name: "Tóxico", color: "#79a849" },
] as const

export const cronosElementOptions = [
  { value: "none", label: "Nenhum" },
  ...cronosElements.map((element) => ({ value: element.id, label: element.name })),
]
