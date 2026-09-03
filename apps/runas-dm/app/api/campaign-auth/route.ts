import { NextResponse } from "next/server"
import { clearKnowledgeSessionCookie, createKnowledgeSession, isKnowledgeAuthorized, knowledgeSessionCookie, localPreviewSession, verifyKnowledgeCredentials } from "../../lib/server/knowledge-auth"

const noStoreHeaders = { "Cache-Control": "no-store" }

export async function GET(request: Request) {
  return NextResponse.json({ authenticated: await isKnowledgeAuthorized(request) }, { headers: noStoreHeaders })
}

export async function POST(request: Request) {
  const length = Number(request.headers.get("content-length") ?? 0)
  if (length > 16_384) return NextResponse.json({ error: "Solicitação muito grande." }, { status: 413, headers: noStoreHeaders })
  let body: { token?: unknown; password?: unknown; localPreview?: unknown }
  try {
    body = await request.json() as typeof body
  } catch {
    return NextResponse.json({ error: "Solicitação inválida." }, { status: 400, headers: noStoreHeaders })
  }

  const localSession = body.localPreview === true ? localPreviewSession(request) : null
  const valid = localSession || (typeof body.token === "string" && typeof body.password === "string" && await verifyKnowledgeCredentials(body.token, body.password))
  if (!valid) return NextResponse.json({ error: "Token ou senha incorretos." }, { status: 401, headers: noStoreHeaders })

  const response = NextResponse.json({ authenticated: true }, { headers: noStoreHeaders })
  response.headers.set("Set-Cookie", knowledgeSessionCookie(request, localSession ?? await createKnowledgeSession()))
  return response
}

export async function DELETE(request: Request) {
  const response = NextResponse.json({ authenticated: false }, { headers: noStoreHeaders })
  response.headers.set("Set-Cookie", clearKnowledgeSessionCookie(request))
  return response
}
