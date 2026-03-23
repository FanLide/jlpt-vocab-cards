# 部署方案（Cloudflare Pages + R2 + Workers）

> 本项目已选：方案 A（Cloudflare）。

## 0. 目标
- 前端：部署到 Cloudflare Pages
- 音频：上传到 Cloudflare R2
- MVP：允许无后端（纯静态 + 本地进度）
- 后续：需要登录/同步时，再加 Cloudflare Workers + D1

## 1. 资源与仓库策略
- Git 只存：代码、docs、结构化 JSON、脚本
- 不进 Git：PDF、mp3（已通过 .gitignore 处理）

## 2. R2（音频）
### 2.1 上传结构（建议）
- bucket: `jlpt-vocab-cards`
- prefix: `audio/n2/`
  - `audio/n2/Track001.mp3` … `Track060.mp3`

### 2.2 访问策略（两种）
A) **公开访问（简单）**
- 直接给公开 URL
- 前端音频地址为 `https://<r2-public-domain>/audio/n2/Track001.mp3`

B) **私有访问（更安全）**
- Worker 提供 `GET /api/audio-url?track=Track001` 返回短期签名 URL
- 前端拿到 URL 再播放/缓存

> MVP 建议先 A，等要分享/公开再切 B。

## 3. Pages（前端）
### 3.1 构建
- root: `web/`
- build command: `pnpm install && pnpm build`
- output: `web/dist`

### 3.2 环境变量（建议）
- `VITE_AUDIO_BASE_URL`
  - 公开 R2（已选）：`https://<your-public-domain>/audio/n2/`（注意末尾带 `/`）
  - 本地开发：可不设置，走本地 `resources/audio/...` 路径

## 4. Workers（可选：登录/同步/签名 URL）
### 4.1 API 草案
- `POST /api/session/login`（可选）
- `GET /api/me/progress` / `POST /api/me/progress`
- `GET /api/audio-url?track=Track001`（私有音频时）

### 4.2 存储
- D1：用户、进度（若做登录/同步）
- KV：轻缓存（可选）

## 5. 已拍板（MVP）
- 登录/同步：**不需要**（进度本地存储）
- 音频访问：**公开访问**（R2 Public）
