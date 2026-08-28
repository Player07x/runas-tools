import { describe, expect, it } from "vitest"
import { parseGalleryZip } from "@runas/core/lib/galleryImport"
import { createEmptyCharacter } from "./model"
import { createCharactersZip } from "./export"

describe("batch character export", () => {
  it("gera um ZIP compatível com o importador compartilhado e preserva nomes repetidos", async () => {
    const first = createEmptyCharacter("Sentinela")
    const second = createEmptyCharacter("Sentinela")
    second.info.race = "Constructo"
    const bytes = createCharactersZip([first, second])
    const buffer = new ArrayBuffer(bytes.byteLength)
    new Uint8Array(buffer).set(bytes)

    const result = await parseGalleryZip(new File([buffer], "fichas.zip", { type: "application/zip" }))

    expect(result.characters.map((entry) => entry.character.name)).toEqual(["Sentinela", "Sentinela"])
    expect(result.characters[1]?.character.info.race).toBe("Constructo")
    expect(result.characters[0]?.filename).not.toBe(result.characters[1]?.filename)
  })
})
