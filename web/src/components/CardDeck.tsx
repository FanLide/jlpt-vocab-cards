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

type AnimState = {
  outCard: Card
  inCard: Card
  dir: 'left' | 'right'
  id: number
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
  const total   = cards.length
  const [toast, setToast] = useState<string | null>(null)

  const canPrev = loop || pos > 0
  const canNext = loop || pos < total - 1

  const getRawPrev = useCallback(() => {
    if (pos > 0) return pos - 1
    if (loop)    return total - 1
    return null
  }, [loop, pos, total])

  const getRawNext = useCallback(() => {
    if (pos < total - 1) return pos + 1
    if (loop)            return 0
    return null
  }, [loop, pos, total])

  // ── 双卡叠加动画 ──────────────────────────────────────────────
  const [anim, setAnim] = useState<AnimState | null>(null)
  const animTimerRef    = useRef<number | null>(null)
  const animIdRef       = useRef(0)

  const triggerAnim = useCallback(
    (dir: 'left' | 'right', nextPos: number) => {
      const outCard = cards[pos]
      const inCard  = cards[nextPos]
      if (!outCard || !inCard) return

      if (animTimerRef.current) window.clearTimeout(animTimerRef.current)
      animIdRef.current += 1
      const id = animIdRef.current
      setAnim({ outCard, inCard, dir, id })
      setPosValue(nextPos)

      animTimerRef.current = window.setTimeout(() => {
        setAnim(a => (a?.id === id ? null : a))
      }, 380)
    },
    [cards, pos, setPosValue]
  )

  const prevWithAnim = useCallback(() => {
    const n = getRawPrev()
    if (n === null) return
    triggerAnim('right', n)
  }, [getRawPrev, triggerAnim])

  const nextWithAnim = useCallback(() => {
    const n = getRawNext()
    if (n === null) return
    triggerAnim('left', n)
  }, [getRawNext, triggerAnim])

  // ── 滑动手势 ─────────────────────────────────────────────────
  const start = useRef<{ x: number; y: number; t: number } | null>(null)
  const onPointerDown = (e: React.PointerEvent) => {
    start.current = { x: e.clientX, y: e.clientY, t: Date.now() }
  }
  const onPointerCancel = () => { start.current = null }
  const onPointerUp = (e: React.PointerEvent) => {
    if (!start.current) return
    const dx = e.clientX - start.current.x
    const dy = e.clientY - start.current.y
    const dt = Date.now() - start.current.t
    start.current = null
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.2 || dt > 800) return
    if (dx < 0) nextWithAnim(); else prevWithAnim()
  }

  const minIndex   = cards[0]?.index
  const maxIndex   = cards[cards.length - 1]?.index
  const clearToast = useCallback(() => setToast(null), [])

  if (!current) return <div className="deck-empty">本课暂无卡片</div>

  return (
    <div className="card-deck">
      {/* 进度条工具栏 */}
      <div className="deck-toolbar">
        <span className="deck-pos">
          {pos + 1}<span className="deck-total">/{total}</span>
        </span>
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
            const n  = Number(el.value.trim())
            const p  = cards.findIndex((c) => c.index === n)
            if (p >= 0) { setPosValue(p); el.value = ''; el.blur() }
            else setToast(`没有编号 ${n}`)
          }}
        />
        {onToggleMode && (
          <button className="deck-list-btn" onClick={onToggleMode} title="切换列表">☰</button>
        )}
      </div>

      {/* 卡片舞台 */}
      <div
        className="deck-stage"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      >
        {anim ? (
          <>
            {/* 旧卡飞出 */}
            <div key={`out-${anim.id}`} className={`deck-card-slot deck-out-${anim.dir}`}>
              <VocabCard card={anim.outCard} />
            </div>
            {/* 新卡飞入 */}
            <div key={`in-${anim.id}`} className={`deck-card-slot deck-in-${anim.dir}`}>
              <VocabCard card={anim.inCard} />
            </div>
          </>
        ) : (
          <div className="deck-card-slot">
            <VocabCard card={current} />
          </div>
        )}
      </div>

      {/* 底部导航 */}
      <div className="deck-nav">
        <button className="deck-btn" onClick={prevWithAnim} disabled={!canPrev}>← 上一张</button>
        <span className="deck-hint">左右滑动</span>
        <button className="deck-btn" onClick={nextWithAnim} disabled={!canNext}>下一张 →</button>
      </div>

      <Toast message={toast} onClose={clearToast} />
    </div>
  )
}
