import path from 'node:path'
import { ROOT } from './import-utils.mjs'

const BOOK_CONFIGS = {
  n2: {
    key: 'n2',
    bookId: 'vocab-taisaku-n2',
    sourceBook: '新日语能力考试 万词对策 N2',
    sourceLevel: 'N2',
    structurePath: path.join(ROOT, 'data', 'n2-lesson-structure.json'),
    audioMapPath: path.join(ROOT, 'data', 'n2-audio-map.csv'),
    outDir: path.join(ROOT, 'data', 'n2', 'lessons'),
    indexPath: path.join(ROOT, 'data', 'n2', 'lessons.index.json'),
    chapterDir: path.join(ROOT, 'resources', 'chapters-N2'),
    textDir: path.join(ROOT, 'resources', 'text'),
    audioDir: path.join(ROOT, 'resources', 'audio', 'extracted', '万词对策N2'),
  },
  n3: {
    key: 'n3',
    bookId: 'vocab-taisaku-n3',
    sourceBook: '新日语能力考试 万词对策 N3',
    sourceLevel: 'N3',
    structurePath: path.join(ROOT, 'data', 'n3-lesson-structure.json'),
    audioMapPath: path.join(ROOT, 'data', 'n3-audio-map.csv'),
    outDir: path.join(ROOT, 'data', 'n3', 'lessons'),
    indexPath: path.join(ROOT, 'data', 'n3', 'lessons.index.json'),
    chapterDir: path.join(ROOT, 'resources', 'chapters-n3'),
    textDir: path.join(ROOT, 'resources', 'text-n3'),
    audioDir: path.join(ROOT, 'resources', 'audio', 'extracted', '万词对策N3'),
  },
}

export function parseBookArg(argv = process.argv.slice(2)) {
  const arg = argv.find((item) => item.startsWith('--book='))
  return arg ? arg.slice('--book='.length).trim().toLowerCase() : 'n2'
}

export function getBookConfig(bookKey = 'n2') {
  const config = BOOK_CONFIGS[bookKey]
  if (!config) {
    const supported = Object.keys(BOOK_CONFIGS).join(', ')
    throw new Error(`unsupported --book=${bookKey}; supported: ${supported}`)
  }
  return config
}

