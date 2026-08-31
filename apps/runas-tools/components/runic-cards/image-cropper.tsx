"use client"

import { useEffect, useId, useRef, useState } from "react"
import { Crop, ImagePlus } from "lucide-react"
import { Button } from "@/components/ui/button"

const ART_WIDTH = 1260
const ART_HEIGHT = 1760
const MAX_IMAGE_BYTES = 15 * 1024 * 1024

interface ImageCropperProps {
  currentImage: string
  onApply: (dataUrl: string) => void
}

export function ImageCropper({ currentImage, onApply }: ImageCropperProps) {
  const inputId = useId()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [source, setSource] = useState("")
  const [zoom, setZoom] = useState(1)
  const [positionX, setPositionX] = useState(0)
  const [positionY, setPositionY] = useState(0)
  const [stretchX, setStretchX] = useState(1)
  const [stretchY, setStretchY] = useState(1)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!source) return
    const image = new Image()
    image.onload = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const context = canvas.getContext("2d")
      if (!context) return

      const baseScale = Math.max(ART_WIDTH / image.naturalWidth, ART_HEIGHT / image.naturalHeight)
      const scale = baseScale * zoom
      const width = image.naturalWidth * scale * stretchX
      const height = image.naturalHeight * scale * stretchY
      const overflowX = Math.max(0, width - ART_WIDTH)
      const overflowY = Math.max(0, height - ART_HEIGHT)
      const x = (ART_WIDTH - width) / 2 + (positionX / 100) * (overflowX / 2)
      const y = (ART_HEIGHT - height) / 2 + (positionY / 100) * (overflowY / 2)

      context.fillStyle = "#252832"
      context.fillRect(0, 0, ART_WIDTH, ART_HEIGHT)
      context.drawImage(image, x, y, width, height)
    }
    image.onerror = () => setError("Não foi possível ler esta imagem.")
    image.src = source
  }, [positionX, positionY, source, stretchX, stretchY, zoom])

  function chooseImage(file: File | undefined) {
    if (!file) return
    if (!file.type.startsWith("image/")) {
      setError("Escolha um arquivo de imagem.")
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("A imagem deve ter no máximo 15 MB.")
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setSource(typeof reader.result === "string" ? reader.result : "")
      setZoom(1)
      setPositionX(0)
      setPositionY(0)
      setStretchX(1)
      setStretchY(1)
      setError("")
    }
    reader.onerror = () => setError("Não foi possível abrir a imagem.")
    reader.readAsDataURL(file)
  }

  function applyCrop() {
    const canvas = canvasRef.current
    if (!canvas || !source) return
    onApply(canvas.toDataURL("image/jpeg", 0.92))
  }

  return (
    <div className="rounded-2xl border border-border bg-muted/25 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-foreground">Arte da carta</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Recorte vertical em 63:88; a arte ocupa o fundo inteiro e fica incorporada ao JSON.</p>
        </div>
        <label htmlFor={inputId} className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground transition hover:bg-muted">
          <ImagePlus className="size-4" />
          Escolher imagem
        </label>
        <input id={inputId} className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => chooseImage(event.target.files?.[0])} />
      </div>

      {source ? (
        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_15rem]">
          <div className="overflow-hidden rounded-xl border-2 border-dashed border-primary/35 bg-panel">
            <canvas ref={canvasRef} width={ART_WIDTH} height={ART_HEIGHT} className="mx-auto block aspect-[63/88] h-auto max-h-[34rem] w-auto max-w-full" />
          </div>
          <div className="space-y-3">
            <RangeControl label="Zoom" value={zoom} min={1} max={2.5} step={0.01} onChange={setZoom} />
            <RangeControl label="Esticar largura" value={stretchX} min={0.65} max={2.25} step={0.01} onChange={setStretchX} />
            <RangeControl label="Esticar altura" value={stretchY} min={0.65} max={2.25} step={0.01} onChange={setStretchY} />
            <RangeControl label="Horizontal" value={positionX} min={-100} max={100} step={1} onChange={setPositionX} />
            <RangeControl label="Vertical" value={positionY} min={-100} max={100} step={1} onChange={setPositionY} />
            <Button type="button" className="w-full" onClick={applyCrop}>
              <Crop className="size-4" />
              Aplicar recorte
            </Button>
          </div>
        </div>
      ) : currentImage ? (
        <p className="mt-3 rounded-xl border border-border/70 bg-background/70 px-3 py-2 text-xs text-muted-foreground">A carta já possui uma arte recortada. Escolha outra imagem para substituí-la.</p>
      ) : null}
      {error && <p role="alert" className="mt-3 text-sm font-medium text-destructive">{error}</p>}
    </div>
  )
}

function RangeControl({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (value: number) => void }) {
  return (
    <label className="block text-xs font-medium text-muted-foreground">
      <span className="mb-1 flex justify-between"><span>{label}</span><span className="tabular-nums">{value.toFixed(step < 1 ? 2 : 0)}</span></span>
      <input className="w-full accent-primary" type="range" value={value} min={min} max={max} step={step} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  )
}
