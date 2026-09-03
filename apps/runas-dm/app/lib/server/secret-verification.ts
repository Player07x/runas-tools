const encoder = new TextEncoder()

const workerSubtle = crypto.subtle as SubtleCrypto & {
  timingSafeEqual(a: ArrayBuffer | ArrayBufferView, b: ArrayBuffer | ArrayBufferView): boolean
}

export function securelyEqualBuffers(provided: ArrayBuffer | ArrayBufferView, expected: ArrayBuffer | ArrayBufferView): boolean {
  if (typeof workerSubtle.timingSafeEqual === "function") return workerSubtle.timingSafeEqual(provided, expected)
  const left = new Uint8Array(provided instanceof ArrayBuffer ? provided : provided.buffer, provided instanceof ArrayBuffer ? 0 : provided.byteOffset, provided.byteLength)
  const right = new Uint8Array(expected instanceof ArrayBuffer ? expected : expected.buffer, expected instanceof ArrayBuffer ? 0 : expected.byteOffset, expected.byteLength)
  if (left.byteLength !== right.byteLength) return false
  let difference = 0
  for (let index = 0; index < left.byteLength; index += 1) difference |= left[index] ^ right[index]
  return difference === 0
}

export async function securelyEqual(provided: string, expected: string): Promise<boolean> {
  const [providedHash, expectedHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(provided)),
    crypto.subtle.digest("SHA-256", encoder.encode(expected)),
  ])
  return securelyEqualBuffers(providedHash, expectedHash)
}

export async function verifyBackupBearer(request: Request): Promise<boolean> {
  const { env } = await import("cloudflare:workers")
  const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? ""
  return Boolean(env.RUNAS_DM_BACKUP_TOKEN && provided && await securelyEqual(provided, env.RUNAS_DM_BACKUP_TOKEN))
}
