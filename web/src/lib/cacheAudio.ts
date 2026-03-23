// Minimal “pre-cache audio” implementation.
// Note: HTMLAudio may use Range requests; for MVP we cache full file and use <audio src> directly.

export async function precacheAudio(url: string) {
  if (!('caches' in window)) {
    throw new Error('Cache API not supported in this browser')
  }
  const cache = await caches.open('jlpt-audio-v1')
  const res = await fetch(url)
  if (!res.ok) throw new Error(`download failed: ${res.status}`)
  await cache.put(url, res)
}

export async function isAudioCached(url: string) {
  if (!('caches' in window)) return false
  const cache = await caches.open('jlpt-audio-v1')
  const match = await cache.match(url)
  return !!match
}
