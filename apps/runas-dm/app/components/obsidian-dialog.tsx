"use client"

import { useEffect, useState } from "react"
import { Check, Download, KeyRound, RefreshCw, Settings2, X } from "lucide-react"
import type { KnowledgeWorkspaceState } from "../lib/knowledge-model"
import { exportKnowledgeZip, syncWorkspaceToObsidian, testObsidianConnection, type ObsidianConnection } from "../lib/obsidian-sync"

const DEFAULT_URL = "https://127.0.0.1:27124"

export interface ObsidianPreferences { baseUrl: string; rootFolder: string; automatic: boolean }

export function readObsidianPreferences(): ObsidianPreferences {
  if (typeof window === "undefined") return { baseUrl: DEFAULT_URL, rootFolder: "Runas DM", automatic: false }
  try {
    const value = JSON.parse(localStorage.getItem("runas-dm.obsidian-preferences") ?? "null") as Partial<ObsidianPreferences> | null
    return { baseUrl: typeof value?.baseUrl === "string" ? value.baseUrl : DEFAULT_URL, rootFolder: typeof value?.rootFolder === "string" ? value.rootFolder : "Runas DM", automatic: value?.automatic === true }
  } catch { return { baseUrl: DEFAULT_URL, rootFolder: "Runas DM", automatic: false } }
}

export function readObsidianApiKey(): string {
  return typeof window === "undefined" ? "" : sessionStorage.getItem("runas-dm.obsidian-api-key") ?? ""
}

export function ObsidianDialog({ state, onClose, onPreferencesChange }: { state: KnowledgeWorkspaceState; onClose: () => void; onPreferencesChange: (value: ObsidianPreferences) => void }) {
  const [preferences, setPreferences] = useState<ObsidianPreferences>(() => readObsidianPreferences())
  const [apiKey, setApiKey] = useState(() => readObsidianApiKey())
  const [message, setMessage] = useState("")
  const [working, setWorking] = useState(false)

  useEffect(() => {
    localStorage.setItem("runas-dm.obsidian-preferences", JSON.stringify(preferences))
    sessionStorage.setItem("runas-dm.obsidian-api-key", apiKey)
    onPreferencesChange(preferences)
  }, [apiKey, onPreferencesChange, preferences])

  function connection(): ObsidianConnection { return { ...preferences, apiKey } }

  async function test() {
    setWorking(true); setMessage("Conectando ao Obsidian…")
    try { await testObsidianConnection(connection()); setMessage("Conexão confirmada. O Obsidian está pronto.") }
    catch { setMessage("Não foi possível conectar. Abra o Obsidian, ative Local REST API with MCP e confie no certificado local.") }
    finally { setWorking(false) }
  }

  async function synchronize() {
    setWorking(true); setMessage("Preparando páginas…")
    try {
      await syncWorkspaceToObsidian(state, connection(), (done, total) => setMessage(`Sincronizando ${done} de ${total} páginas…`))
      setMessage(`${state.pages.length} páginas sincronizadas com o Obsidian.`)
    } catch (error) { setMessage(error instanceof Error ? error.message : "Não foi possível sincronizar com o Obsidian.") }
    finally { setWorking(false) }
  }

  return <div className="knowledge-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose() }}><section className="obsidian-dialog" role="dialog" aria-modal="true" aria-labelledby="obsidian-title">
    <header><div><p className="eyebrow"><Settings2 size={15} /> Integração local</p><h2 id="obsidian-title">Obsidian</h2><p>Sincronize as páginas diretamente com seu vault ou baixe uma cópia completa em Markdown.</p></div><button className="icon-button" onClick={onClose} aria-label="Fechar"><X size={19} /></button></header>
    <div className="obsidian-setup-note"><strong>Preparação única</strong><span>Instale e ative o plugin comunitário <b>Local REST API with MCP</b>. No primeiro uso, abra o endereço HTTPS local no navegador e aceite o certificado do plugin.</span></div>
    <div className="obsidian-fields"><label><span>Endereço da API</span><input value={preferences.baseUrl} onChange={(event) => setPreferences((current) => ({ ...current, baseUrl: event.target.value }))} placeholder={DEFAULT_URL} /></label><label><span>Pasta dentro do vault</span><input value={preferences.rootFolder} onChange={(event) => setPreferences((current) => ({ ...current, rootFolder: event.target.value }))} placeholder="Runas DM" /></label><label className="wide"><span>Chave da API local</span><div className="secret-input"><KeyRound size={16} /><input type="password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} autoComplete="off" placeholder="Cole a chave exibida pelo plugin" /></div></label><label className="obsidian-auto"><input type="checkbox" checked={preferences.automatic} onChange={(event) => setPreferences((current) => ({ ...current, automatic: event.target.checked }))} /><span><strong>Sincronizar ao salvar</strong><small>Quando o Obsidian estiver aberto, cada página alterada será enviada automaticamente.</small></span></label></div>
    {message && <p className="obsidian-message"><Check size={15} /> {message}</p>}
    <footer><button className="secondary-button" onClick={() => exportKnowledgeZip(state)}><Download size={16} /> Exportar ZIP para Obsidian</button><span /><button className="secondary-button" disabled={working || !apiKey} onClick={() => void test()}>{working ? <RefreshCw className="spin" size={16} /> : <Check size={16} />} Testar conexão</button><button className="primary-button" disabled={working || !apiKey} onClick={() => void synchronize()}><RefreshCw className={working ? "spin" : ""} size={16} /> Sincronizar tudo</button></footer>
  </section></div>
}
