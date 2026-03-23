# 数据规范（Data Spec）- JLPT Vocab Cards

## 1. Lesson（课程）
```ts
type Lesson = {
  id: string;            // ch01-l01
  title: string;         // 第1课
  chapterId: string;
  audio?: {
    file: string;        // 相对路径：resources/audio/...
    durationSec?: number;
    sha1?: string;
  };
  cards: Card[];
};
```

## 2. Card（卡片）
```ts
type Card = {
  id: string;            // 稳定唯一（建议：lessonId + index）
  index: number;         // 课程内序号（显示编号）
  word: string;          // 日语单词（可能含汉字/假名）
  reading: string;       // 平假名
  meaning: {
    zh: string;
    en?: string;
  };
  sentence?: {
    ja: string;
    zh?: string;
  };
  source?: {
    book: string;        // 新日语能力考试 万词对策
    level: "N2";
    page?: number;
  };
};
```

## 3. Book（书）
```ts
type Book = {
  id: string;            // n2-vocab-taisaku
  title: string;
  level: "N2";
  chapters: {
    id: string;
    title: string;
    lessons: Lesson[];
  }[];
};
```

## 4. 文件输出建议
- data/n2.book.json：整书
- 或 data/n2/lesson/ch01-l01.json：按课拆分（推荐，便于增量更新）
