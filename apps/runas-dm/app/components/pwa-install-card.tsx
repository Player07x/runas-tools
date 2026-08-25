"use client"

import { CheckCircle2, Download, HardDriveDownload, Info } from "lucide-react"
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
  const [offlineReady, setOfflineReady] = useState(false)
  const [showHelp, setShowHelp] = useState(false)

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

  return <aside className="install-card">
    <span className="install-rune"><HardDriveDownload size={20} /></span>
    <div><strong>Instalar Runas DM</strong><p>Use fichas, testes e dano offline neste dispositivo. O backup remoto volta quando houver conexão.</p>{showHelp && !promptEvent && <small><Info size={13} /> No menu do navegador, escolha “Instalar aplicativo” ou “Adicionar à tela inicial”.</small>}</div>
    <div className="install-actions">{offlineReady && <span><CheckCircle2 size={14} /> Offline pronto</span>}<button className="primary-button" onClick={() => void install()}><Download size={16} /> Instalar</button></div>
  </aside>
}
