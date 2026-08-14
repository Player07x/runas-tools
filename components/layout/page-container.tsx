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
    <main className={cn("mx-auto w-full max-w-5xl px-4 pb-24 pt-6 sm:pb-10", className)}>
      {(title || description) && (
        <div className="mb-6">
          {title && (
            <h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance sm:text-3xl">{title}</h1>
          )}
          {description && <p className="mt-1.5 text-sm text-muted-foreground text-pretty">{description}</p>}
        </div>
      )}
      {children}
    </main>
  )
}
