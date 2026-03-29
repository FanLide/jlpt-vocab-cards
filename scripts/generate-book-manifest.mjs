#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { getBookConfig, parseBookArg } from './book-config.mjs'
import { splitChapterTextIntoLessonBlocks } from './import-utils.mjs'

const CHAPTER_TITLE_OVERRIDES = {
  n3: {
    ch01: { titleJa: '人と人との関係', titleZh: '人际关系篇' },
    ch02: { titleJa: '暮らし', titleZh: '生活篇' },
    ch03: { titleJa: '住まい・買い物', titleZh: '居住消费篇' },
    ch04: { titleJa: '町・交通', titleZh: '城市交通篇' },
    ch05: { titleJa: '学校・勉強', titleZh: '学校学习篇' },
    ch06: { titleJa: '会社・仕事', titleZh: '公司工作篇' },
    ch07: { titleJa: '旅行・趣味', titleZh: '旅行兴趣篇' },
    ch08: { titleJa: '体・健康', titleZh: '身体健康篇' },
    ch09: { titleJa: '自然・天気', titleZh: '自然天气篇' },
    ch10: { titleJa: 'ニュース・トラブル', titleZh: '新闻纠纷篇' },
    ch11: { titleJa: '気持ち・様子', titleZh: '心情印象篇' },
    ch12: { titleJa: 'イメージ・社会', titleZh: '印象社会篇' },
  },
}

function titleCaseWord(word) {
  return word.slice(0, 1).toUpperCase() + word.slice(1)
}

function getFallbackChapterTitle(chapterId) {
  const chapterNumber = chapterId.replace(/^ch/, '')
  return {
    titleJa: `第${Number(chapterNumber)}章`,
    titleZh: `第${Number(chapterNumber)}章`,
  }
}

function splitHeaderTitle(rawTitle) {
  const title = rawTitle.trim().replace(/（\d+[~～]\d+）$/, '').trim()
  const parts = [...title.matchAll(/（([^（）]+)）/g)].map((m) => m[1].trim())
  const titleJa = title.replace(/（[^（）]+）/g, '').trim()
  const zhCandidate = parts.find((part) => /[\u3400-\u9fff]/.test(part))
  return {
    titleJa,
    titleZh: zhCandidate ?? titleJa,
  }
}

function collectLessonsFromChapterFile(filePath) {
  const text = fs.readFileSync(filePath, 'utf8')
  return splitChapterTextIntoLessonBlocks(text).map((block) => {
    const chapterId = block.lessonId.match(/^(ch\d{2,3})-/)?.[1]
    const lessonNumber = Number(block.lessonId.match(/-l(\d{2})$/)?.[1] ?? '0')
    const { titleJa, titleZh } = splitHeaderTitle(block.titleLine)
    return {
      id: block.lessonId,
      chapterId,
      index: lessonNumber,
      titleJa,
      titleZh,
    }
  }).filter((lesson) => lesson.chapterId && lesson.index)
}

function buildStructure(config) {
  let existingStructure = null
  if (fs.existsSync(config.structurePath)) {
    existingStructure = JSON.parse(fs.readFileSync(config.structurePath, 'utf8'))
  }
  const existingLessonZh = new Map(
    (existingStructure?.chapters ?? []).flatMap((chapter) =>
      (chapter.lessons ?? []).map((lesson) => [lesson.id, lesson.titleZh]),
    ),
  )
  const files = fs.readdirSync(config.chapterDir).filter((file) => /^ch\d{2,3}\.txt$/.test(file)).sort()
  const byChapter = new Map()

  for (const file of files) {
    const chapterLessons = collectLessonsFromChapterFile(path.join(config.chapterDir, file))
    for (const lesson of chapterLessons) {
      const current = byChapter.get(lesson.chapterId) ?? []
      current.push(lesson)
      byChapter.set(lesson.chapterId, current)
    }
  }

  const chapterOverrides = CHAPTER_TITLE_OVERRIDES[config.key] ?? {}
  const chapters = [...byChapter.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([chapterId, lessons]) => {
      const chapterTitle = chapterOverrides[chapterId] ?? getFallbackChapterTitle(chapterId)
      return {
        id: chapterId,
        titleJa: chapterTitle.titleJa,
        titleZh: chapterTitle.titleZh,
        lessons: lessons
          .sort((a, b) => a.index - b.index)
          .map(({ id, index, titleJa, titleZh }) => ({
            id,
            index,
            titleJa,
            titleZh: titleZh !== titleJa ? titleZh : (existingLessonZh.get(id) ?? titleZh),
          })),
      }
    })

  return {
    book: {
      id: config.bookId,
      title: config.sourceBook,
      level: config.sourceLevel,
    },
    chapters,
  }
}

function buildAudioMap(config, structure) {
  if (config.key === 'n2') {
    return fs.readFileSync(config.audioMapPath, 'utf8')
  }

  const rows = ['track,lessonId,chapterId,chapterTitleJa,chapterTitleZh,lessonIndex,lessonTitleJa,lessonTitleZh,audioRelPath']
  for (const chapter of structure.chapters) {
    const chapterNumber = chapter.id.replace(/^ch/, '').padStart(2, '0')
    for (const lesson of chapter.lessons) {
      const track = `Chapter${chapterNumber}_Section${lesson.index}`
      const audioRelPath = path.join('resources', 'audio', 'extracted', '万词对策N3', `${track}.mp3`).replaceAll(path.sep, '/')
      rows.push([
        track,
        lesson.id,
        chapter.id,
        chapter.titleJa,
        chapter.titleZh,
        String(lesson.index),
        lesson.titleJa,
        lesson.titleZh,
        audioRelPath,
      ].join(','))
    }
  }
  return rows.join('\n') + '\n'
}

function main() {
  const config = getBookConfig(parseBookArg())
  if (!fs.existsSync(config.chapterDir)) {
    console.error('missing chapter dir:', config.chapterDir)
    process.exit(1)
  }

  const structure = buildStructure(config)
  fs.writeFileSync(config.structurePath, JSON.stringify(structure, null, 2) + '\n', 'utf8')
  console.log('[ok] wrote', path.relative(process.cwd(), config.structurePath))

  const audioMap = buildAudioMap(config, structure)
  fs.writeFileSync(config.audioMapPath, audioMap, 'utf8')
  console.log('[ok] wrote', path.relative(process.cwd(), config.audioMapPath))
}

main()
