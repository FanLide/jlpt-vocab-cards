import { useState } from 'react'

const KEY_LOOP        = 'jlpt:loopEnabled'
const KEY_AUTO_NEXT   = 'jlpt:autoNextLesson'
const KEY_AUTO_PLAY   = 'jlpt:autoPlayOnDeckEnter'

function useBoolSetting(key: string, defaultVal: boolean) {
  const [val, setVal] = useState(() => {
    try {
      const v = localStorage.getItem(key)
      return v === null ? defaultVal : v === 'true'
    } catch { return defaultVal }
  })
  const update = (v: boolean) => {
    setVal(v)
    try { localStorage.setItem(key, String(v)) } catch { /* ignore */ }
  }
  return [val, update] as const
}

const KEY_SHOW_WORD   = 'jlpt:showOriginalWord'

export function useLoopEnabled()      { return useBoolSetting(KEY_LOOP,      true)  }
export function useAutoNextLesson()   { return useBoolSetting(KEY_AUTO_NEXT, false) }
export function useAutoPlayOnDeckEnter() { return useBoolSetting(KEY_AUTO_PLAY, true) }
export function useShowOriginalWord() { return useBoolSetting(KEY_SHOW_WORD, true)  }

