# jlpt-vocab-cards

JLPT N2《新日语能力考试 万词对策》单词 + 例句 → 离线可用的卡片 Web 应用（React）。

## 目录
- docs/：产品设计与开发文档
- resources/pdf/：放 PDF
- resources/audio/：放每课音频
- data/：结构化输出（JSON）
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
3) 批量抽取全书，生成 data/n2/*
