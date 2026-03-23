import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { HomePage } from './pages/Home'
import { LessonPage } from './pages/Lesson'
import { SettingsPage } from './pages/Settings'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/lesson/:lessonId" element={<LessonPage />} />
      </Routes>
    </BrowserRouter>
  )
}
