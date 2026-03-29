#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import {
  readJson,
  parseCsv,
  splitChapterTextIntoLessonBlocks,
  writeLessonsFromBlocks,
} from './import-utils.mjs'
import { getBookConfig, parseBookArg } from './book-config.mjs'

function main() {
  const config = getBookConfig(parseBookArg())
  if (!fs.existsSync(config.chapterDir)) {
    console.error('missing chapter dir:', config.chapterDir)
    process.exit(1)
  }
  fs.mkdirSync(config.outDir, { recursive: true })

  const structure = readJson(config.structurePath)
  const audioMap = parseCsv(fs.readFileSync(config.audioMapPath, 'utf8'))

  const files = fs.readdirSync(config.chapterDir).filter((f) => /^ch\d{2,3}\.txt$/.test(f)).sort()
  if (files.length === 0) {
    console.log('No chapter txt found under', config.chapterDir)
    return
  }

  const lessonIndex = []
  for (const f of files) {
    const text = fs.readFileSync(path.join(config.chapterDir, f), 'utf8')
    const blocks = splitChapterTextIntoLessonBlocks(text)
    if (blocks.length === 0) {
      console.warn(`[skip] no lesson blocks found in ${f}`)
      continue
    }
    console.log(`\n[chapter] ${f}  →  ${blocks.length} lesson(s)`)
    lessonIndex.push(...writeLessonsFromBlocks({
      blocks,
      structure,
      audioMap,
      outDir: config.outDir,
      sourceBook: config.sourceBook,
      sourceLevel: config.sourceLevel,
    }))
  }

  if (lessonIndex.length === 0) {
    console.log('\nNo lessons were written.')
    return
  }

  let existingLessons = []
  if (fs.existsSync(config.indexPath)) {
    try { existingLessons = readJson(config.indexPath).lessons ?? [] } catch {}
  }
  const newIds = new Set(lessonIndex.map((l) => l.lessonId))
  const preserved = existingLessons.filter((l) => !newIds.has(l.lessonId))
  const merged = [...preserved, ...lessonIndex]
  merged.sort((a, b) => a.lessonId.localeCompare(b.lessonId))
  fs.writeFileSync(config.indexPath, JSON.stringify({ lessons: merged }, null, 2) + '\n', 'utf8')
  console.log(`\n[ok] lessons.index.json  total=${merged.length}  new/updated=${lessonIndex.length}  preserved=${preserved.length}`)
}

main()
