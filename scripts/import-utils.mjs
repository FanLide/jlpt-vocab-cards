import fs from 'node:fs'
import path from 'node:path'

export const ROOT = path.resolve(import.meta.dirname, '..')
export const STRUCTURE_PATH = path.join(ROOT, 'data', 'n2-lesson-structure.json')
export const AUDIO_MAP_PATH = path.join(ROOT, 'data', 'n2-audio-map.csv')
export const OUT_DIR = path.join(ROOT, 'data', 'n2', 'lessons')

export function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'))
}

export function parseCsv(csv) {
  const lines = csv.split(/\r?\n/).filter(Boolean)
  const header = lines.shift().split(',')
  return lines.map((line) => {
    const parts = line.split(',')
    const obj = {}
    header.forEach((h, i) => (obj[h] = parts[i]))
    return obj
  })
}

export function getLessonMeta(structure, lessonId) {
  for (const ch of structure.chapters) {
    const lesson = ch.lessons.find((x) => x.id === lessonId)
    if (lesson) return { chapter: ch, lesson }
  }
  return null
}

export function normalizeFullwidthDigits(s) {
  return s.replace(/[０-９]/g, (d) => String(d.charCodeAt(0) - 0xff10))
}

export function extractRangeNote(line) {
  const m =
    line.match(/[（(]\s*([0-9０-９]+)\s*[～~]\s*([0-9０-９]+)\s*[）)]/) ||
    line.match(/([0-9０-９]+)\s*[～~]\s*([0-9０-９]+)/)
  if (!m) return null
  return `${Number(normalizeFullwidthDigits(m[1]))}～${Number(normalizeFullwidthDigits(m[2]))}`
}

export function normalizeLessonId(rawId) {
  const m = rawId.match(/^ch(\d{1,3})-l(\d{2})$/)
  if (!m) return rawId
  if (m[1].length <= 2) return rawId
  const chNum = Number(m[1])
  return `ch${chNum}-l${m[2]}`
}

function parseItemFormatA(lines, i) {
  const line0 = lines[i] ?? ''
  const m0 = line0.match(/^(\d+)\s+(.+?)(?:（(.+?)）)?\s*$/)
  if (!m0) return null
  const index = Number(m0[1])
  const word = m0[2].trim()
  const reading = (m0[3] ?? word).trim()

  const line1 = (lines[i + 1] ?? '').trim()
  const m1 = line1.match(/^(.+?)：\s*(.+)$/)
  if (!m1 || line1.startsWith('例：')) return null

  const line2 = (lines[i + 2] ?? '').trim()
  const m2 = line2.match(/^例：\s*(.+)$/)
  if (!m2) return null

  const line3 = (lines[i + 3] ?? '').trim()
  if (!line3 || line3.startsWith('例：') || /^\d+\s+/.test(line3)) return null

  return {
    consumed: 4,
    card: {
      index, word, reading,
      meaning: { en: m1[1].trim(), zh: m1[2].trim() },
      sentence: { ja: m2[1].trim(), zh: line3 },
    },
  }
}

function parseItemFormatB(lines, i) {
  const line = lines[i] ?? ''
  const mNum = line.match(/^(\d+)\s+(.+)$/)
  if (!mNum) return null
  const index = Number(mNum[1])
  const rest = mNum[2]

  const exIdx = rest.indexOf(' 例：')
  if (exIdx === -1) return null
  const defPart = rest.slice(0, exIdx)
  const exPart = rest.slice(exIdx + ' 例：'.length).trim()

  const colonIdx = defPart.indexOf('：')
  if (colonIdx === -1) return null
  const beforeColon = defPart.slice(0, colonIdx)
  const zhMeaning = defPart.slice(colonIdx + 1).trim()

  const wordEnIdx = beforeColon.search(/\s+[a-zA-Z[]/)
  if (wordEnIdx === -1) return null
  const wordPart = beforeColon.slice(0, wordEnIdx).trim()
  const enMeaning = beforeColon.slice(wordEnIdx).trim()

  const rMatch = wordPart.match(/（(.+?)）/)
  const reading = rMatch ? rMatch[1] : wordPart

  const sentMatch = exPart.match(/^(.*[。！？」）])\s+(.+)$/)
  if (sentMatch) {
    return {
      consumed: 1,
      card: {
        index, word: wordPart, reading,
        meaning: { en: enMeaning, zh: zhMeaning },
        sentence: { ja: sentMatch[1].trim(), zh: sentMatch[2].trim() },
      },
    }
  }

  const line1 = (lines[i + 1] ?? '').trim()
  if (!line1) return null
  const zhLine = line1.startsWith('翻译：') ? line1.slice('翻译：'.length).trim() : line1
  if (!zhLine || /^\d+\s+/.test(zhLine)) return null

  return {
    consumed: 2,
    card: {
      index, word: wordPart, reading,
      meaning: { en: enMeaning, zh: zhMeaning },
      sentence: { ja: exPart.trim(), zh: zhLine },
    },
  }
}

function parseWordMeaningLine(line) {
  const mNum = line.match(/^(\d+)\s+(.+)$/)
  if (!mNum) return null
  const index = Number(mNum[1])
  const rest = mNum[2]
  const colonIdx = rest.indexOf('：')
  if (colonIdx === -1) return null
  const beforeColon = rest.slice(0, colonIdx)
  const zhMeaning = rest.slice(colonIdx + 1).trim()
  const wordEnIdx = beforeColon.search(/\s+[a-zA-Z[]/)
  if (wordEnIdx === -1) return null
  const wordPart = beforeColon.slice(0, wordEnIdx).trim()
  const enMeaning = beforeColon.slice(wordEnIdx).trim()
  const rMatch = wordPart.match(/（(.+?)）/)
  const reading = rMatch ? rMatch[1] : wordPart
  return { index, word: wordPart, reading, en: enMeaning, zh: zhMeaning }
}

function parseItemFormatC(lines, i) {
  const parsed0 = parseWordMeaningLine(lines[i] ?? '')
  if (!parsed0) return null
  const line1 = (lines[i + 1] ?? '').trim()
  if (!line1.startsWith('例：')) return null
  const exContent = line1.slice('例：'.length)
  const trIdx = exContent.indexOf('翻译：')
  if (trIdx === -1) return null
  return {
    consumed: 2,
    card: {
      index: parsed0.index, word: parsed0.word, reading: parsed0.reading,
      meaning: { en: parsed0.en, zh: parsed0.zh },
      sentence: { ja: exContent.slice(0, trIdx).trim(), zh: exContent.slice(trIdx + '翻译：'.length).trim() },
    },
  }
}

function parseItemFormatD(lines, i) {
  const parsed0 = parseWordMeaningLine(lines[i] ?? '')
  if (!parsed0) return null
  const line1 = (lines[i + 1] ?? '').trim()
  if (!line1.startsWith('例：')) return null
  const jaSentence = line1.slice('例：'.length).trim()
  const line2 = (lines[i + 2] ?? '').trim()
  if (!line2 || /^\d+\s+/.test(line2)) return null
  const zhSentence = line2.startsWith('翻译：') ? line2.slice('翻译：'.length).trim() : line2
  return {
    consumed: 3,
    card: {
      index: parsed0.index, word: parsed0.word, reading: parsed0.reading,
      meaning: { en: parsed0.en, zh: parsed0.zh },
      sentence: { ja: jaSentence, zh: zhSentence },
    },
  }
}

function parseItemFormatFSingleLine(line) {
  // 新格式：
  // 1 一家（いっか） family：一家人，全家 例：兄が...。 中文翻译。 [相關]：...
  const m = line.match(/^(\d+)\s+(.+?)\s+([^：]+)：\s*(.+?)\s+例：\s*(.+)$/)
  if (!m) return null

  const index = Number(m[1])
  const wordPart = m[2].trim()
  const enMeaning = m[3].trim()
  let zhMeaning = m[4].trim()
  let examplePart = m[5].trim()

  // 去掉 [相關] 段
  examplePart = examplePart.replace(/\s*\[相關\]：.*$/, '').trim()

  const rMatch = wordPart.match(/（(.+?)）/)
  const reading = rMatch ? rMatch[1].trim() : wordPart

  // 日文例句 + 中文翻译分割：优先按句号后空格拆；拆不到按最后一个全角句号拆
  let jaSentence = ''
  let zhSentence = ''
  const split1 = examplePart.match(/^(.*?[。！？])\s+(.+)$/)
  if (split1) {
    jaSentence = split1[1].trim()
    zhSentence = split1[2].trim()
  } else {
    const lastPunc = Math.max(examplePart.lastIndexOf('。'), examplePart.lastIndexOf('！'), examplePart.lastIndexOf('？'))
    if (lastPunc !== -1 && lastPunc < examplePart.length - 1) {
      jaSentence = examplePart.slice(0, lastPunc + 1).trim()
      zhSentence = examplePart.slice(lastPunc + 1).trim()
    } else {
      return null
    }
  }

  return {
    consumed: 1,
    card: {
      index,
      word: wordPart,
      reading,
      meaning: { en: enMeaning, zh: zhMeaning },
      sentence: { ja: jaSentence, zh: zhSentence },
    },
  }
}

export function parseNextItem(lines, i) {
  const line = lines[i] ?? ''
  if (!/^\d+\s+/.test(line)) return null

  // 新章节纯单行增强格式优先
  const formatF = parseItemFormatFSingleLine(line)
  if (formatF) return formatF

  if (line.includes(' 例：')) return parseItemFormatB(lines, i)
  if (line.includes('：')) {
    const line1 = (lines[i + 1] ?? '').trim()
    if (!line1.startsWith('例：')) return null
    if (line1.includes('翻译：')) return parseItemFormatC(lines, i)
    return parseItemFormatD(lines, i)
  }
  return parseItemFormatA(lines, i)
}

export function splitChapterTextIntoLessonBlocks(text) {
  const rawLines = text.split(/\r?\n/)
  const blocks = []
  let current = { lessonId: null, titleLine: null, contentLines: [] }

  for (const raw of rawLines) {
    const line = raw.trim()

    if (/^-{3,}/.test(line)) {
      if (current?.lessonId) blocks.push(current)
      current = { lessonId: null, titleLine: null, contentLines: [] }
      continue
    }
    if (!line) continue

    // 新格式：标题行本身就是 lessonId + 课名 + 范围
    const inlineHeaderMatch = line.match(/^(ch\d{1,3}-l\d{2})(?:\.txt)?[：:](.+)$/)
    if (inlineHeaderMatch) {
      if (current?.lessonId) blocks.push(current)
      current = {
        lessonId: normalizeLessonId(inlineHeaderMatch[1]),
        titleLine: inlineHeaderMatch[2].trim(),
        contentLines: [],
      }
      continue
    }

    if (!current.lessonId) {
      const idMatch = line.match(/^(ch\d{1,3}-l\d{2})/)
      if (idMatch) current.lessonId = normalizeLessonId(idMatch[1])
      else current = { lessonId: null, titleLine: null, contentLines: [] }
      continue
    }
    if (!current.titleLine) {
      current.titleLine = line
      continue
    }
    current.contentLines.push(raw)
  }
  if (current?.lessonId) blocks.push(current)
  return blocks.filter((b) => b.lessonId && b.titleLine)
}

export function wrapLessonTextAsBlock(lessonId, text) {
  const rawLines = text.split(/\r?\n/)
  const lines = rawLines.map((l) => l.trim()).filter(Boolean)
  const titleLine = lines[0] ?? ''
  const contentLines = rawLines.slice(1)
  return [{ lessonId, titleLine, contentLines }]
}

export function parseLessonBlockToCards(block) {
  const lines = block.contentLines.map((l) => l.trim()).filter(Boolean)
  const cards = []
  let i = 0
  while (i < lines.length) {
    const parsed = parseNextItem(lines, i)
    if (!parsed) {
      i += 1
      continue
    }
    cards.push(parsed.card)
    i += parsed.consumed
  }
  return cards
}

export function writeLessonsFromBlocks({ blocks, structure, audioMap, outDir = OUT_DIR, sourceBook = '新日语能力考试 万词対策', sourceLevel = 'N2' }) {
  fs.mkdirSync(outDir, { recursive: true })
  const lessonIndex = []
  for (const block of blocks) {
    const meta = getLessonMeta(structure, block.lessonId)
    if (!meta) {
      console.warn(`  [skip] ${block.lessonId} not found in structure`)
      continue
    }
    const rangeNote = extractRangeNote(block.titleLine)
    const audioRow = audioMap.find((r) => r.lessonId === block.lessonId)
    const parsedCards = parseLessonBlockToCards(block)
    if (parsedCards.length === 0) {
      console.warn(`  [warn] ${block.lessonId}: no cards parsed — check file format`)
      continue
    }
    const cards = parsedCards.map((card) => ({
      id: `${block.lessonId}-${String(card.index).padStart(3, '0')}`,
      ...card,
      source: { book: sourceBook, level: sourceLevel },
    }))
    const out = {
      id: block.lessonId,
      chapterId: meta.chapter.id,
      titleJa: meta.lesson.titleJa,
      titleZh: meta.lesson.titleZh,
      rangeNote: rangeNote ?? undefined,
      audio: audioRow ? { track: audioRow.track, file: audioRow.audioRelPath } : undefined,
      cards,
    }
    fs.writeFileSync(path.join(outDir, `${block.lessonId}.json`), JSON.stringify(out, null, 2) + '\n', 'utf8')
    console.log(`  [ok] ${block.lessonId}  cards=${cards.length}`)
    lessonIndex.push({ lessonId: block.lessonId, chapterId: meta.chapter.id, titleJa: meta.lesson.titleJa, titleZh: meta.lesson.titleZh, cards: cards.length })
  }
  return lessonIndex
}
