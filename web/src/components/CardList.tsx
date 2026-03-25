import { useCallback, useMemo, useState } from 'react'
import type { Card } from '../lib/lesson'
import { Toast } from './Toast'
import './CardList.css'

function norm(s: string) {
  return s.toLowerCase().trim()
}

function cardHaystack(c: Card) {
  return norm(
    [
      String(c.index),
      c.word,
      c.reading,
      c.meaning?.zh ?? '',
      c.meaning?.en ?? '',
      c.sentence?.ja ?? '',
      c.sentence?.zh ?? '',
    ].join(' | ')
  )
}

export function CardList({
  cards,
  onSelect,
}: {
  cards: Card[]
  onSelect: (pos: number) => void
}) {
  const [q, setQ] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const clearToast = useCallback(() => setToast(null), [])

  const filtered = useMemo(() => {
    const qq = norm(q)
    if (!qq) return cards.map((c, pos) => ({ c, pos }))
    return cards
      .map((c, pos) => ({ c, pos, h: cardHaystack(c) }))
      .filter((x) => x.h.includes(qq))
      .map(({ c, pos }) => ({ c, pos }))
  }, [cards, q])

  return (
    <div className="card-list">
      <div className="card-list-search-row">
        <input
          className="card-list-search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜索单词、读音、中文…"
        />
        <span className="card-list-count">{filtered.length}/{cards.length}</span>
      </div>

      <div className="card-list-items">
        {filtered.map(({ c, pos }, i) => (
          <button
            key={c.id}
            className={`card-list-item${i === filtered.length - 1 ? ' last' : ''}`}
            onClick={() => onSelect(pos)}
          >
            <span className="card-list-index">#{c.index}</span>
            <span className="card-list-main">
              <span className="card-list-reading">{c.reading}</span>
              <span className="card-list-zh">{c.meaning?.zh}</span>
            </span>
            <span className="card-list-word">{c.word}</span>
          </button>
        ))}
      </div>

      <Toast message={toast} onClose={clearToast} />
    </div>
  )
}
