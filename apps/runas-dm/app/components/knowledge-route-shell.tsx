"use client"

import type { ReactNode } from "react"
import { usePathname } from "next/navigation"
import { KnowledgePortal } from "./knowledge-portal"

export function KnowledgeRouteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  return <><KnowledgePortal area={pathname.startsWith("/campaigns") ? "campaigns" : "wiki"} />{children}</>
}
