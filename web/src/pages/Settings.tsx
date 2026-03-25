import { Link } from 'react-router-dom'
import { useLoopEnabled } from '../lib/settings'
import './Settings.css'

export function SettingsPage() {
  const [loop, setLoop] = useLoopEnabled()

  return (
    <div className="settings-page">
      <div className="settings-back">
        <Link to="/">← 返回</Link>
      </div>

      <h2 className="settings-title">设置</h2>

      <div className="settings-section">
        <div className="settings-row">
          <div className="settings-row-info">
            <div className="settings-row-label">循环播放</div>
            <div className="settings-row-desc">打开后：最后一张 → 下一张会回到第一张</div>
          </div>
          <button
            className={`toggle-btn ${loop ? 'on' : ''}`}
            onClick={() => setLoop(!loop)}
            aria-pressed={loop}
          >
            <span className="toggle-thumb" />
          </button>
        </div>
      </div>
    </div>
  )
}
