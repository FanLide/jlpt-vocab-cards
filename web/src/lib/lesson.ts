export type Card = {
  id: string
  index: number
  word: string
  reading: string
  meaning: { zh: string; en?: string }
  sentence?: { ja: string; zh?: string }
}

export type Lesson = {
  id: string
  chapterId: string
  titleJa: string
  titleZh: string
  rangeNote?: string
  audio?: { track?: string; file: string }
  cards: Card[]
}

// glob 覆盖所有书的 lessons 目录（新增书时只需新建目录）
const allLessonFiles = import.meta.glob('../../../data/*/lessons/*.json')

/**
 * 加载课程 JSON
 * @param lessonId  如 "ch01-l01"
 * @param lessonDir 书的课程目录名，如 "n2"（来自 book-catalog.json）
 */
export async function loadLesson(lessonId: string, lessonDir = 'n2'): Promise<Lesson | null> {
  const key = `../../../data/${lessonDir}/lessons/${lessonId}.json`
  const loader = allLessonFiles[key] as undefined | (() => Promise<{ default: unknown }>)
  if (!loader) return null
  const mod = await loader()
  return mod.default as Lesson
}
