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
  readJson,
  parseCsv,
  wrapLessonTextAsBlock,
  writeLessonsFromBlocks,
} from './import-utils.mjs'
import { getBookConfig, parseBookArg } from './book-config.mjs'

function main() {
  console.warn('[deprecated] import-text-to-json.mjs is now a thin wrapper over shared parser core.')
  const config = getBookConfig(parseBookArg())

  if (!fs.existsSync(config.textDir)) {
    console.error('missing:', config.textDir)
    process.exit(1)
  }
  fs.mkdirSync(config.outDir, { recursive: true })

  const structure = readJson(config.structurePath)
  const audioMap = parseCsv(fs.readFileSync(config.audioMapPath, 'utf8'))

  const files = fs.readdirSync(config.textDir).filter((f) => /^ch\d{2}-l\d{2}\.txt$/.test(f)).sort()
  if (files.length === 0) {
    console.log('No lesson txt found under', config.textDir)
    return
  }

  const lessonIndex = []
  for (const f of files) {
    const lessonId = f.replace(/\.txt$/, '')
    const text = fs.readFileSync(path.join(config.textDir, f), 'utf8')
    const blocks = wrapLessonTextAsBlock(lessonId, text)
    console.log(`\n[lesson] ${f}`)
    lessonIndex.push(...writeLessonsFromBlocks({
      blocks,
      structure,
      audioMap,
      outDir: config.outDir,
      sourceBook: config.sourceBook,
      sourceLevel: config.sourceLevel,
    }))
  }

  lessonIndex.sort((a, b) => a.lessonId.localeCompare(b.lessonId))
  fs.writeFileSync(config.indexPath, JSON.stringify({ lessons: lessonIndex }, null, 2) + '\n', 'utf8')
  console.log('[ok] wrote', path.relative(path.dirname(config.indexPath), config.indexPath), `lessons=${lessonIndex.length}`)
}

main()
