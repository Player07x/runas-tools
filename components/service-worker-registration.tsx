"use client"

import { useEffect } from "react"

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return

    let registrationTimeout: ReturnType<typeof setTimeout> | undefined
    const scheduleRegistration = () => {
      registrationTimeout = setTimeout(() => {
        const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ""
        void navigator.serviceWorker
          .register(`${basePath}/sw.js`, { scope: `${basePath || ""}/` })
          .catch(() => undefined)
      }, 8_000)
    }

    if (document.readyState === "complete") scheduleRegistration()
    else window.addEventListener("load", scheduleRegistration, { once: true })

    return () => {
      window.removeEventListener("load", scheduleRegistration)
      if (registrationTimeout) clearTimeout(registrationTimeout)
    }
  }, [])

  return null
}
