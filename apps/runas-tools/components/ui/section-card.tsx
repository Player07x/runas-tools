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
    <section className={cn("rounded-2xl border border-border/90 bg-card p-5 shadow-[0_10px_30px_rgba(30,36,55,0.06)] sm:p-6", className)}>
      {(title || action) && (
        <header className="mb-5 flex items-start justify-between gap-3">
          <div>
            {title && <h2 className="text-lg font-bold tracking-tight text-card-foreground">{title}</h2>}
            {description && <p className="mt-1 text-sm leading-relaxed text-muted-foreground text-pretty">{description}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  )
}
