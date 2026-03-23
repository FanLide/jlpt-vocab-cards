import { Link } from 'react-router-dom'
import { useLoopEnabled } from '../lib/settings'

export function SettingsPage() {
  const [loop, setLoop] = useLoopEnabled()

  return (
    <div style={{ padding: 16, maxWidth: 820, margin: '0 auto' }}>
      <div style={{ marginBottom: 12 }}>
        <Link to="/">← 返回目录</Link>
      </div>

      <h2>设置</h2>

      <div
        style={{
          marginTop: 12,
          padding: 12,
          border: '1px solid #eee',
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div>
          <div style={{ fontWeight: 700 }}>循环播放（卡片翻页）</div>
          <div style={{ opacity: 0.75, fontSize: 12 }}>打开后：最后一张 → 下一张会回到第一张。</div>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" checked={loop} onChange={(e) => setLoop(e.target.checked)} />
          {loop ? '开' : '关'}
        </label>
      </div>
    </div>
  )
}
