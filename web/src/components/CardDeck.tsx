import { useCallback, useRef, useState } from 'react'

import type { Card } from '../lib/lesson'
import { VocabCard } from './VocabCard'
import { Toast } from './Toast'
import './CardDeck.css'

type Props = {
  cards: Card[]
  loop: boolean
  pos?: number
  onPosChange?: (pos: number) => void
  onToggleMode?: () => void
}

export function CardDeck({ cards, loop, pos: controlledPos, onPosChange, onToggleMode }: Props) {
  const [innerPos, setInnerPos] = useState(0)
  const pos = controlledPos ?? innerPos

  const setPosValue = useCallback(
    (next: number) => {
      if (controlledPos === undefined) setInnerPos(next)
      onPosChange?.(next)
    },
    [controlledPos, onPosChange]
  )

  const current = cards[pos]
  const total = cards.length
  const [toast, setToast] = useState<string | null>(null)

  const canPrev = loop || pos > 0
  const canNext = loop || pos < total - 1

  const prev = useCallback(() => {
    if (total === 0) return
    if (pos > 0) return setPosValue(pos - 1)
    if (loop) return setPosValue(total - 1)
  }, [loop, pos, setPosValue, total])

  const next = useCallback(() => {
    if (total === 0) return
    if (pos < total - 1) return setPosValue(pos + 1)
    if (loop) return setPosValue(0)
  }, [loop, pos, setPosValue, total])

  // Swipe
  const start = useRef<{ x: number; y: number; t: number } | null>(null)
  const onPointerDown = (e: React.PointerEvent) => {
    start.current = { x: e.clientX, y: e.clientY, t: Date.now() }
  }
  const onPointerCancel = () => { start.current = null }


  const minIndex = cards[0]?.index
  const maxIndex = cards[cards.length - 1]?.index
  const clearToast = useCallback(() => setToast(null), [])

  // slide direction for animation
  const [slideDir, setSlideDir] = useState<'left' | 'right' | null>(null)
  const [animKey, setAnimKey] = useState(0)

  const prevWithAnim = useCallback(() => {
    setSlideDir('right')
    setAnimKey(k => k + 1)
    prev()
  }, [prev])

  const nextWithAnim = useCallback(() => {
    setSlideDir('left')
    setAnimKey(k => k + 1)
    next()
  }, [next])

  // override swipe to use animated versions
  const onPointerUpAnimated = (e: React.PointerEvent) => {
    if (!start.current) return
    const dx = e.clientX - start.current.x
    const dy = e.clientY - start.current.y
    const dt = Date.now() - start.current.t
    start.current = null
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.2 || dt > 800) return
    if (dx < 0) nextWithAnim(); else prevWithAnim()
  }

  if (!current) return <div className="deck-empty">本课暂无卡片</div>

  return (
    <div className="card-deck">
      {/* 进度 + 跳转 + 列表切换 — 一行 */}
      <div className="deck-toolbar">
        <span className="deck-pos">{pos + 1}<span className="deck-total">/{total}</span></span>
        <div className="deck-progress-bar">
          <div className="deck-progress-fill" style={{ width: `${((pos + 1) / total) * 100}%` }} />
        </div>
        <input
          className="deck-jump-input"
          inputMode="numeric"
          placeholder={minIndex && maxIndex ? `${minIndex}–${maxIndex}` : '#'}
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return
            const el = e.target as HTMLInputElement
            const n = Number(el.value.trim())
            const p = cards.findIndex((c) => c.index === n)
            if (p >= 0) { setPosValue(p); el.value = ''; el.blur() }
            else setToast(`没有编号 ${n}`)
          }}
        />
        {onToggleMode && (
          <button className="deck-list-btn" onClick={onToggleMode} title="切换列表">☰</button>
        )}
      </div>

      {/* 卡片区：flex-grow 撑满剩余空间 */}
      <div
        className="deck-card-area"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUpAnimated}
        onPointerCancel={onPointerCancel}
      >
        <div
          key={animKey}
          className={`deck-slide deck-slide-${slideDir ?? 'none'}`}
        >
          <VocabCard key={current.id} card={current} />
        </div>
      </div>

      {/* 底部左右按钮 */}
      <div className="deck-nav">
        <button className="deck-btn" onClick={prevWithAnim} disabled={!canPrev}>← 上一张</button>
        <span className="deck-hint">左右滑动</span>
        <button className="deck-btn" onClick={nextWithAnim} disabled={!canNext}>下一张 →</button>
      </div>

      <Toast message={toast} onClose={clearToast} />
    </div>
  )
}
