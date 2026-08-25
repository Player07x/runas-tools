"use client"

import { CheckCircle2, Download, HardDriveDownload, Info } from "lucide-react"
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
  other: { name: "seu navegador", instruction: "Procure “Instalar aplicativo”, “Instalar página como app” ou “Adicionar à tela inicial” no menu do navegador." },
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
  const [offlineReady, setOfflineReady] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const browser = typeof navigator === "undefined" ? "other" : detectBrowser()

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
    <div><strong>Instalar Runas DM</strong><p>Use fichas, testes e dano offline neste dispositivo. O backup remoto volta quando houver conexão.</p>{showHelp && !promptEvent && <small className="browser-install-guide"><Info size={13} /><span><b>{browserGuides[browser].name}</b>{browserGuides[browser].instruction}</span></small>}</div>
    <div className="install-actions">{offlineReady && <span><CheckCircle2 size={14} /> Offline pronto</span>}<button className="primary-button" onClick={() => void install()}><Download size={16} /> Instalar</button></div>
  </aside>
}
