import { Dices, Home, Images, Swords, type LucideIcon } from "lucide-react"

export interface NavItem {
  href: string
  label: string
  shortLabel: string
  icon: LucideIcon
}

export const navItems: NavItem[] = [
  { href: "/", label: "Início", shortLabel: "Início", icon: Home },
  { href: "/calculadora-dano", label: "Calculadora de Dano", shortLabel: "Dano", icon: Swords },
  { href: "/calculadora-testes", label: "Calculadora de Testes", shortLabel: "Testes", icon: Dices },
  { href: "/galeria-personagens", label: "Galeria de Personagens", shortLabel: "Galeria", icon: Images },
]
