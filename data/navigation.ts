import { Home, Swords, type LucideIcon } from "lucide-react"

export interface NavItem {
  href: string
  label: string
  shortLabel: string
  icon: LucideIcon
}

export const navItems: NavItem[] = [
  { href: "/", label: "Início", shortLabel: "Início", icon: Home },
  { href: "/calculadora-dano", label: "Calculadora de Dano", shortLabel: "Dano", icon: Swords },
]
