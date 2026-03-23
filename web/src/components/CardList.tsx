import type { Card } from '../lib/lesson'

export function CardList({
  cards,
  onSelect,
}: {
  cards: Card[]
  onSelect: (index: number) => void
}) {
  return (
    <div style={{ border: '1px solid #eee', borderRadius: 12, overflow: 'hidden' }}>
      {cards.map((c, i) => (
        <button
          key={c.id}
          onClick={() => onSelect(i)}
          style={{
            width: '100%',
            textAlign: 'left',
            padding: '12px 14px',
            border: 'none',
            borderBottom: i === cards.length - 1 ? 'none' : '1px solid #f1f1f1',
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
  )
}
