#!/usr/bin/env node
/**
 * import-chapter-to-json.mjs
 *
 * 从 resources/chapters/ch##.txt 读取整章内容，生成 data/n2/lessons/ch##-l##.json
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * 章节文件规则
 * ──────────────────────────────────────────────────────────────────────────────
 *   - 文件命名：ch##.txt（支持 ch010.txt → 自动识别为 ch10）
 *   - 课与课之间用 "---"（≥3 个连字符）隔开；文件开头可以没有分隔线
 *   - 分隔线后第一个非空行：课 ID（如 "ch03-l01.txt" 或 "ch03-l01"，
 *     可以带后缀注释，如 "ch09-l04.txt (续)"，会自动忽略括号内容）
 *   - 课 ID 后第一个非空行：课标题（任意格式）
 *   - 其余行：词条内容
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * 词条格式（自动识别以下 5 种）
 * ──────────────────────────────────────────────────────────────────────────────
 *
 *   [A] 4行格式（ch01）：
 *       N word（reading）
 *       EN：ZH
 *       例：JA句子
 *       ZH翻译
 *
 *   [B] 单行格式（ch03）：
 *       N word（reading） EN：ZH 例：JA句子。 ZH翻译。
 *
 *   [C] 2行格式，翻译在例句同行（ch06）：
 *       N word（reading） EN：ZH
 *        例：JA句子。 翻译：ZH翻译。
 *
 *   [D] 3行格式，ZH无前缀（ch08）：
 *       N word（reading） EN：ZH
 *        例：JA句子
 *        ZH翻译
 *
 *   [E] 3行格式，ZH带翻译：前缀（ch09/ch11）：
 *       N word（reading） [词性] EN：ZH
 *        例：JA句子
 *        翻译：ZH翻译
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * 兼容性
 * ──────────────────────────────────────────────────────────────────────────────
 *   写入 lessons.index.json 时与已有索引合并，只覆盖本次处理的课。
 */

import fs from 'node:fs'
import path from 'node:path'

const ROOT        = path.resolve(import.meta.dirname, '..')
const CHAPTER_DIR = path.join(ROOT, 'resources', 'chapters')
const OUT_DIR     = path.join(ROOT, 'data', 'n2', 'lessons')

const STRUCTURE_PATH = path.join(ROOT, 'data', 'n2-lesson-structure.json')
const AUDIO_MAP_PATH = path.join(ROOT, 'data', 'n2-audio-map.csv')

// ── 工具函数 ─────────────────────────────────────────────────────────────────

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'))
}

function parseCsv(csv) {
  const lines = csv.split(/\r?\n/).filter(Boolean)
  const header = lines.shift().split(',')
  return lines.map((line) => {
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
  return s.replace(/[０-９]/g, (d) => String(d.charCodeAt(0) - 0xff10))
}

/** 从标题行中提取词汇范围 "268～288"；提取不到则返回 null */
function extractRangeNote(line) {
  const m =
    line.match(/[（(]\s*([0-9０-９]+)\s*[～~]\s*([0-9０-９]+)\s*[）)]/) ||
    line.match(/([0-9０-９]+)\s*[～~]\s*([0-9０-９]+)/)
  if (!m) return null
  return `${Number(normalizeFullwidthDigits(m[1]))}～${Number(normalizeFullwidthDigits(m[2]))}`
}

// ── 词条格式 A：4行 ───────────────────────────────────────────────────────────

function parseItemFormatA(lines, i) {
  // 行 i+0: N word（reading）
  // 行 i+1: EN：ZH
  // 行 i+2: 例：JA
  // 行 i+3: ZH翻译
  const line0 = lines[i] ?? ''
  const m0 = line0.match(/^(\d+)\s+(.+?)(?:（(.+?)）)?\s*$/)
  if (!m0) return null
  const index   = Number(m0[1])
  const word    = m0[2].trim()
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
      meaning:  { en: m1[1].trim(), zh: m1[2].trim() },
      sentence: { ja: m2[1].trim(), zh: line3 },
    },
  }
}

// ── 词条格式 B：单行 ──────────────────────────────────────────────────────────

function parseItemFormatB(line) {
  // N word（reading） EN：ZH 例：JA句子。 ZH翻译。
  const mNum = line.match(/^(\d+)\s+(.+)$/)
  if (!mNum) return null
  const index = Number(mNum[1])
  const rest  = mNum[2]

  const exIdx = rest.indexOf(' 例：')
  if (exIdx === -1) return null
  const defPart = rest.slice(0, exIdx)
  const exPart  = rest.slice(exIdx + ' 例：'.length).trim()

  // 在释义段找 EN：ZH（全角冒号）
  const colonIdx = defPart.indexOf('：')
  if (colonIdx === -1) return null
  const beforeColon = defPart.slice(0, colonIdx)
  const zhMeaning   = defPart.slice(colonIdx + 1).trim()

  // 词条和 EN 的边界：空格+ASCII字母
  const wordEnIdx = beforeColon.search(/\s+[a-zA-Z[]/)
  if (wordEnIdx === -1) return null
  const wordPart  = beforeColon.slice(0, wordEnIdx).trim()
  const enMeaning = beforeColon.slice(wordEnIdx).trim()

  const rMatch  = wordPart.match(/（(.+?)）/)
  const reading = rMatch ? rMatch[1] : wordPart

  // 日文例句和中文翻译的边界：最后一个句末标点+空格
  const sentMatch = exPart.match(/^(.*[。！？」）])\s+(.+)$/)
  if (!sentMatch) return null

  return {
    consumed: 1,
    card: {
      index, word: wordPart, reading,
      meaning:  { en: enMeaning, zh: zhMeaning },
      sentence: { ja: sentMatch[1].trim(), zh: sentMatch[2].trim() },
    },
  }
}

// ── 词条格式 C/D/E 的公共首行解析 ─────────────────────────────────────────────

function parseWordMeaningLine(line) {
  // "N word（reading） [词性] EN：ZH"
  const mNum = line.match(/^(\d+)\s+(.+)$/)
  if (!mNum) return null
  const index = Number(mNum[1])
  const rest  = mNum[2]

  const colonIdx = rest.indexOf('：')
  if (colonIdx === -1) return null

  const beforeColon = rest.slice(0, colonIdx)
  const zhMeaning   = rest.slice(colonIdx + 1).trim()

  // 词条（含假名标注、词性）和英文释义的边界：空格+ASCII字母或 [
  const wordEnIdx = beforeColon.search(/\s+[a-zA-Z[]/)
  if (wordEnIdx === -1) return null

  const wordPart  = beforeColon.slice(0, wordEnIdx).trim()
  const enMeaning = beforeColon.slice(wordEnIdx).trim()

  const rMatch  = wordPart.match(/（(.+?)）/)
  const reading = rMatch ? rMatch[1] : wordPart

  return { index, word: wordPart, reading, en: enMeaning, zh: zhMeaning }
}

// ── 词条格式 C：2行，翻译在例句同行 ───────────────────────────────────────────

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
      meaning:  { en: parsed0.en, zh: parsed0.zh },
      sentence: {
        ja: exContent.slice(0, trIdx).trim(),
        zh: exContent.slice(trIdx + '翻译：'.length).trim(),
      },
    },
  }
}

// ── 词条格式 D：3行，ZH无前缀 ────────────────────────────────────────────────

function parseItemFormatD(lines, i) {
  const parsed0 = parseWordMeaningLine(lines[i] ?? '')
  if (!parsed0) return null

  const line1 = (lines[i + 1] ?? '').trim()
  if (!line1.startsWith('例：')) return null
  const jaSentence = line1.slice('例：'.length).trim()

  const line2 = (lines[i + 2] ?? '').trim()
  if (!line2 || /^\d+\s+/.test(line2)) return null

  const zhSentence = line2.startsWith('翻译：')
    ? line2.slice('翻译：'.length).trim()
    : line2

  return {
    consumed: 3,
    card: {
      index: parsed0.index, word: parsed0.word, reading: parsed0.reading,
      meaning:  { en: parsed0.en, zh: parsed0.zh },
      sentence: { ja: jaSentence, zh: zhSentence },
    },
  }
}

// ── 统一入口：自动判断格式 ────────────────────────────────────────────────────

function parseNextItem(lines, i) {
  const line = lines[i] ?? ''
  if (!/^\d+\s+/.test(line)) return null

  // 格式 B：整条在一行（含 " 例："）
  if (line.includes(' 例：')) {
    return parseItemFormatB(line)
  }

  // 格式 C/D/E：首行含全角冒号（词+释义在同一行）
  if (line.includes('：')) {
    const line1 = (lines[i + 1] ?? '').trim()
    if (!line1.startsWith('例：')) return null

    if (line1.includes('翻译：')) {
      // 格式 C：翻译和例句在同一行
      return parseItemFormatC(lines, i)
    } else {
      // 格式 D/E：第三行是 ZH（有无 "翻译：" 前缀均可，统一由 parseItemFormatD 处理）
      return parseItemFormatD(lines, i)
    }
  }

  // 格式 A：首行仅含词条，释义在第二行
  return parseItemFormatA(lines, i)
}

// ── 章节文件切割 ──────────────────────────────────────────────────────────────

/**
 * 将章节 txt 内容切分为课段列表。
 * 每段：{ lessonId: string, titleLine: string, contentLines: string[] }
 *
 * - "---" 行（≥3 连字符）作为分隔符；文件开头可以没有分隔符
 * - 课 ID 行宽松匹配：只取 ch##-l## 部分，忽略后面的 .txt/(续) 等
 */
function splitIntoLessonBlocks(text) {
  const rawLines = text.split(/\r?\n/)
  const blocks   = []
  let current    = null

  // 文件开头即视为一个分隔线（支持无前置 --- 的文件）
  current = { lessonId: null, titleLine: null, contentLines: [] }

  for (const raw of rawLines) {
    const line = raw.trim()

    // 分隔线 → 保存当前块，开启新块
    if (/^-{3,}/.test(line)) {
      if (current?.lessonId) blocks.push(current)
      current = { lessonId: null, titleLine: null, contentLines: [] }
      continue
    }

    if (!line) continue  // 空行跳过

    // 等待课 ID（宽松匹配，忽略 .txt、(续) 等后缀）
    if (!current.lessonId) {
      const idMatch = line.match(/^(ch\d{2}-l\d{2})/)
      if (idMatch) {
        current.lessonId = idMatch[1]
      } else {
        // 不是课 ID → 当前块没有有效 ID，重置
        console.warn(`[warn] expected lessonId (e.g. ch03-l01), got: "${line}" — skipped`)
        current = { lessonId: null, titleLine: null, contentLines: [] }
      }
      continue
    }

    // 等待标题行
    if (!current.titleLine) {
      current.titleLine = line
      continue
    }

    // 内容行（保留，不 trim，格式解析时再 trim）
    current.contentLines.push(raw)
  }

  if (current?.lessonId) blocks.push(current)

  // 过滤掉无效块（contentLines 全为空的课）
  return blocks.filter((b) => b.lessonId && b.titleLine)
}

// ── 主流程 ────────────────────────────────────────────────────────────────────

function main() {
  if (!fs.existsSync(CHAPTER_DIR)) {
    console.error('missing chapter dir:', CHAPTER_DIR)
    process.exit(1)
  }
  fs.mkdirSync(OUT_DIR, { recursive: true })

  const structure = readJson(STRUCTURE_PATH)
  const audioMap  = parseCsv(fs.readFileSync(AUDIO_MAP_PATH, 'utf8'))

  // 支持 ch##.txt 和 ch###.txt（如 ch010.txt → 视为 ch10）
  const files = fs
    .readdirSync(CHAPTER_DIR)
    .filter((f) => /^ch\d{2,3}\.txt$/.test(f))
    .sort()

  if (files.length === 0) {
    console.log('No chapter txt found under', CHAPTER_DIR)
    return
  }

  const lessonIndex = []

  for (const f of files) {
    const text   = fs.readFileSync(path.join(CHAPTER_DIR, f), 'utf8')
    const blocks = splitIntoLessonBlocks(text)

    if (blocks.length === 0) {
      console.warn(`[skip] no lesson blocks found in ${f}`)
      continue
    }

    console.log(`\n[chapter] ${f}  →  ${blocks.length} lesson(s)`)

    for (const block of blocks) {
      const { lessonId, titleLine, contentLines } = block

      const meta = getLessonMeta(structure, lessonId)
      if (!meta) {
        console.warn(`  [skip] ${lessonId} not found in structure`)
        continue
      }

      const rangeNote = extractRangeNote(titleLine)
      const audioRow  = audioMap.find((r) => r.lessonId === lessonId)

      // content 行先 trim，再过滤空行
      const lines = contentLines.map((l) => l.trim()).filter(Boolean)

      const cards = []
      let i = 0
      while (i < lines.length) {
        const parsed = parseNextItem(lines, i)
        if (!parsed) {
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

      if (cards.length === 0) {
        console.warn(`  [warn] ${lessonId}: no cards parsed — check file format`)
        continue
      }

      const out = {
        id:        lessonId,
        chapterId: meta.chapter.id,
        titleJa:   meta.lesson.titleJa,
        titleZh:   meta.lesson.titleZh,
        rangeNote: rangeNote ?? undefined,
        audio: audioRow
          ? { track: audioRow.track, file: audioRow.audioRelPath }
          : undefined,
        cards,
      }

      const outPath = path.join(OUT_DIR, `${lessonId}.json`)
      fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n', 'utf8')
      console.log(`  [ok] ${lessonId}  cards=${cards.length}`)

      lessonIndex.push({
        lessonId,
        chapterId: meta.chapter.id,
        titleJa:   meta.lesson.titleJa,
        titleZh:   meta.lesson.titleZh,
        cards:     cards.length,
      })
    }
  }

  if (lessonIndex.length === 0) {
    console.log('\nNo lessons were written.')
    return
  }

  // ── 合并已有索引，不覆盖未处理的课 ──────────────────────────────────────────
  const idxPath = path.join(ROOT, 'data', 'n2', 'lessons.index.json')
  let existingLessons = []
  if (fs.existsSync(idxPath)) {
    try { existingLessons = readJson(idxPath).lessons ?? [] } catch { /**/ }
  }

  const newIds    = new Set(lessonIndex.map((l) => l.lessonId))
  const preserved = existingLessons.filter((l) => !newIds.has(l.lessonId))
  const merged    = [...preserved, ...lessonIndex]
  merged.sort((a, b) => a.lessonId.localeCompare(b.lessonId))

  fs.writeFileSync(idxPath, JSON.stringify({ lessons: merged }, null, 2) + '\n', 'utf8')
  console.log(
    `\n[ok] lessons.index.json` +
    `  total=${merged.length}` +
    `  new/updated=${lessonIndex.length}` +
    `  preserved=${preserved.length}`,
  )
}

main()
