import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getLessonMeta, friendlyChapterTitle, friendlyLessonTitle } from '../lib/data'
import { loadLesson } from '../lib/lesson'
import { isAudioCached, precacheAudio } from '../lib/cacheAudio'
import { CardDeck } from '../components/CardDeck'
import { CardList } from '../components/CardList'
import { useLoopEnabled } from '../lib/settings'

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
    <div style={{ padding: 16, maxWidth: 980, margin: '0 auto' }}>
      <div style={{ marginBottom: 12 }}>
        <Link to="/">← 返回目录</Link>
      </div>

      <h2 style={{ margin: '6px 0' }}>{meta ? friendlyLessonTitle(meta.lesson) : lessonId}</h2>
      {meta ? <div style={{ opacity: 0.7 }}>{friendlyChapterTitle(meta.chapter)}</div> : null}

      {error ? (
        <div style={{ marginTop: 12, padding: 12, border: '1px solid #f3c2c2', borderRadius: 8 }}>
          <b>错误</b>：{error}
        </div>
      ) : null}

      {lesson ? (
        <>
          <div style={{ marginTop: 16, padding: 12, border: '1px solid #eee', borderRadius: 12 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <b>音频</b>
              <span style={{ opacity: 0.75 }}>{lesson.audio?.track}</span>
              <button onClick={onPrecache} disabled={downloading || !audioUrl}>
                {downloading ? '下载中…' : cacheState === 'cached' ? '已缓存' : '下载/预缓存本课'}
              </button>
              <span style={{ opacity: 0.7, fontSize: 12 }}>
                （MVP：完整下载到 Cache Storage；后续可增强 Range/断点）
              </span>
            </div>
            {audioUrl ? (
              <audio style={{ marginTop: 10, width: '100%' }} controls preload="metadata" src={audioUrl} />
            ) : (
              <div style={{ marginTop: 10, opacity: 0.7 }}>未找到音频路径</div>
            )}
          </div>

          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
              <h3 style={{ margin: '10px 0' }}>卡片</h3>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button onClick={() => setMode('deck')} disabled={mode === 'deck'}>
                  扑克牌
                </button>
                <button onClick={() => setMode('list')} disabled={mode === 'list'}>
                  列表/搜索
                </button>

              </div>
            </div>

            {mode === 'deck' ? (
              <CardDeck cards={lesson.cards} loop={loopEnabled} pos={pos} onPosChange={setPos} />
            ) : (
              <CardList
                cards={lesson.cards}
                onSelect={(p) => {
                  setPos(p)
                  setMode('deck')
                }}
              />
            )}

            <div style={{ marginTop: 12, opacity: 0.7, fontSize: 12 }}>
              循环播放开关在「设置」里。
            </div>
          </div>
        </>
      ) : (
        <div style={{ marginTop: 16, opacity: 0.7 }}>
          该课程尚未导入文本（把对应 `resources/text/${lessonId}.txt` 放好并运行导入脚本即可）。
        </div>
      )}
    </div>
  )
}
