#!/usr/bin/env node
/**
 * Deprecated wrapper.
 *
 * 保留 resources/text/chXX-lYY.txt 单课输入方式，
 * 但内部已统一走 import-utils.mjs 的同一套解析核心。
 */
import fs from 'node:fs'
import path from 'node:path'
import {
  ROOT,
  STRUCTURE_PATH,
  AUDIO_MAP_PATH,
  OUT_DIR,
  readJson,
  parseCsv,
  wrapLessonTextAsBlock,
  writeLessonsFromBlocks,
} from './import-utils.mjs'

const TEXT_DIR = path.join(ROOT, 'resources', 'text')

function main() {
  console.warn('[deprecated] import-text-to-json.mjs is now a thin wrapper over shared parser core.')

  if (!fs.existsSync(TEXT_DIR)) {
    console.error('missing:', TEXT_DIR)
    process.exit(1)
  }
  fs.mkdirSync(OUT_DIR, { recursive: true })

  const structure = readJson(STRUCTURE_PATH)
  const audioMap = parseCsv(fs.readFileSync(AUDIO_MAP_PATH, 'utf8'))

  const files = fs.readdirSync(TEXT_DIR).filter((f) => /^ch\d{2}-l\d{2}\.txt$/.test(f)).sort()
  if (files.length === 0) {
    console.log('No lesson txt found under', TEXT_DIR)
    return
  }

  const lessonIndex = []
  for (const f of files) {
    const lessonId = f.replace(/\.txt$/, '')
    const text = fs.readFileSync(path.join(TEXT_DIR, f), 'utf8')
    const blocks = wrapLessonTextAsBlock(lessonId, text)
    console.log(`\n[lesson] ${f}`)
    lessonIndex.push(...writeLessonsFromBlocks({ blocks, structure, audioMap }))
  }

  const idxPath = path.join(ROOT, 'data', 'n2', 'lessons.index.json')
  lessonIndex.sort((a, b) => a.lessonId.localeCompare(b.lessonId))
  fs.writeFileSync(idxPath, JSON.stringify({ lessons: lessonIndex }, null, 2) + '\n', 'utf8')
  console.log('[ok] wrote', path.relative(ROOT, idxPath), `lessons=${lessonIndex.length}`)
}

main()
