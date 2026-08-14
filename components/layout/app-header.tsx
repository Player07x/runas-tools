"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Dices, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { navItems } from "@/data/navigation"
import { ThemeToggle } from "./theme-toggle"
import { useCharacterPanel } from "@/components/character/character-panel"

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/"
  return pathname.startsWith(href)
}

export function AppHeader() {
  const pathname = usePathname()
  const { open } = useCharacterPanel()
  return (
    <>
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-4 px-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Dices className="size-4.5" />
            </span>
            <span className="text-sm font-semibold tracking-tight text-foreground">Calculadora de Runas</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 sm:flex">
            {navItems.map((item) => {
              const active = isActive(pathname, item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                    active ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              )
            })}
            <button
              type="button"
              onClick={open}
              className="ml-1 inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
            >
              <User className="size-4" />
              Ficha
            </button>
            <div className="ml-1">
              <ThemeToggle />
            </div>
          </nav>

          {/* Mobile: theme toggle in top bar */}
          <div className="flex items-center gap-1 sm:hidden">
            <button
              type="button"
              onClick={open}
              className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground"
            >
              <User className="size-4" />
              Ficha
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur-md sm:hidden">
        <div className="mx-auto flex max-w-md items-stretch justify-around px-2 py-1.5">
          {navItems.map((item) => {
            const active = isActive(pathname, item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-w-16 flex-col items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="size-5" />
                {item.shortLabel}
              </Link>
            )
          })}
          <button
            type="button"
            onClick={open}
            className="flex min-w-16 flex-col items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground"
          >
            <User className="size-5" />
            Ficha
          </button>
        </div>
      </nav>
    </>
  )
}
