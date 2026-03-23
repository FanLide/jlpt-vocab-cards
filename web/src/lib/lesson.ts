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

export async function loadLesson(lessonId: string): Promise<Lesson | null> {
  // MVP: load a small allowlist; later we can generate an index for all lessons.
  if (lessonId === 'ch01-l01') {
    const mod = await import('../../../data/n2/lessons/ch01-l01.json')
    return mod.default as Lesson
  }
  if (lessonId === 'ch01-l02') {
    const mod = await import('../../../data/n2/lessons/ch01-l02.json')
    return mod.default as Lesson
  }
  return null
}
