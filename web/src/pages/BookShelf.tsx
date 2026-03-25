import { Link } from 'react-router-dom'
import catalog from '../../../data/book-catalog.json'
import './BookShelf.css'

export function BookShelfPage() {
  return (
    <div className="shelf-page">
      <header className="shelf-header">
        <h1 className="shelf-title">我的单词书</h1>
        <Link to="/settings" className="shelf-settings-link">⚙</Link>
      </header>

      <div className="shelf-grid">
        {catalog.map((book) => (
          <Link
            key={book.id}
            to={`/book/${book.id}`}
            className="shelf-book-card"
            style={{ '--book-color': book.color } as React.CSSProperties}
          >
            <div className="shelf-book-spine" />
            <div className="shelf-book-body">
              <div className="shelf-book-level">{book.level}</div>
              <div className="shelf-book-title">{book.title}</div>
              <div className="shelf-book-title-ja">{book.titleJa}</div>
              <div className="shelf-book-desc">{book.desc}</div>
            </div>
            <div className="shelf-book-arrow">→</div>
          </Link>
        ))}

        {/* 占位：未来添加更多书 */}
        <div className="shelf-book-placeholder">
          <span>+ 更多教材</span>
          <span className="shelf-placeholder-sub">即将上线</span>
        </div>
      </div>
    </div>
  )
}
