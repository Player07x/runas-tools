"use client"

import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

type Accent = "purple" | "blue" | "yellow"

const accentClasses: Record<Accent, string> = {
  purple: "bg-purple-soft text-purple-foreground",
  blue: "bg-blue-soft text-blue-foreground",
  yellow: "bg-yellow-soft text-yellow-foreground",
}

interface ToolCardProps {
  title: string
  description: string
  icon: LucideIcon
  accent?: Accent
  href?: string
  onClick?: () => void
  actionLabel?: string
  comingSoon?: boolean
}

export function ToolCard({
  title,
  description,
  icon: Icon,
  accent = "purple",
  href,
  onClick,
  actionLabel,
  comingSoon,
}: ToolCardProps) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className={cn("flex size-10 items-center justify-center rounded-lg", accentClasses[accent])}>
          <Icon className="size-5" />
        </span>
        {comingSoon && (
          <span className="rounded-full bg-muted px-2.5 py-1 text-[0.7rem] font-medium text-muted-foreground">
            Em breve
          </span>
        )}
      </div>
      <div className="mt-4">
        <h3 className="text-base font-semibold tracking-tight text-card-foreground text-balance">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground text-pretty">{description}</p>
      </div>
      {!comingSoon && actionLabel && (
        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
          {actionLabel}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      )}
    </>
  )

  const base = "flex flex-col rounded-xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
  const interactive = "group transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"

  if (comingSoon) {
    return <div className={cn(base, "opacity-60")}>{content}</div>
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cn(base, interactive, "text-left")}>
        {content}
      </button>
    )
  }

  if (href) {
    return (
      <Link href={href} className={cn(base, interactive)}>
        {content}
      </Link>
    )
  }

  return <div className={cn(base, "opacity-60")}>{content}</div>
}
