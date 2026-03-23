import { useMemo, useState } from 'react'
import type { Card } from '../lib/lesson'

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

  const filtered = useMemo(() => {
    const qq = norm(q)
    if (!qq) return cards.map((c, pos) => ({ c, pos }))
    return cards
      .map((c, pos) => ({ c, pos, h: cardHaystack(c) }))
      .filter((x) => x.h.includes(qq))
      .map(({ c, pos }) => ({ c, pos }))
  }, [cards, q])

  const jumpTo = (value: string) => {
    const n = Number(value)
    if (!Number.isFinite(n)) return
    const pos = cards.findIndex((c) => c.index === n)
    if (pos >= 0) onSelect(pos)
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜索：编号/平假名/单词/中文/英文/例句"
          style={{
            flex: '1 1 260px',
            padding: '10px 12px',
            borderRadius: 10,
            border: '1px solid #e6e6e6',
          }}
        />
        <input
          inputMode="numeric"
          placeholder="跳到编号"
          onKeyDown={(e) => {
            if (e.key === 'Enter') jumpTo((e.target as HTMLInputElement).value)
          }}
          style={{
            width: 120,
            padding: '10px 12px',
            borderRadius: 10,
            border: '1px solid #e6e6e6',
          }}
        />
        <div style={{ opacity: 0.7, fontSize: 12 }}>{filtered.length}/{cards.length}</div>
      </div>

      <div style={{ marginTop: 10, border: '1px solid #eee', borderRadius: 12, overflow: 'hidden' }}>
        {filtered.map(({ c, pos }, i) => (
          <button
            key={c.id}
            onClick={() => onSelect(pos)}
            style={{
              width: '100%',
              textAlign: 'left',
              padding: '12px 14px',
              border: 'none',
              borderBottom: i === filtered.length - 1 ? 'none' : '1px solid #f1f1f1',
              background: '#fff',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <b>{c.index}</b> {c.reading}
              </div>
              <div style={{ opacity: 0.55, fontSize: 12 }}>点按进入</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
