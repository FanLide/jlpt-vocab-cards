#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import {
  ROOT,
  STRUCTURE_PATH,
  AUDIO_MAP_PATH,
  OUT_DIR,
  readJson,
  parseCsv,
  splitChapterTextIntoLessonBlocks,
  writeLessonsFromBlocks,
} from './import-utils.mjs'

const CHAPTER_DIR = path.join(ROOT, 'resources', 'chapters')

function main() {
  if (!fs.existsSync(CHAPTER_DIR)) {
    console.error('missing chapter dir:', CHAPTER_DIR)
    process.exit(1)
  }
  fs.mkdirSync(OUT_DIR, { recursive: true })

  const structure = readJson(STRUCTURE_PATH)
  const audioMap = parseCsv(fs.readFileSync(AUDIO_MAP_PATH, 'utf8'))

  const files = fs.readdirSync(CHAPTER_DIR).filter((f) => /^ch\d{2,3}\.txt$/.test(f)).sort()
  if (files.length === 0) {
    console.log('No chapter txt found under', CHAPTER_DIR)
    return
  }

  const lessonIndex = []
  for (const f of files) {
    const text = fs.readFileSync(path.join(CHAPTER_DIR, f), 'utf8')
    const blocks = splitChapterTextIntoLessonBlocks(text)
    if (blocks.length === 0) {
      console.warn(`[skip] no lesson blocks found in ${f}`)
      continue
    }
    console.log(`\n[chapter] ${f}  →  ${blocks.length} lesson(s)`)
    lessonIndex.push(...writeLessonsFromBlocks({ blocks, structure, audioMap }))
  }

  if (lessonIndex.length === 0) {
    console.log('\nNo lessons were written.')
    return
  }

  const idxPath = path.join(ROOT, 'data', 'n2', 'lessons.index.json')
  let existingLessons = []
  if (fs.existsSync(idxPath)) {
    try { existingLessons = readJson(idxPath).lessons ?? [] } catch {}
  }
  const newIds = new Set(lessonIndex.map((l) => l.lessonId))
  const preserved = existingLessons.filter((l) => !newIds.has(l.lessonId))
  const merged = [...preserved, ...lessonIndex]
  merged.sort((a, b) => a.lessonId.localeCompare(b.lessonId))
  fs.writeFileSync(idxPath, JSON.stringify({ lessons: merged }, null, 2) + '\n', 'utf8')
  console.log(`\n[ok] lessons.index.json  total=${merged.length}  new/updated=${lessonIndex.length}  preserved=${preserved.length}`)
}

main()
