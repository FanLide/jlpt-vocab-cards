import catalog from '../../../data/book-catalog.json'

// ── 类型定义 ──────────────────────────────────────────

export type BookCatalogEntry = {
  id: string
  structureFile: string
  lessonDir: string
  title: string
  titleJa: string
  level: string
  desc: string
  color: string
}

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

// ── 书单 ──────────────────────────────────────────────

export const bookCatalog = catalog as BookCatalogEntry[]

export function getBookEntry(bookId: string): BookCatalogEntry | null {
  return bookCatalog.find((b) => b.id === bookId) ?? null
}

// ── 按需加载书结构（lazy，避免多书时一次性加载所有 JSON） ──

const structureCache = new Map<string, BookStructure>()

const structureLoaders: Record<string, () => Promise<{ default: unknown }>> = {
  'n2-lesson-structure.json': () => import('../../../data/n2-lesson-structure.json'),
  'n3-lesson-structure.json': () => import('../../../data/n3-lesson-structure.json'),
}

export async function loadBookStructure(bookId: string): Promise<BookStructure | null> {
  if (structureCache.has(bookId)) return structureCache.get(bookId)!
  const entry = getBookEntry(bookId)
  if (!entry) return null
  const loader = structureLoaders[entry.structureFile]
  if (!loader) return null
  const mod = await loader()
  const structure = mod.default as BookStructure
  structureCache.set(bookId, structure)
  return structure
}

// ── 向后兼容：同步 structure（仅用于 getLessonMeta / getNextLessonId 默认参数）
// 注意：异步页面（Home/Lesson）应直接传入已加载的 structure，避免依赖此全局
let _defaultStructure: BookStructure | null = null
loadBookStructure('vocab-taisaku-n2').then((s) => { _defaultStructure = s })
export const structure: BookStructure = new Proxy({} as BookStructure, {
  get(_, prop) {
    return _defaultStructure ? _defaultStructure[prop as keyof BookStructure] : undefined
  },
})

// ── 工具函数 ──────────────────────────────────────────

export function friendlyChapterTitle(ch: ChapterMeta) {
  return `Chapter ${ch.id.replace('ch', '')} ${ch.titleJa}（${ch.titleZh}）`
}

export function friendlyLessonTitle(lesson: LessonMeta) {
  return `${lesson.index} ${lesson.titleJa}（${lesson.titleZh}）`
}

export function getLessonMeta(lessonId: string, struct?: BookStructure) {
  const s = struct ?? structure
  for (const ch of s.chapters) {
    const l = ch.lessons.find((x) => x.id === lessonId)
    if (l) return { chapter: ch, lesson: l }
  }
  return null
}

/** 返回下一课的 lessonId，没有则返回 null */
export function getNextLessonId(lessonId: string, struct?: BookStructure): string | null {
  const s = struct ?? structure
  const allLessons = s.chapters.flatMap((ch) => ch.lessons)
  const idx = allLessons.findIndex((l) => l.id === lessonId)
  if (idx < 0 || idx >= allLessons.length - 1) return null
  return allLessons[idx + 1].id
}
