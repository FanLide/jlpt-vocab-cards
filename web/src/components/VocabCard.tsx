import { useEffect, useRef, useState } from 'react'
import type { Card } from '../lib/lesson'

export function VocabCard({ card, variant = 'plain' }: { card: Card; variant?: 'plain' | 'poker' }) {
  const [revealed, setRevealed] = useState(false)
  const timer = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [])

  const onPointerDown = () => {
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setRevealed(true), 1000)
  }

  const onPointerUpOrLeave = () => {
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = null
    setRevealed(false)
  }

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUpOrLeave}
      onPointerCancel={onPointerUpOrLeave}
      onPointerLeave={onPointerUpOrLeave}
      style={{
        userSelect: 'none',
        border: '1px solid #e7e7e7',
        borderRadius: variant === 'poker' ? 18 : 12,
        padding: variant === 'poker' ? 20 : 16,
        minHeight: variant === 'poker' ? 260 : 180,
        background:
          variant === 'poker'
            ? 'linear-gradient(180deg, #ffffff 0%, #fbfbfb 100%)'
            : '#fff',
        boxShadow: variant === 'poker' ? '0 10px 30px rgba(0,0,0,0.08)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 10,
      }}
    >
      {!revealed ? (
        <>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{card.index}</div>
          <div style={{ fontSize: 24 }}>{card.reading}</div>
          <div style={{ opacity: 0.6, fontSize: 12 }}>长按 1 秒显示答案（松开隐藏）</div>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{card.word}</div>
            <div style={{ opacity: 0.7 }}>{card.reading}</div>
          </div>
          <div>
            <div>
              <b>中文</b>：{card.meaning.zh}
            </div>
            {card.meaning.en ? (
              <div>
                <b>English</b>：{card.meaning.en}
              </div>
            ) : null}
          </div>
          {card.sentence ? (
            <div style={{ marginTop: 8 }}>
              <div>
                <b>例句</b>：{card.sentence.ja}
              </div>
              {card.sentence.zh ? <div style={{ opacity: 0.85 }}>{card.sentence.zh}</div> : null}
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
