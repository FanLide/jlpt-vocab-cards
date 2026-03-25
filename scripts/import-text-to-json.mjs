#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const TEXT_DIR = path.join(ROOT, 'resources', 'text')
const OUT_DIR = path.join(ROOT, 'data', 'n2', 'lessons')

const STRUCTURE_PATH = path.join(ROOT, 'data', 'n2-lesson-structure.json')
const AUDIO_MAP_PATH = path.join(ROOT, 'data', 'n2-audio-map.csv')

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'))
}

function parseCsv(csv) {
  const lines = csv.split(/\r?\n/).filter(Boolean)
  const header = lines.shift().split(',')
  return lines.map((line) => {
    // simple CSV (no quotes expected)
    const parts = line.split(',')
    const obj = {}
    header.forEach((h, i) => (obj[h] = parts[i]))
    return obj
  })
}

function getLessonMeta(structure, lessonId) {
  for (const ch of structure.chapters) {
    const lesson = ch.lessons.find((x) => x.id === lessonId)
    if (lesson) return { chapter: ch, lesson }
  }
  return null
}

function normalizeFullwidthDigits(s) {
  return s.replace(/[０-９]/g, (d) => String(d.charCodeAt(0) - 0xFF10))
}

function parseHeader(line) {
  // e.g. 第2课 友達（27～49）
  const m = line.match(/第\s*(\d+)\s*课\s*(.+?)（\s*([0-9０-９]+)\s*[～~]\s*([0-9０-９]+)\s*）/)
  if (!m) return null
  const lessonNo = Number(m[1])
  const titleJa = m[2].trim()
  const from = Number(normalizeFullwidthDigits(m[3]))
  const to = Number(normalizeFullwidthDigits(m[4]))
  return { lessonNo, titleJa, rangeNote: `${from}～${to}` }
}


function parseItemLines(lines, i) {
  // Expect pattern:
  //  N WORD（READING）
  //  EN：ZH
  //  例：JA
  //  ZH_SENT
  const line1 = lines[i]
  // Support both:
  //  27 友人（ゆうじん）
  //  2 ありがたい
  const m1 = line1.match(/^(\d+)\s+(.+?)(?:（(.+?)）)?\s*$/)
  if (!m1) return null
  const index = Number(m1[1])
  const word = m1[2].trim()
  const reading = (m1[3] ?? word).trim()

  const line2 = lines[i + 1] ?? ''
  const m2 = line2.match(/^(.+?)：\s*(.+)$/)
  if (!m2) return null
  const en = m2[1].trim()
  const zh = m2[2].trim()

  const line3 = lines[i + 2] ?? ''
  const m3 = line3.match(/^例：\s*(.+)$/)
  if (!m3) return null
  const jaSentence = m3[1].trim()

  const line4 = (lines[i + 3] ?? '').trim()
  if (!line4) return null

  return {
    consumed: 4,
    card: {
      index,
      word,
      reading,
      meaning: { zh, en },
      sentence: { ja: jaSentence, zh: line4 },
    },
  }
}

function buildId(prefix, n, width = 3) {
  return `${prefix}-${String(n).padStart(width, '0')}`
}

function main() {
  if (!fs.existsSync(TEXT_DIR)) {
    console.error('missing:', TEXT_DIR)
    process.exit(1)
  }
  fs.mkdirSync(OUT_DIR, { recursive: true })

  const structure = readJson(STRUCTURE_PATH)
  const audioMap = parseCsv(fs.readFileSync(AUDIO_MAP_PATH, 'utf8'))

  const files = fs
    .readdirSync(TEXT_DIR)
    .filter((f) => f.endsWith('.txt') && /^ch\d{2}-l\d{2}\.txt$/.test(f))
    .sort()

  if (files.length === 0) {
    console.log('No lesson txt found under', TEXT_DIR)
    return
  }

  const lessonIndex = []

  for (const f of files) {
    const lessonId = f.replace(/\.txt$/, '')
    const meta = getLessonMeta(structure, lessonId)
    if (!meta) {
      console.warn(`[skip] unknown lessonId in structure: ${lessonId}`)
      continue
    }

    const text = fs.readFileSync(path.join(TEXT_DIR, f), 'utf8')
    const rawLines = text.split(/\r?\n/)
    const lines = rawLines.map((l) => l.trim()).filter((l) => l.length > 0)

    const header = parseHeader(lines[0] ?? '')
    if (!header) {
      console.warn(`[skip] bad header in ${f}: ${lines[0]}`)
      continue
    }

    const audioRow = audioMap.find((r) => r.lessonId === lessonId)

    const cards = []
    let i = 1
    while (i < lines.length) {
      const parsed = parseItemLines(lines, i)
      if (!parsed) {
        console.warn(`[warn] parse failed in ${f} at line:`, lines[i])
        i += 1
        continue
      }
      const idx = parsed.card.index
      cards.push({
        id: `${lessonId}-${String(idx).padStart(3, '0')}`,
        ...parsed.card,
        source: { book: '新日语能力考试 万词対策', level: 'N2' },
      })
      i += parsed.consumed
    }

    const out = {
      id: lessonId,
      chapterId: meta.chapter.id,
      titleJa: meta.lesson.titleJa,
      titleZh: meta.lesson.titleZh,
      rangeNote: header.rangeNote,
      audio: audioRow
        ? { track: audioRow.track, file: audioRow.audioRelPath }
        : undefined,
      cards,
    }

    const outPath = path.join(OUT_DIR, `${lessonId}.json`)
    fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n', 'utf8')
    console.log('[ok]', lessonId, '->', path.relative(ROOT, outPath), `cards=${cards.length}`)

    lessonIndex.push({
      lessonId,
      chapterId: meta.chapter.id,
      titleJa: meta.lesson.titleJa,
      titleZh: meta.lesson.titleZh,
      cards: cards.length,
    })
  }

  // write index for frontend auto-discovery
  const idxPath = path.join(ROOT, 'data', 'n2', 'lessons.index.json')
  lessonIndex.sort((a, b) => a.lessonId.localeCompare(b.lessonId))
  fs.writeFileSync(idxPath, JSON.stringify({ lessons: lessonIndex }, null, 2) + '\n', 'utf8')
  console.log('[ok] wrote', path.relative(ROOT, idxPath), `lessons=${lessonIndex.length}`)
}

main()
