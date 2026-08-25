import { defineConfig, globalIgnores } from "eslint/config"
import nextVitals from "eslint-config-next/core-web-vitals"
import nextTs from "eslint-config-next/typescript"

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Hidratação de localStorage e sincronização controlada do Tiptap exigem
      // atualização de estado em efeitos após o primeiro render do cliente.
      "react-hooks/set-state-in-effect": "off",
    },
  },
  globalIgnores([
    ".next/**",
    ".lighthouse-dist/**",
    ".lighthouseci/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
])
