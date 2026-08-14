import type React from "react"
import { cn } from "@/lib/utils"

interface SectionCardProps {
  title?: string
  description?: string
  /** Elemento exibido à direita do cabeçalho (ex: ações). */
  action?: React.ReactNode
  className?: string
  children: React.ReactNode
}

export function SectionCard({ title, description, action, className, children }: SectionCardProps) {
  return (
    <section className={cn("rounded-xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]", className)}>
      {(title || action) && (
        <header className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title && <h2 className="text-sm font-semibold tracking-tight text-card-foreground">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-muted-foreground text-pretty">{description}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  )
}
