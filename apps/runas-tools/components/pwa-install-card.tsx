"use client"

import { CheckCircle2, Download, HardDriveDownload } from "lucide-react"
import { useEffect, useState } from "react"

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}

type BrowserKind = "chrome" | "edge" | "firefox" | "opera" | "other"

const browserGuides: Record<BrowserKind, { name: string; instruction: string }> = {
  chrome: { name: "Google Chrome", instruction: "Abra ⋮, escolha “Transmitir, salvar e compartilhar” e depois “Instalar página como app”. Você também pode usar o ícone de instalação na barra de endereços." },
  edge: { name: "Microsoft Edge", instruction: "Abra …, entre em “Aplicativos” e escolha “Instalar este site como um aplicativo”. O ícone de instalação também pode aparecer na barra de endereços." },
  firefox: { name: "Mozilla Firefox", instruction: "No Firefox atualizado para Windows, clique no botão de aplicativos web na barra de endereços. Se ele não aparecer, mantenha esta página salva e use Chrome, Edge ou Opera para instalar como aplicativo." },
  opera: { name: "Opera", instruction: "Clique no ícone de instalação exibido na barra de endereços. Se ele não aparecer, abra o menu do Opera e procure a opção para instalar ou salvar a página como aplicativo." },
  other: { name: "Seu navegador", instruction: "Procure “Instalar aplicativo”, “Instalar página como app” ou “Adicionar à tela inicial” no menu do navegador." },
}

function detectBrowser(): BrowserKind {
  const agent = navigator.userAgent
  if (/OPR\//i.test(agent) || /Opera/i.test(agent)) return "opera"
  if (/Edg\//i.test(agent)) return "edge"
  if (/Firefox\//i.test(agent)) return "firefox"
  if (/Chrome\//i.test(agent) || /CriOS\//i.test(agent)) return "chrome"
  return "other"
}

function isStandalone(): boolean {
  return window.matchMedia("(display-mode: standalone)").matches
    || ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
}

async function persistStorage() {
  if (navigator.storage?.persist) await navigator.storage.persist().catch(() => false)
}

export function PwaInstallCard() {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(() => typeof window !== "undefined" && isStandalone())
  const [showHelp, setShowHelp] = useState(false)
  const [offlineReady, setOfflineReady] = useState(false)
  const [browser, setBrowser] = useState<BrowserKind>("other")

  useEffect(() => {
    setBrowser(detectBrowser())
    const handlePrompt = (event: Event) => {
      event.preventDefault()
      setPromptEvent(event as InstallPromptEvent)
    }
    const handleInstalled = () => {
      setInstalled(true)
      setPromptEvent(null)
      void persistStorage()
    }
    const handleReady = () => setOfflineReady(true)
    window.addEventListener("beforeinstallprompt", handlePrompt)
    window.addEventListener("appinstalled", handleInstalled)
    window.addEventListener("runas-pwa-ready", handleReady)
    void navigator.serviceWorker?.ready.then(handleReady)
    return () => {
      window.removeEventListener("beforeinstallprompt", handlePrompt)
      window.removeEventListener("appinstalled", handleInstalled)
      window.removeEventListener("runas-pwa-ready", handleReady)
    }
  }, [])

  if (installed) return null

  async function install() {
    if (!promptEvent) {
      setShowHelp(true)
      return
    }
    await promptEvent.prompt()
    const choice = await promptEvent.userChoice
    if (choice.outcome === "accepted") await persistStorage()
    setPromptEvent(null)
  }

  return (
    <aside className="mb-8 flex flex-col gap-4 rounded-2xl border border-border bg-card/80 px-5 py-4 shadow-sm sm:flex-row sm:items-center">
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-highlight/10 text-highlight">
        <HardDriveDownload className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="text-sm font-bold text-foreground">Leve o Runas Tools com você</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Instale neste dispositivo para abrir as fichas e calculadoras mesmo sem internet.
        </p>
        {showHelp && !promptEvent && (
          <p className="mt-2 flex items-start gap-2 text-xs font-medium leading-relaxed text-highlight">
            <span className="rounded-md bg-highlight/10 px-2 py-0.5 font-bold">{browserGuides[browser].name}</span>
            <span>{browserGuides[browser].instruction}</span>
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {offlineReady && <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="size-4" /> Offline pronto</span>}
        <button type="button" onClick={() => void install()} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-highlight px-4 text-sm font-bold text-white transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight focus-visible:ring-offset-2">
          <Download className="size-4" /> Instalar
        </button>
      </div>
    </aside>
  )
}
