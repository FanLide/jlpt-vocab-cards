import { Link } from 'react-router-dom'
import { useLoopEnabled, useAutoNextLesson, useAutoPlayOnDeckEnter, useShowOriginalWord } from '../lib/settings'
import './Settings.css'

function ToggleRow({
  label, desc, value, onChange,
}: { label: string; desc: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="settings-row">
      <div className="settings-row-info">
        <div className="settings-row-label">{label}</div>
        <div className="settings-row-desc">{desc}</div>
      </div>
      <button
        className={`toggle-btn ${value ? 'on' : ''}`}
        onClick={() => onChange(!value)}
        aria-pressed={value}
      >
        <span className="toggle-thumb" />
      </button>
    </div>
  )
}

export function SettingsPage() {
  const [loop,     setLoop]     = useLoopEnabled()
  const [autoNext, setAutoNext] = useAutoNextLesson()
  const [autoPlay, setAutoPlay] = useAutoPlayOnDeckEnter()
  const [showWord, setShowWord] = useShowOriginalWord()

  const onChangeLoop = (next: boolean) => {
    setLoop(next)
    if (next) setAutoNext(false)
  }

  const onChangeAutoNext = (next: boolean) => {
    setAutoNext(next)
    if (next) setLoop(false)
  }

  return (
    <div className="settings-page">
      <div className="settings-back">
        <Link to="/">← 返回</Link>
      </div>

      <h2 className="settings-title">设置</h2>

      <div className="settings-section">
        <ToggleRow
          label="单课循环"
          desc="打开后：最后一张 → 下一张回到第一张"
          value={loop}
          onChange={onChangeLoop}
        />
        <ToggleRow
          label="完成后自动下一课"
          desc="播放完本课最后一张，自动跳转到下一课"
          value={autoNext}
          onChange={onChangeAutoNext}
        />
        <ToggleRow
          label="进入卡片模式自动播放"
          desc="从目录进入课程后，默认自动尝试播放本课音频"
          value={autoPlay}
          onChange={setAutoPlay}
        />
        <ToggleRow
          label="卡片正面显示原单词"
          desc="未翻开时同时显示汉字原词与平假名（关闭后仅显示平假名）"
          value={showWord}
          onChange={setShowWord}
        />
      </div>
    </div>
  )
}
