"use client"

import { CheckCircle2, Download, HardDriveDownload } from "lucide-react"
import { useEffect, useState } from "react"

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
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

  useEffect(() => {
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
          <p className="mt-2 text-xs font-medium text-highlight">
            Use a opção “Instalar aplicativo” ou “Adicionar à tela inicial” no menu do navegador.
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
