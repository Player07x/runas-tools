"use client"

import type React from "react"
import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore } from "react"
import { isRulesetId, type RulesetId } from "@runas/ruleset-contracts"
import { getRulesetDefinition } from "@/data/rulesets"

const ACTIVE_RULESET_STORAGE_KEY = "runas-tools:active-ruleset"
const ACTIVE_RULESET_CHANGE_EVENT = "runas-tools:active-ruleset-change"
let sessionRuleset: RulesetId = "runas-blue"

function readStoredRuleset(): RulesetId {
  try {
    const stored = window.localStorage.getItem(ACTIVE_RULESET_STORAGE_KEY)
    return isRulesetId(stored) ? stored : sessionRuleset
  } catch {
    return sessionRuleset
  }
}

function subscribeToStoredRuleset(onStoreChange: () => void): () => void {
  function handleStorage(event: StorageEvent) {
    if (event.key === ACTIVE_RULESET_STORAGE_KEY) onStoreChange()
  }

  window.addEventListener("storage", handleStorage)
  window.addEventListener(ACTIVE_RULESET_CHANGE_EVENT, onStoreChange)
  return () => {
    window.removeEventListener("storage", handleStorage)
    window.removeEventListener(ACTIVE_RULESET_CHANGE_EVENT, onStoreChange)
  }
}

interface RulesetContextValue {
  activeRulesetId: RulesetId
  activeRuleset: ReturnType<typeof getRulesetDefinition>
  selectRuleset: (id: RulesetId) => void
  isReady: boolean
}

const RulesetContext = createContext<RulesetContextValue | null>(null)

export function RulesetProvider({ children }: { children: React.ReactNode }) {
  const activeRulesetId = useSyncExternalStore(subscribeToStoredRuleset, readStoredRuleset, (): RulesetId => "runas-blue")
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    document.documentElement.dataset.ruleset = activeRulesetId
  }, [activeRulesetId])

  useEffect(() => {
    setIsReady(true)
  }, [])

  const selectRuleset = useCallback((id: RulesetId) => {
    sessionRuleset = id
    try {
      window.localStorage.setItem(ACTIVE_RULESET_STORAGE_KEY, id)
    } catch {
      // A seleção continua válida durante a sessão.
    }
    window.dispatchEvent(new Event(ACTIVE_RULESET_CHANGE_EVENT))
  }, [])

  const value = useMemo(() => ({
    activeRulesetId,
    activeRuleset: getRulesetDefinition(activeRulesetId),
    selectRuleset,
    isReady,
  }), [activeRulesetId, isReady, selectRuleset])

  return <RulesetContext.Provider value={value}>{children}</RulesetContext.Provider>
}

export function useRuleset(): RulesetContextValue {
  const context = useContext(RulesetContext)
  if (!context) throw new Error("useRuleset deve ser usado dentro de <RulesetProvider>")
  return context
}
