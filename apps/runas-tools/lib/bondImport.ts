export interface ImportedBond {
  name: string
  points: number
}

export interface BondImportResult {
  bonds: ImportedBond[]
  errors: string[]
}

function splitColumns(line: string): string[] {
  if (line.includes("|")) return line.split("|").map((column) => column.trim()).filter(Boolean)
  if (line.includes("\t")) return line.split(/\t+/).map((column) => column.trim()).filter(Boolean)
  const structured = line.match(/^(.+?)\s+([\p{L}]+)\s+([+-]?\d+)\s+(-?\d+)$/u)
  return structured ? structured.slice(1) : []
}

export function parseBondImport(text: string): BondImportResult {
  const bonds: ImportedBond[] = []
  const errors: string[] = []

  text.split(/\r?\n/).forEach((sourceLine, index) => {
    const line = sourceLine.trim()
    if (!line) return
    const columns = splitColumns(line)
    if (columns.length >= 4 && /^(nome|v[ií]nculo)$/i.test(columns[0]) && /pontos?$/i.test(columns[3])) return
    if (columns.length < 4) {
      errors.push(`Linha ${index + 1}: use Nome | Qualidade | Nível | Pontos.`)
      return
    }

    const name = columns[0].trim().slice(0, 50)
    const points = Number(columns[3])
    if (!name) {
      errors.push(`Linha ${index + 1}: informe o nome do vínculo.`)
    } else if (!Number.isInteger(points)) {
      errors.push(`Linha ${index + 1}: pontos devem ser um número inteiro.`)
    } else {
      bonds.push({ name, points })
    }
  })

  return { bonds, errors }
}
