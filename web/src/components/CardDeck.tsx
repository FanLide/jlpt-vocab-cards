import { useCallback, useMemo, useRef, useState } from 'react'
import type { Card } from '../lib/lesson'
import { VocabCard } from './VocabCard'

type Props = {
  cards: Card[]
  loop: boolean
}

export function CardDeck({ cards, loop }: Props) {
  const [pos, setPos] = useState(0)

  const current = cards[pos]
  const total = cards.length

  const canPrev = loop || pos > 0
  const canNext = loop || pos < total - 1

  const prev = useCallback(() => {
    if (total === 0) return
    setPos((p) => {
      if (p > 0) return p - 1
      return loop ? total - 1 : p
    })
  }, [loop, total])

  const next = useCallback(() => {
    if (total === 0) return
    setPos((p) => {
      if (p < total - 1) return p + 1
      return loop ? 0 : p
    })
  }, [loop, total])

  // Swipe handling
  const start = useRef<{ x: number; y: number; t: number } | null>(null)
  const onPointerDown = (e: React.PointerEvent) => {
    start.current = { x: e.clientX, y: e.clientY, t: Date.now() }
  }

  const onPointerUp = (e: React.PointerEvent) => {
    if (!start.current) return
    const dx = e.clientX - start.current.x
    const dy = e.clientY - start.current.y
    const dt = Date.now() - start.current.t
    start.current = null

    // horizontal swipe: enough distance, relatively quick, mostly horizontal
    const absX = Math.abs(dx)
    const absY = Math.abs(dy)
    if (absX < 50) return
    if (absX < absY * 1.2) return
    if (dt > 800) return

    if (dx < 0) next()
    else prev()
  }

  const header = useMemo(() => {
    if (!current) return null
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div style={{ opacity: 0.75 }}>
          {pos + 1} / {total}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={prev} disabled={!canPrev}>
            ← 上一张
          </button>
          <button onClick={next} disabled={!canNext}>
            下一张 →
          </button>
        </div>
      </div>
    )
  }, [canNext, canPrev, current, next, pos, prev, total])

  if (!current) return <div style={{ opacity: 0.7 }}>本课暂无卡片</div>

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      style={{ touchAction: 'pan-y' }}
    >
      {header}

      <div style={{ marginTop: 12 }}>
        <VocabCard key={current.id} card={current} variant="poker" />
      </div>

      <div style={{ marginTop: 10, opacity: 0.65, fontSize: 12 }}>
        手势：左滑下一张、右滑上一张；长按 1 秒显示答案（松开隐藏）。
      </div>
    </div>
  )
}
