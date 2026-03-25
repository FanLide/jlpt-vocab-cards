import { Link, useParams } from 'react-router-dom'
import { friendlyChapterTitle, structure } from '../lib/data'
import './Home.css'

export function HomePage() {
  const { bookId } = useParams<{ bookId: string }>()

  return (
    <div className="home-page">
      <header className="home-header">
        <div className="home-header-left">
          <Link to="/" className="home-back-link">← 书架</Link>
          <h2 className="home-title">{structure.book.title}</h2>
        </div>
        <Link to="/settings" className="home-settings-link">⚙ 设置</Link>
      </header>

      <div className="chapter-list">
        {structure.chapters.map((ch) => (
          <div key={ch.id} className="chapter-card">
            <h3 className="chapter-title">{friendlyChapterTitle(ch)}</h3>
            <div className="lesson-grid">
              {ch.lessons.map((l) => (
                <Link key={l.id} to={`/book/${bookId}/lesson/${l.id}`} className="lesson-item">
                  <span className="lesson-num">{l.index}</span>
                  <span className="lesson-name">{l.titleJa}</span>
                  <span className="lesson-zh">{l.titleZh}</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
