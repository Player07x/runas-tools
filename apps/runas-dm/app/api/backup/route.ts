import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { getDb } from "../../../db"
import { backupSnapshots } from "../../../db/schema"
import { verifyBackupBearer } from "../../lib/server/secret-verification"

const PRIVATE_SLOT = "primary"

export async function GET(request: Request) {
  if (!await verifyBackupBearer(request)) return NextResponse.json({ error: "Não autorizado." }, { status: 401 })
  const db = await getDb()
  const [snapshot] = await db.select().from(backupSnapshots).where(eq(backupSnapshots.id, PRIVATE_SLOT)).limit(1)
  if (!snapshot) return NextResponse.json({ state: null, updatedAt: null })
  return NextResponse.json({ state: JSON.parse(snapshot.payload), updatedAt: snapshot.updatedAt })
}

export async function PUT(request: Request) {
  if (!await verifyBackupBearer(request)) return NextResponse.json({ error: "Não autorizado." }, { status: 401 })
  const state: unknown = await request.json()
  const payload = JSON.stringify(state)
  const updatedAt = Date.now()
  if (payload.length > 8_000_000) return NextResponse.json({ error: "Backup muito grande." }, { status: 413 })
  const db = await getDb()
  await db.insert(backupSnapshots).values({ id: PRIVATE_SLOT, payload, updatedAt }).onConflictDoUpdate({
    target: backupSnapshots.id,
    set: { payload, updatedAt },
  })
  return NextResponse.json({ ok: true, updatedAt })
}
