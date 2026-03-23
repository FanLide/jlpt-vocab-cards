import { useState } from 'react'

const KEY_LOOP = 'jlpt:loopEnabled'

export function getLoopEnabled() {
  const v = localStorage.getItem(KEY_LOOP)
  if (v === null) return true
  return v === 'true'
}

export function setLoopEnabled(v: boolean) {
  localStorage.setItem(KEY_LOOP, String(v))
}

export function useLoopEnabled() {
  const [enabled, setEnabled] = useState(() => {
    try {
      return getLoopEnabled()
    } catch {
      return true
    }
  })

  const update = (v: boolean) => {
    setEnabled(v)
    try {
      setLoopEnabled(v)
    } catch {
      // ignore
    }
  }

  return [enabled, update] as const
}
