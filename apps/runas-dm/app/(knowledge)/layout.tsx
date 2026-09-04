import type { ReactNode } from "react"
import { KnowledgeRouteShell } from "../components/knowledge-route-shell"

export default function KnowledgeLayout({ children }: { children: ReactNode }) {
  return <KnowledgeRouteShell>{children}</KnowledgeRouteShell>
}
