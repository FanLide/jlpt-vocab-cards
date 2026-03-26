// Audio pre-cache implementation.
// Android WebView / Chrome 对跨域媒体 fetch 更敏感，
// 所以这里显式指定 mode + clone response 再写 cache。

export async function precacheAudio(url: string) {
  if (!('caches' in window)) {
    throw new Error('当前浏览器不支持离线缓存')
  }

  const cache = await caches.open('jlpt-audio-v1')

  let res: Response
  try {
    res = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
      cache: 'no-cache',
    })
  } catch (err) {
    throw new Error(`音频下载失败（网络/CORS）: ${err instanceof Error ? err.message : String(err)}`)
  }

  if (!res.ok) {
    throw new Error(`音频下载失败（HTTP ${res.status})`)
  }

  try {
    await cache.put(url, res.clone())
  } catch (err) {
    throw new Error(`写入离线缓存失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export async function isAudioCached(url: string) {
  if (!('caches' in window)) return false
  const cache = await caches.open('jlpt-audio-v1')
  const match = await cache.match(url)
  return !!match
}
