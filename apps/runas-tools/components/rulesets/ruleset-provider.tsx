"use client"

import type React from "react"
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { isRulesetId, type RulesetId } from "@runas/ruleset-contracts"
import { getRulesetDefinition } from "@/data/rulesets"

const ACTIVE_RULESET_STORAGE_KEY = "runas-tools:active-ruleset"

interface RulesetContextValue {
  activeRulesetId: RulesetId
  activeRuleset: ReturnType<typeof getRulesetDefinition>
  selectRuleset: (id: RulesetId) => void
  isReady: boolean
}

const RulesetContext = createContext<RulesetContextValue | null>(null)

export function RulesetProvider({ children }: { children: React.ReactNode }) {
  const [activeRulesetId, setActiveRulesetId] = useState<RulesetId>("runas-blue")
  const [isReady, setIsReady] = useState(false)

  const applyRuleset = useCallback((id: RulesetId) => {
    setActiveRulesetId(id)
    document.documentElement.dataset.ruleset = id
  }, [])

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(ACTIVE_RULESET_STORAGE_KEY)
      applyRuleset(isRulesetId(stored) ? stored : "runas-blue")
    } catch {
      applyRuleset("runas-blue")
    } finally {
      setIsReady(true)
    }
  }, [applyRuleset])

  const selectRuleset = useCallback((id: RulesetId) => {
    applyRuleset(id)
    try {
      window.localStorage.setItem(ACTIVE_RULESET_STORAGE_KEY, id)
    } catch {
      // A seleção continua válida durante a sessão.
    }
  }, [applyRuleset])

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
