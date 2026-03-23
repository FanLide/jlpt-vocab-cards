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

const lessonFiles = import.meta.glob('../../../data/n2/lessons/*.json')

export async function loadLesson(lessonId: string): Promise<Lesson | null> {
  const key = `../../../data/n2/lessons/${lessonId}.json`
  const loader = lessonFiles[key] as undefined | (() => Promise<{ default: unknown }>)
  if (!loader) return null
  const mod = await loader()
  return mod.default as Lesson
}
