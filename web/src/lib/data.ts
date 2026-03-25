import lessonStructure from '../../../data/n2-lesson-structure.json'

export type LessonMeta = {
  id: string
  index: number
  titleJa: string
  titleZh: string
}

export type ChapterMeta = {
  id: string
  titleJa: string
  titleZh: string
  lessons: LessonMeta[]
}

export type BookStructure = {
  book: { id: string; title: string; level: string }
  chapters: ChapterMeta[]
}

export const structure = lessonStructure as unknown as BookStructure

export function friendlyChapterTitle(ch: ChapterMeta) {
  return `Chapter ${ch.id.replace('ch', '')} ${ch.titleJa}（${ch.titleZh}）`
}

export function friendlyLessonTitle(lesson: LessonMeta) {
  return `${lesson.index} ${lesson.titleJa}（${lesson.titleZh}）`
}

export function getLessonMeta(lessonId: string) {
  for (const ch of structure.chapters) {
    const l = ch.lessons.find((x) => x.id === lessonId)
    if (l) return { chapter: ch, lesson: l }
  }
  return null
}

/** 返回下一课的 lessonId，没有则返回 null */
export function getNextLessonId(lessonId: string): string | null {
  const allLessons = structure.chapters.flatMap((ch) => ch.lessons)
  const idx = allLessons.findIndex((l) => l.id === lessonId)
  if (idx < 0 || idx >= allLessons.length - 1) return null
  return allLessons[idx + 1].id
}
