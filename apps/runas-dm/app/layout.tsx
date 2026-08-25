import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { ServiceWorkerRegistration } from "./components/service-worker-registration"

const geist = Geist({ variable: "--font-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Runas DM",
  description: "Bestiário e ferramentas integradas para mestres do sistema Runas.",
  icons: {
    icon: [{ url: "/icon-192.png", type: "image/png", sizes: "192x192" }],
    apple: [{ url: "/icon-192.png", type: "image/png", sizes: "192x192" }],
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR" data-theme="dark" suppressHydrationWarning><body className={`${geist.variable} ${geistMono.variable}`}>{children}<ServiceWorkerRegistration /></body></html>
}
