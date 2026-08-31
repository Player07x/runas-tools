"use client"

import { forwardRef } from "react"
import { getCharacterElement } from "@runas/core/data/elements"
import { cn } from "@/lib/utils"
import { getDamageLabel, getRarity, type RunicCard } from "@/lib/runicCards"

function sanitizeRichText(html: string): string {
  return html
    .replace(/<!--([\s\S]*?)-->/g, "")
    .replace(/<(script|style|iframe|object|embed)[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<(?!\/?(?:p|strong|em|u|ul|ol|li|br)\b)[^>]*>/gi, "")
    .replace(/<(p|strong|em|u|ul|ol|li|br)\b[^>]*>/gi, "<$1>")
}

interface RunicCardPreviewProps {
  card: RunicCard
  className?: string
}

function textLength(html: string): number {
  return html.replace(/<[^>]*>/g, " ").replace(/&[^;]+;/g, " ").replace(/\s+/g, " ").trim().length
}

export const RunicCardPreview = forwardRef<HTMLDivElement, RunicCardPreviewProps>(function RunicCardPreview(
  { card, className },
  ref,
) {
  const element = getCharacterElement(card.elementId)
  const rarity = getRarity(card.rarity)
  const hasCombatStats = card.kind === "adventurer" || card.kind === "troop"
  const hasCenterResource = card.kind !== "equipment"
  const resource = card.kind === "adventurer" ? `+${card.energyGain}` : card.cost
  const kindLabel = card.kind === "adventurer" ? "Aventureiro" : card.kind === "troop" ? "Tropa" : card.kind === "spell" ? "Magia" : "Equipamento"
  const color = element?.color ?? "#667085"
  const rulesLength = textLength(card.rulesHtml)
  const flavorLength = card.flavorText.trim().length

  return (
    <div className={cn("runic-card-shell", className)}>
      <article
        ref={ref}
        data-kind={card.kind}
        className="runic-card"
        style={{ "--runic-element": color } as React.CSSProperties}
        aria-label={`Prévia da carta ${card.name || "sem nome"}`}
      >
        {card.artDataUrl && <div className="runic-card__full-art" style={{ backgroundImage: `url(${card.artDataUrl})` }} />}
        <header className="runic-card__header">
          <div className="runic-card__element">{element?.name ?? "Sem elemento"}</div>
          <div className="runic-card__title-row">
            <h2>{card.name || "Carta sem nome"}</h2>
            <div className="runic-card__header-meta">
              {card.kind !== "spell" && <span>{card.type || kindLabel}</span>}
              {card.kind !== "adventurer" && <strong>{rarity.label} · {rarity.copies}</strong>}
            </div>
          </div>
        </header>

        <div className="runic-card__art">
          {!card.artDataUrl && (
            <div className="runic-card__art-placeholder">
              <span>ᚱ</span>
              <p>Escolha e recorte a arte da carta</p>
            </div>
          )}
          <div className="runic-card__art-shade" />
          {hasCombatStats && (
            <div className="runic-card__damage-badge" aria-label={`${card.damage} de dano ${getDamageLabel(card.damageKind)}`}>
              <strong>{card.damage}</strong>
              <span>{getDamageLabel(card.damageKind)}</span>
            </div>
          )}
        </div>

        {(hasCombatStats || hasCenterResource) && (
          <div className={cn("runic-card__stat-band", card.kind === "spell" && "runic-card__stat-band--spell")}>
            {hasCombatStats ? (
              <>
                <div className="runic-card__stat runic-card__stat--life">
                  <span className="runic-card__stat-gem" aria-hidden="true">
                    <svg viewBox="0 0 100 100" focusable="false"><polygon points="50,94 8,54 8,27 23,10 40,10 50,21 60,10 77,10 92,27 92,54" /></svg>
                  </span>
                  <span>VIDA</span><strong>{card.life}</strong>
                </div>
                <div aria-hidden="true" />
                <div className="runic-card__stat runic-card__stat--aura"><strong>{card.aura}</strong><span>AURA</span><span className="runic-card__stat-gem" aria-hidden="true" /></div>
              </>
            ) : (
              <>
                <div className="runic-card__spell-meta"><span>{card.type || "Magia"}</span></div>
                <div className="runic-card__spell-meta runic-card__spell-meta--right"><span>{element?.name ?? "Sem elemento"}</span></div>
              </>
            )}
            {hasCenterResource && (
              <div className="runic-card__resource">
                <strong>{resource}</strong>
                {card.kind !== "adventurer" && <span>CUSTO</span>}
              </div>
            )}
          </div>
        )}

        <div className="runic-card__body">
          <div className="runic-card__body-content">
            <div
              className={cn("runic-card__rules", rulesLength > 420 && "runic-card__rules--dense", rulesLength > 220 && rulesLength <= 420 && "runic-card__rules--medium")}
              dangerouslySetInnerHTML={{ __html: sanitizeRichText(card.rulesHtml) }}
            />
            {card.flavorText && <p className={cn("runic-card__flavor", flavorLength > 210 && "runic-card__flavor--dense", flavorLength > 100 && flavorLength <= 210 && "runic-card__flavor--medium")}>“{card.flavorText}”</p>}
          </div>
        </div>

        <footer className="runic-card__footer">
          <span>ORDEM × CAOS</span>
          <span>RÚNICA</span>
        </footer>
      </article>
    </div>
  )
})
