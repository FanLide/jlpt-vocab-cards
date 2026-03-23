import { useCallback, useMemo, useRef, useState } from 'react'
import type { Card } from '../lib/lesson'
import { VocabCard } from './VocabCard'
import { Toast } from './Toast'

type Props = {
  cards: Card[]
  loop: boolean
  pos?: number
  onPosChange?: (pos: number) => void
}

export function CardDeck({ cards, loop, pos: controlledPos, onPosChange }: Props) {
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

  // Swipe handling
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

    const minIndex = cards[0]?.index
    const maxIndex = cards[cards.length - 1]?.index

    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ opacity: 0.75 }}>{pos + 1} / {total}</div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            inputMode="numeric"
            placeholder={minIndex && maxIndex ? `跳到编号（${minIndex}~${maxIndex}）` : '跳到编号'}
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return
              const el = e.target as HTMLInputElement
              const v = el.value.trim()
              const n = Number(v)
              if (!Number.isFinite(n)) {
                setToast('请输入数字编号')
                return
              }
              const p = cards.findIndex((c) => c.index === n)
              if (p >= 0) {
                setPosValue(p)
                el.blur()
              } else {
                setToast(`本课没有编号 ${n}`)
              }
            }}
            style={{
              width: 170,
              padding: '8px 10px',
              borderRadius: 10,
              border: '1px solid #e6e6e6',
            }}
          />
          <button onClick={prev} disabled={!canPrev}>← 上一张</button>
          <button onClick={next} disabled={!canNext}>下一张 →</button>
        </div>
      </div>
    )
  }, [canNext, canPrev, cards, current, pos, prev, next, setPosValue, total])

  const clearToast = useCallback(() => setToast(null), [])

  if (!current) return <div style={{ opacity: 0.7 }}>本课暂无卡片</div>

  return (
    <div onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerCancel={onPointerCancel} style={{ touchAction: 'pan-y' }}>
      {header}

      <div style={{ marginTop: 12 }}>
        <VocabCard key={current.id} card={current} variant="poker" />
      </div>

      <div style={{ marginTop: 10, opacity: 0.65, fontSize: 12 }}>
        手势：左滑下一张、右滑上一张；长按 1 秒显示答案（松开隐藏）。
      </div>

      <Toast message={toast} onClose={clearToast} />
    </div>
  )
}
