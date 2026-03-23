# 开发文档（Dev Plan）- JLPT N2 单词卡片 Web

## 1. 技术选型（建议）
- 前端：React + Vite（或 Next.js 也行；MVP 用 Vite 更轻）
- 路由：React Router
- 状态：轻量（Zustand/Redux 任选；MVP 可先 useState + context）
- 离线：PWA（Service Worker）
  - 音频缓存：Cache Storage（配合范围请求需注意）或 IndexedDB（更可控）
  - 数据缓存：IndexedDB（cards/lessons 元数据）
- 音频播放：HTMLAudioElement

## 2. Repo 目录约定（已创建）
- resources/pdf/      # 你放 PDF
- resources/audio/    # 你放每课音频
- resources/output/   # 我生成的中间产物（抽取文本、对照表、日志）
- data/               # 最终结构化数据（JSON）
- docs/               # 文档
- src/                # Web 代码

## 3. 数据流水线（从书到 JSON）
### 3.1 输入
- PDF（当前判断为扫描版，需要 OCR）
- 音频（已解压：Track001.mp3…Track060.mp3，对应 12 章×5 课）
  - 映射表：data/n2-audio-map.csv
  - 章节/课程结构：data/n2-lesson-structure.json

### 3.2 处理步骤（批处理脚本，后续实现）
1) PDF 解析：
   - 若可复制文本：直接抽取文本
   - 若扫描：OCR
2) 结构化：按“章节/课程”切分，提取单词条目 + 例句
3) 对齐：
   - 课程 id 与音频文件名建立映射
   - 若命名不规则：生成 mapping.csv/JSON 让你补一遍
4) 输出：
   - data/n2.json（或 data/n2/*.json 分课输出）

## 4. 前端页面清单（MVP）
1) 书籍页（N2）
2) 章节页
3) 课程页
   - 音频播放器（播放/暂停/进度/倍速可选）
   - 下载本课（预缓存）
   - 模式切换：全屏卡片 / 列表
4) 设置页
   - 缓存占用
   - 清理缓存

## 5. 音频缓存实现要点（Web）
- 若音频文件较大：
  - 优先考虑通过 Service Worker 做 fetch 缓存；
  - 注意 Range 请求（部分浏览器播放器会发 Range），需要正确响应，否则会导致无法拖动或无法播放。
- MVP 可先：
  - 预缓存：完整下载到 Cache Storage（或 IndexedDB）
  - 播放即缓存：当播放触发时检查缓存，不在则后台下载

## 6. 里程碑
- M0：确定数据格式（1 课样例 JSON + 对应音频命名规则）
- M1：完成数据抽取/结构化脚本（至少 N2 前 1-2 章）
- M2：React MVP（课程页 + 卡片交互 + 音频播放）
- M3：PWA 离线 + 音频缓存/预缓存

## 7. 验收清单
- iPhone Safari/Android Chrome：长按 1 秒揭示/松开隐藏稳定
- 断网后能打开已访问课程并播放已缓存音频
- 课程音频与卡片不串课
