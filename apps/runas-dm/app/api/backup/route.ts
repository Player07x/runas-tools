import { env } from "cloudflare:workers"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { getDb } from "../../../db"
import { backupSnapshots } from "../../../db/schema"

const PRIVATE_SLOT = "primary"

function isAuthorized(request: Request): boolean {
  const expected = (env as unknown as { RUNAS_DM_BACKUP_TOKEN?: string }).RUNAS_DM_BACKUP_TOKEN
  const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
  return Boolean(expected && provided && expected === provided)
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) return NextResponse.json({ error: "Não autorizado." }, { status: 401 })
  const [snapshot] = await getDb().select().from(backupSnapshots).where(eq(backupSnapshots.id, PRIVATE_SLOT)).limit(1)
  if (!snapshot) return NextResponse.json({ state: null, updatedAt: null })
  return NextResponse.json({ state: JSON.parse(snapshot.payload), updatedAt: snapshot.updatedAt })
}

export async function PUT(request: Request) {
  if (!isAuthorized(request)) return NextResponse.json({ error: "Não autorizado." }, { status: 401 })
  const state: unknown = await request.json()
  const payload = JSON.stringify(state)
  const updatedAt = Date.now()
  if (payload.length > 8_000_000) return NextResponse.json({ error: "Backup muito grande." }, { status: 413 })
  await getDb().insert(backupSnapshots).values({ id: PRIVATE_SLOT, payload, updatedAt }).onConflictDoUpdate({
    target: backupSnapshots.id,
    set: { payload, updatedAt },
  })
  return NextResponse.json({ ok: true, updatedAt })
}
