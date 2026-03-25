import { Link } from 'react-router-dom'
import { friendlyChapterTitle, structure } from '../lib/data'
import './Home.css'

export function HomePage() {
  return (
    <div className="home-page">
      <header className="home-header">
        <div>
          <h1 className="home-title">{structure.book.title}</h1>
          <p className="home-subtitle">选择课程开始复习</p>
        </div>
        <Link to="/settings" className="home-settings-link">⚙ 设置</Link>
      </header>

      <div className="chapter-list">
        {structure.chapters.map((ch) => (
          <div key={ch.id} className="chapter-card">
            <h2 className="chapter-title">{friendlyChapterTitle(ch)}</h2>
            <div className="lesson-grid">
              {ch.lessons.map((l) => (
                <Link key={l.id} to={`/lesson/${l.id}`} className="lesson-item">
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
