"use client"

import { useMemo } from "react"
import { Network } from "lucide-react"
import { plainTextFromHtml, wikiLinkTitles, type KnowledgePage } from "../lib/knowledge-model"

export function KnowledgeGraph({ pages, onOpen }: { pages: KnowledgePage[]; onOpen: (page: KnowledgePage) => void }) {
  const graph = useMemo(() => {
    const byTitle = new Map(pages.map((page) => [page.title.trim().toLocaleLowerCase("pt-BR"), page.id]))
    const nodes = pages.map((page, index) => {
      const angle = pages.length <= 1 ? 0 : (index / pages.length) * Math.PI * 2 - Math.PI / 2
      const radiusX = pages.length <= 1 ? 0 : Math.min(390, 170 + pages.length * 9)
      const radiusY = pages.length <= 1 ? 0 : Math.min(245, 120 + pages.length * 5)
      return { page, x: 500 + Math.cos(angle) * radiusX, y: 325 + Math.sin(angle) * radiusY }
    })
    const nodeById = new Map(nodes.map((node) => [node.page.id, node]))
    const edgeKeys = new Set<string>()
    const edges: Array<{ source: typeof nodes[number]; target: typeof nodes[number] }> = []
    for (const node of nodes) {
      const implicit = wikiLinkTitles(plainTextFromHtml(node.page.contentHtml)).map((title) => byTitle.get(title.toLocaleLowerCase("pt-BR"))).filter((id): id is string => Boolean(id))
      for (const targetId of [...node.page.linkedPageIds, ...implicit]) {
        const target = nodeById.get(targetId)
        if (!target || target.page.id === node.page.id) continue
        const key = [node.page.id, target.page.id].sort().join(":")
        if (edgeKeys.has(key)) continue
        edgeKeys.add(key)
        edges.push({ source: node, target })
      }
    }
    return { nodes, edges }
  }, [pages])

  if (pages.length === 0) return <div className="knowledge-empty"><Network size={32} /><strong>O gráfico nasce junto com sua Wiki.</strong><p>Crie páginas e conecte-as para visualizar personagens, lugares e acontecimentos relacionados.</p></div>

  return <section className="knowledge-graph" aria-label="Gráfico de vínculos entre páginas"><svg viewBox="0 0 1000 650" role="img" aria-label={`${graph.nodes.length} páginas e ${graph.edges.length} vínculos`}>
    <g className="graph-edges">{graph.edges.map(({ source, target }) => <line key={`${source.page.id}-${target.page.id}`} x1={source.x} y1={source.y} x2={target.x} y2={target.y} />)}</g>
    <g className="graph-nodes">{graph.nodes.map(({ page, x, y }) => <g key={page.id} transform={`translate(${x} ${y})`} role="button" tabIndex={0} aria-label={`Abrir ${page.title}`} onClick={() => onOpen(page)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") onOpen(page) }}><circle r="31" /><circle className="graph-core" r="18" /><text y="48" textAnchor="middle">{page.title.length > 24 ? `${page.title.slice(0, 22)}…` : page.title}</text></g>)}</g>
  </svg></section>
}
