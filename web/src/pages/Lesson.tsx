import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getLessonMeta, friendlyChapterTitle, friendlyLessonTitle } from '../lib/data'
import { loadLesson } from '../lib/lesson'
import { isAudioCached, precacheAudio } from '../lib/cacheAudio'
import { CardDeck } from '../components/CardDeck'
import { CardList } from '../components/CardList'
import { useLoopEnabled } from '../lib/settings'
import './Lesson.css'

export function LessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>()
  const meta = useMemo(() => (lessonId ? getLessonMeta(lessonId) : null), [lessonId])

  const [lesson, setLesson] = useState<Awaited<ReturnType<typeof loadLesson>>>(null)
  const [loopEnabled] = useLoopEnabled()
  const [cacheState, setCacheState] = useState<'unknown' | 'cached' | 'not-cached'>('unknown')
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'deck' | 'list'>('deck')
  const [pos, setPos] = useState(0)

  useEffect(() => {
    setError(null)
    setLesson(null)
    if (!lessonId) return
    loadLesson(lessonId)
      .then((x) => setLesson(x))
      .catch((e) => setError(String(e)))
  }, [lessonId])

  const audioBase = import.meta.env.VITE_AUDIO_BASE_URL as string | undefined
  const audioUrl = lesson?.audio?.track
    ? `${audioBase ?? ''}${lesson.audio.track}.mp3`
    : lesson?.audio?.file
      ? `/${lesson.audio.file}`
      : null

  useEffect(() => {
    if (!audioUrl) return
    isAudioCached(audioUrl)
      .then((ok) => setCacheState(ok ? 'cached' : 'not-cached'))
      .catch(() => setCacheState('unknown'))
  }, [audioUrl])

  const onPrecache = async () => {
    if (!audioUrl) return
    setDownloading(true)
    setError(null)
    try {
      await precacheAudio(audioUrl)
      setCacheState('cached')
    } catch (e) {
      setError(String(e))
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="lesson-page">
      <div className="lesson-back">
        <Link to="/">← 返回</Link>
      </div>

      <div className="lesson-header">
        <h2 className="lesson-title">{meta ? friendlyLessonTitle(meta.lesson) : lessonId}</h2>
        {meta && <div className="lesson-chapter">{friendlyChapterTitle(meta.chapter)}</div>}
      </div>

      {error && (
        <div className="lesson-error">⚠ {error}</div>
      )}

      {lesson ? (
        <>
          {/* 音频栏 */}
          <div className="audio-bar">
            <div className="audio-bar-top">
              <span className="audio-label">🎵 {lesson.audio?.track ?? '音频'}</span>
              <button
                className={`audio-cache-btn ${cacheState === 'cached' ? 'cached' : ''}`}
                onClick={onPrecache}
                disabled={downloading || !audioUrl}
              >
                {downloading ? '下载中…' : cacheState === 'cached' ? '✓ 已缓存' : '⬇ 预缓存'}
              </button>
            </div>
            {audioUrl
              ? <audio className="audio-player" controls preload="metadata" src={audioUrl} />
              : <div className="audio-missing">暂无音频</div>
            }
          </div>

          {/* 模式切换 */}
          <div className="mode-tabs">
            <button
              className={`mode-tab ${mode === 'deck' ? 'active' : ''}`}
              onClick={() => setMode('deck')}
            >卡片</button>
            <button
              className={`mode-tab ${mode === 'list' ? 'active' : ''}`}
              onClick={() => setMode('list')}
            >列表</button>
          </div>

          {/* 内容区 */}
          {mode === 'deck' ? (
            <CardDeck cards={lesson.cards} loop={loopEnabled} pos={pos} onPosChange={setPos} />
          ) : (
            <CardList
              cards={lesson.cards}
              onSelect={(p) => { setPos(p); setMode('deck') }}
            />
          )}
        </>
      ) : !error ? (
        <div className="lesson-empty">该课程尚未导入文本数据。</div>
      ) : null}
    </div>
  )
}
