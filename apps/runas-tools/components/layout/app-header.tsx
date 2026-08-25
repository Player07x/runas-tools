"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { User } from "lucide-react"
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
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ""
  return (
    <>
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-border/80 bg-background/95 shadow-[0_1px_0_rgba(20,25,40,0.02)] sm:bg-background/88 sm:backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="group flex items-center gap-2.5 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
            <span className="flex size-10 items-center justify-center overflow-hidden rounded-full bg-black shadow-[0_6px_18px_color-mix(in_srgb,var(--primary)_30%,transparent)] transition-transform group-hover:-rotate-3">
              <Image src={`${basePath}/icon-192.png`} alt="Logo Runas Tools" width={192} height={192} className="size-full object-cover" />
            </span>
            <span className="text-sm font-bold tracking-tight text-foreground sm:text-base">Runas Tools</span>
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
                    "rounded-xl px-2.5 py-2 text-sm font-semibold transition-all md:px-3.5",
                    active ? "bg-secondary text-secondary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                  )}
                >
                  <span className="md:hidden">{item.shortLabel}</span>
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              )
            })}
            <button
              type="button"
              onClick={open}
              className="ml-1 inline-flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:-translate-y-px hover:brightness-105"
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
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-3 text-sm font-semibold text-primary-foreground shadow-sm"
            >
              <User className="size-4" />
              Ficha
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-3 bottom-3 z-30 rounded-2xl border border-border bg-card p-1.5 shadow-[0_10px_24px_rgba(24,29,45,0.16)] sm:hidden">
        <div className="mx-auto flex max-w-md items-stretch justify-around">
          {navItems.map((item) => {
            const active = isActive(pathname, item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[0.68rem] font-semibold transition-colors min-[390px]:text-xs",
                  active ? "bg-secondary text-secondary-foreground" : "text-muted-foreground",
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
            className="flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[0.68rem] font-semibold text-muted-foreground min-[390px]:text-xs"
          >
            <User className="size-5" />
            Ficha
          </button>
        </div>
      </nav>
    </>
  )
}
