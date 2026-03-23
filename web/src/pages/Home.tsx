import { Link } from 'react-router-dom'
import { friendlyChapterTitle, friendlyLessonTitle, structure } from '../lib/data'

export function HomePage() {
  return (
    <div style={{ padding: 16, maxWidth: 980, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
        <h2 style={{ margin: 0 }}>
          {structure.book.title}（{structure.book.level}）
        </h2>
        <Link to="/settings">设置</Link>
      </div>
      <p style={{ opacity: 0.75 }}>选择章节与课程开始复习（音频与课程强绑定）。</p>

      {structure.chapters.map((ch) => (
        <div key={ch.id} style={{ marginTop: 18, paddingTop: 12, borderTop: '1px solid #eee' }}>
          <h3 style={{ margin: '8px 0' }}>{friendlyChapterTitle(ch)}</h3>
          <ul style={{ lineHeight: 1.9 }}>
            {ch.lessons.map((l) => (
              <li key={l.id}>
                <Link to={`/lesson/${l.id}`}>{friendlyLessonTitle(l)}</Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
