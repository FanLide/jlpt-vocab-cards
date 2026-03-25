import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { BookShelfPage } from './pages/BookShelf'
import { HomePage } from './pages/Home'
import { LessonPage } from './pages/Lesson'
import { SettingsPage } from './pages/Settings'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<BookShelfPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/book/:bookId" element={<HomePage />} />
        <Route path="/book/:bookId/lesson/:lessonId" element={<LessonPage />} />
      </Routes>
    </BrowserRouter>
  )
}
