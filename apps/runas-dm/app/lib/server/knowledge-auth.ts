import { securelyEqual, securelyEqualBuffers } from "./secret-verification"

const encoder = new TextEncoder()
const SESSION_COOKIE = "runas-dm-knowledge-session"
const SESSION_DURATION_SECONDS = 60 * 60 * 12
const LOCAL_PREVIEW_VALUE = "local-preview"

function isLocalRequest(request: Request): boolean {
  const hostname = new URL(request.url).hostname
  return hostname === "localhost" || hostname === "127.0.0.1"
}

function base64UrlEncode(value: Uint8Array): string {
  let binary = ""
  for (const byte of value) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}

function base64UrlDecode(value: string): Uint8Array | null {
  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/")
    const binary = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "="))
    return Uint8Array.from(binary, (character) => character.charCodeAt(0))
  } catch {
    return null
  }
}

function parseCookies(request: Request): Map<string, string> {
  const cookies = new Map<string, string>()
  for (const pair of (request.headers.get("cookie") ?? "").split(";")) {
    const separator = pair.indexOf("=")
    if (separator < 1) continue
    cookies.set(pair.slice(0, separator).trim(), pair.slice(separator + 1).trim())
  }
  return cookies
}

async function sessionKey(): Promise<CryptoKey> {
  const { env } = await import("cloudflare:workers")
  const material = await crypto.subtle.digest("SHA-256", encoder.encode(`${env.RUNAS_DM_BACKUP_TOKEN}\u0000${env.RUNAS_DM_CAMPAIGN_PASSWORD}`))
  return crypto.subtle.importKey("raw", material, { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"])
}

export async function verifyKnowledgeCredentials(token: string, password: string): Promise<boolean> {
  const { env } = await import("cloudflare:workers")
  if (!env.RUNAS_DM_BACKUP_TOKEN || !env.RUNAS_DM_CAMPAIGN_PASSWORD) return false
  const [validToken, validPassword] = await Promise.all([
    securelyEqual(token, env.RUNAS_DM_BACKUP_TOKEN),
    securelyEqual(password, env.RUNAS_DM_CAMPAIGN_PASSWORD),
  ])
  return validToken && validPassword
}

export async function createKnowledgeSession(): Promise<string> {
  const payload = base64UrlEncode(encoder.encode(JSON.stringify({ scope: "knowledge", exp: Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS })))
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", await sessionKey(), encoder.encode(payload)))
  return `${payload}.${base64UrlEncode(signature)}`
}

export async function isKnowledgeAuthorized(request: Request): Promise<boolean> {
  const value = parseCookies(request).get(SESSION_COOKIE)
  if (!value) return false
  if (value === LOCAL_PREVIEW_VALUE) return isLocalRequest(request)
  const [payload, signatureValue, extra] = value.split(".")
  if (!payload || !signatureValue || extra) return false
  const signature = base64UrlDecode(signatureValue)
  const decoded = base64UrlDecode(payload)
  if (!signature || !decoded) return false
  const expected = new Uint8Array(await crypto.subtle.sign("HMAC", await sessionKey(), encoder.encode(payload)))
  if (!securelyEqualBuffers(signature, expected)) return false
  try {
    const session = JSON.parse(new TextDecoder().decode(decoded)) as { scope?: unknown; exp?: unknown }
    return session.scope === "knowledge" && typeof session.exp === "number" && session.exp > Math.floor(Date.now() / 1000)
  } catch {
    return false
  }
}

export function knowledgeSessionCookie(request: Request, value: string): string {
  const secure = new URL(request.url).protocol === "https:"
  return `${SESSION_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_DURATION_SECONDS}${secure ? "; Secure" : ""}`
}

export function localPreviewSession(request: Request): string | null {
  return isLocalRequest(request) ? LOCAL_PREVIEW_VALUE : null
}

export function clearKnowledgeSessionCookie(request: Request): string {
  const secure = new URL(request.url).protocol === "https:"
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure ? "; Secure" : ""}`
}
