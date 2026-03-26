import { useEffect, useRef, useState } from 'react'
import type { Card } from '../lib/lesson'
import './VocabCard.css'

export function VocabCard({ card }: { card: Card; variant?: 'plain' | 'poker' }) {
  const [revealed, setRevealed] = useState(false)
  const timer = useRef<number | null>(null)

  useEffect(() => {
    return () => { if (timer.current) window.clearTimeout(timer.current) }
  }, [])

  const onPointerDown = () => {
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setRevealed(true), 400)
  }

  const onPointerUpOrLeave = () => {
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = null
    setRevealed(false)
  }

  return (
    <div
      className={`vocab-card ${revealed ? 'revealed' : ''}`}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUpOrLeave}
      onPointerCancel={onPointerUpOrLeave}
      onPointerLeave={onPointerUpOrLeave}
    >
      <div className="vocab-card-inner">
        {/* 正面：显示编号 + 读音 */}
        <div className="vocab-card-front">
          <div className="card-front-body">
            <div className="card-reading">{card.reading || card.word}</div>
          </div>
          <div className="card-hint">长按显示答案</div>
        </div>

        {/* 背面：答案 */}
        <div className="vocab-card-back">
          <div className="card-index-back">No. {card.index}</div>
          <div className="card-back-header">
            <span className="card-word">{card.word}</span>
            <span className="card-reading-small">{card.reading}</span>
          </div>
          <div className="card-meanings">
            <div className="card-meaning-row">
              <span className="card-meaning-lang">中</span>
              <span>{card.meaning.zh}</span>
            </div>
            {card.meaning.en && (
              <div className="card-meaning-row">
                <span className="card-meaning-lang">EN</span>
                <span>{card.meaning.en}</span>
              </div>
            )}
          </div>
          {card.sentence && (
            <div className="card-sentence">
              <div className="card-sentence-ja">{card.sentence.ja}</div>
              {card.sentence.zh && (
                <div className="card-sentence-zh">{card.sentence.zh}</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
