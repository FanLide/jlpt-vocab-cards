# jlpt-vocab-cards

JLPT《新日语能力考试 万词对策》单词 + 例句卡片 Web 应用，当前支持 N2 / N3 两本教材，并按书籍独立维护结构、音频映射与课程 JSON。

## 目录
- docs/：产品设计与开发文档
- resources/pdf/：放 PDF
- resources/audio/：放每课音频
- data/：结构化输出（按 `n2/`、`n3/` 分书维护）
- src/：前端代码

## 已定的 MVP 关键点
- 平台：Web（React），后续可封装成 App
- 课程-音频-卡片强绑定：每课一个音频文件
- 卡片：默认仅“编号 + 平假名”，长按 1 秒揭示，**松开隐藏**
- 离线：播放即缓存 + 本课下载/预缓存
- 多语言：meaning 预留 en 字段（UI 先中文）

## 下一步（你放好资源后我来做）
1) 检查 PDF 是否可复制文本/是否需要 OCR
2) 做 1 课样例抽取：生成 lesson JSON 模板
3) 批量抽取全书，生成 `data/<book>/*`

## 导入脚本
- 生成某本书的结构与音频映射：`node scripts/generate-book-manifest.mjs --book=n3`
- 从章节文本重建课程 JSON：`node scripts/import-chapter-to-json.mjs --book=n3`
- 单课文本导入兼容入口：`node scripts/import-text-to-json.mjs --book=n2`
