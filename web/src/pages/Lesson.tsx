import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getLessonMeta, friendlyLessonTitle, getNextLessonId, getBookEntry, loadBookStructure, type BookStructure } from '../lib/data'
import { loadLesson } from '../lib/lesson'
import { isAudioCached, precacheAudio } from '../lib/cacheAudio'
import { CardDeck } from '../components/CardDeck'
import { CardList } from '../components/CardList'
import { useLoopEnabled, useAutoNextLesson, useAutoPlayOnDeckEnter } from '../lib/settings'
import './Lesson.css'

export function LessonPage() {
  const { bookId, lessonId } = useParams<{ bookId: string; lessonId: string }>()
  const bookEntry = bookId ? getBookEntry(bookId) : null
  const lessonDir = bookEntry?.lessonDir ?? 'n2'
  const [structure, setStructure] = useState<BookStructure | null>(null)
  const meta = useMemo(() => (lessonId && structure ? getLessonMeta(lessonId, structure) : null), [lessonId, structure])

  const [lesson, setLesson] = useState<Awaited<ReturnType<typeof loadLesson>>>(null)
  const navigate = useNavigate()
  const [loopEnabled]  = useLoopEnabled()
  const [autoNext]     = useAutoNextLesson()
  const [autoPlayOnDeckEnter] = useAutoPlayOnDeckEnter()
  const [cacheState, setCacheState] = useState<'unknown' | 'cached' | 'not-cached'>('unknown')
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'deck' | 'list'>('deck')
  const [pos, setPos] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (!bookId) return
    loadBookStructure(bookId).then(setStructure)
  }, [bookId])

  useEffect(() => {
    setError(null)
    setLesson(null)
    if (!lessonId) return
    loadLesson(lessonId, lessonDir)
      .then((x) => setLesson(x))
      .catch((e) => setError(String(e)))
  }, [lessonId, lessonDir])

  const audioBaseByBook = {
    n2: import.meta.env.VITE_AUDIO_BASE_URL_N2 as string | undefined,
    n3: import.meta.env.VITE_AUDIO_BASE_URL_N3 as string | undefined,
  }
  const sharedAudioBase = import.meta.env.VITE_AUDIO_BASE_URL as string | undefined
  const resolvedAudioBase = audioBaseByBook[lessonDir as 'n2' | 'n3']
    ?? (sharedAudioBase
      ? `${sharedAudioBase.replace(/\/?$/, '/')}${lessonDir}/`
      : undefined)
  const audioUrl = lesson?.audio?.track
    ? resolvedAudioBase
      ? `${resolvedAudioBase}${lesson.audio.track}.mp3`
      : lesson?.audio?.file
        ? `/${lesson.audio.file}`
        : null
    : lesson?.audio?.file
      ? `/${lesson.audio.file}`
      : null

  useEffect(() => {
    if (!audioUrl) return
    isAudioCached(audioUrl)
      .then((ok) => setCacheState(ok ? 'cached' : 'not-cached'))
      .catch(() => setCacheState('unknown'))
  }, [audioUrl])

  useEffect(() => {
    if (mode !== 'deck' || !audioUrl || !autoPlayOnDeckEnter) return
    const audio = audioRef.current
    if (!audio) return
    const tryPlay = async () => {
      try {
        await audio.play()
      } catch {
        // ignore autoplay rejection
      }
    }
    void tryPlay()
  }, [mode, audioUrl, autoPlayOnDeckEnter, lessonId])

  const onPrecache = async () => {
    if (!audioUrl) return
    setDownloading(true)
    setError(null)
    try {
      await precacheAudio(audioUrl)
      setCacheState('cached')
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg)
    } finally {
      setDownloading(false)
    }
  }

  const onBack = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    if (bookId) navigate(`/book/${bookId}`, { replace: true })
    else navigate('/', { replace: true })
  }

  return (
    <div className={`lesson-page${mode === 'list' ? ' list-mode' : ''}`}>

      {/* 顶栏：返回 + 课程名 + 下载按钮一行 */}
      <div className="lesson-topbar">
        <Link to={bookId ? `/book/${bookId}` : '/'} className="lesson-back-btn" onClick={onBack}>←</Link>
        <span className="lesson-topbar-title">
          {meta ? friendlyLessonTitle(meta.lesson) : lessonId}
        </span>
        {lesson && audioUrl && (
          <button
            className={`audio-cache-btn ${cacheState === 'cached' ? 'cached' : ''}`}
            onClick={onPrecache}
            disabled={downloading || !audioUrl}
          >
            {downloading ? '…' : cacheState === 'cached' ? '✓' : '⬇'}
          </button>
        )}
      </div>

      {error && <div className="lesson-error">⚠ {error}</div>}

      {lesson ? (
        <>
          {/* 音频：播放条占满宽度，绑定 loop / autoNext */}
          {audioUrl && (
            <div className="audio-row">
              <audio
                ref={audioRef}
                className="audio-player"
                controls
                preload="metadata"
                src={audioUrl}
                loop={loopEnabled}
                onEnded={() => {
                  if (autoNext && lessonId && structure) {
                    const nextId = getNextLessonId(lessonId, structure)
                    if (nextId) navigate(`/book/${bookId}/lesson/${nextId}`, { replace: true })
                  }
                }}
              />
            </div>
          )}

          {/* 卡片区 */}
          {mode === 'deck' ? (
            <CardDeck
              cards={lesson.cards}
              loop={loopEnabled}
              pos={pos}
              onPosChange={setPos}
              onToggleMode={() => setMode('list')}
            />
          ) : (
            <div className="list-mode-container">
              <div className="list-header">
                <span className="list-title">列表</span>
                <button className="mode-switch-btn" onClick={() => setMode('deck')}>卡片模式</button>
              </div>
              <CardList
                cards={lesson.cards}
                onSelect={(p) => { setPos(p); setMode('deck') }}
              />
            </div>
          )}
        </>
      ) : !error ? (
        <div className="lesson-empty">该课程尚未导入文本数据。</div>
      ) : null}
    </div>
  )
}
