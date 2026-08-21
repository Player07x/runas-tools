import { Analytics } from "@vercel/analytics/next"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Suspense } from "react"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { CharacterProvider } from "@/components/character/character-provider"
import { CharacterPanelProvider } from "@/components/character/character-panel"
import { AppHeader } from "@/components/layout/app-header"
import { ServiceWorkerRegistration } from "@/components/service-worker-registration"

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" })

export const metadata: Metadata = {
  title: "Calculadora de Runas",
  description: "Uma coleção de ferramentas para facilitar partidas de Runas: Livro Azul.",
  generator: "v0.app",
}

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f4f8" },
    { media: "(prefers-color-scheme: dark)", color: "#1d2230" },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable} bg-background`} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <CharacterProvider>
            <CharacterPanelProvider>
              <Suspense fallback={null}>
                <AppHeader />
              </Suspense>
              {children}
            </CharacterPanelProvider>
          </CharacterProvider>
        </ThemeProvider>
        <ServiceWorkerRegistration />
        {process.env.VERCEL === "1" && <Analytics />}
      </body>
    </html>
  )
}
