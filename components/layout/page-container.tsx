import type React from "react"
import { cn } from "@/lib/utils"

interface PageContainerProps {
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function PageContainer({ title, description, children, className }: PageContainerProps) {
  return (
    <main className={cn("mx-auto w-full max-w-6xl px-4 pb-28 pt-8 sm:px-6 sm:pb-14 sm:pt-10", className)}>
      {(title || description) && (
        <div className="mb-8 max-w-2xl">
          {title && (
            <h1 className="text-3xl font-bold tracking-[-0.03em] text-foreground text-balance sm:text-4xl">{title}</h1>
          )}
          {description && <p className="mt-2 text-base leading-relaxed text-muted-foreground text-pretty">{description}</p>}
        </div>
      )}
      {children}
    </main>
  )
}
