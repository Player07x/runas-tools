import { describe, expect, it } from "vitest"
import { clampSimpleSheetWidth, plainTextSummary, simpleSheetWidthBounds } from "./simple-sheet"

describe("simple sheet helpers", () => {
  it("limits desktop resizing between half the viewport and the available width", () => {
    expect(simpleSheetWidthBounds(1440)).toEqual({ minimum: 720, maximum: 1392 })
    expect(clampSimpleSheetWidth(500, 1440)).toBe(720)
    expect(clampSimpleSheetWidth(1600, 1440)).toBe(1392)
  })

  it("keeps the editor full width on compact viewports", () => {
    expect(simpleSheetWidthBounds(600)).toEqual({ minimum: 600, maximum: 600 })
  })

  it("converts rich descriptions to a forty-character visual summary", () => {
    const summary = plainTextSummary("<p>Uma descrição &amp; bastante longa para a ação equipada.</p>")
    expect(summary).toHaveLength(40)
    expect(summary).toBe("Uma descrição & bastante longa para a a…")
  })
})
