import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import './RotateArray.css'

const DEFAULT_ARRAY = [1, 2, 3, 4, 5, 6, 7]
const DEFAULT_K = 3
const STEP_DELAY = 600

function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b)
}

function buildSteps(arr, k) {
  const size = arr.length
  const steps = []
  const num = [...arr]

  k = ((k % size) + size) % size
  if (k === 0) return [{ array: [...num], highlight: [], desc: 'k = 0，陣列不變', phase: 'done' }]

  steps.push({ array: [...num], highlight: [], desc: `初始陣列，k = ${k}，陣列長度 = ${size}`, phase: 'init' })

  const cycles = gcd(size, k)
  steps.push({
    array: [...num],
    highlight: [],
    desc: `GCD(${size}, ${k}) = ${cycles}，共有 ${cycles} 條獨立的環`,
    phase: 'info',
  })

  let count = 0
  for (let start = 0; count < size; start++) {
    const cycleIndices = []
    let cur = start
    do {
      cycleIndices.push(cur)
      cur = (cur + k) % size
    } while (cur !== start)

    steps.push({
      array: [...num],
      highlight: cycleIndices,
      desc: `環 ${start}：index ${cycleIndices.join(' → ')} → ${start}（共 ${cycleIndices.length} 個元素）`,
      phase: 'cycle-start',
      cycleId: start,
    })

    cur = start
    let prev = num[start]
    do {
      const next = (cur + k) % size
      const tmp = num[next]
      num[next] = prev

      const from = cur
      const to = next
      steps.push({
        array: [...num],
        highlight: [from, to],
        moving: { from, to, value: prev },
        desc: `index ${from} 的值 ${prev} → 移到 index ${to}`,
        phase: 'move',
        cycleId: start,
      })

      prev = tmp
      cur = next
      count++
    } while (cur !== start)
  }

  steps.push({ array: [...num], highlight: [], desc: '✅ 完成！每個元素精確移動了一次', phase: 'done' })
  return steps
}

export default function RotateArray() {
  const [inputArr, setInputArr] = useState(DEFAULT_ARRAY.join(', '))
  const [inputK, setInputK] = useState(DEFAULT_K)
  const [steps, setSteps] = useState([])
  const [stepIdx, setStepIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [error, setError] = useState('')
  const timerRef = useRef(null)

  function parseAndBuild() {
    const parts = inputArr.split(',').map((s) => parseInt(s.trim(), 10))
    if (parts.some(isNaN) || parts.length === 0) {
      setError('請輸入有效的整數陣列，用逗號分隔')
      return
    }
    const k = parseInt(inputK, 10)
    if (isNaN(k) || k < 0) {
      setError('k 必須是非負整數')
      return
    }
    setError('')
    const s = buildSteps(parts, k)
    setSteps(s)
    setStepIdx(0)
    setPlaying(false)
  }

  useEffect(() => {
    parseAndBuild()
  }, [])

  useEffect(() => {
    if (playing) {
      timerRef.current = setInterval(() => {
        setStepIdx((i) => {
          if (i >= steps.length - 1) {
            setPlaying(false)
            return i
          }
          return i + 1
        })
      }, STEP_DELAY)
    }
    return () => clearInterval(timerRef.current)
  }, [playing, steps.length])

  const cur = steps[stepIdx]
  const total = steps.length

  const phaseColors = {
    init: '#6366f1',
    info: '#8b5cf6',
    'cycle-start': '#f59e0b',
    move: '#10b981',
    done: '#06b6d4',
  }

  return (
    <div className="ra-page">
      <div className="ra-back">
        <Link to="/">← 回首頁</Link>
      </div>

      <header className="ra-header">
        <h1>Rotate Array</h1>
        <p className="ra-subtitle">Cyclic Replacement 視覺化——每個元素只移動一次</p>
      </header>

      {/* Input area */}
      <div className="ra-card ra-input-area">
        <div className="ra-input-row">
          <label>
            陣列（逗號分隔）
            <input
              value={inputArr}
              onChange={(e) => setInputArr(e.target.value)}
              placeholder="1, 2, 3, 4, 5, 6, 7"
            />
          </label>
          <label>
            k 值
            <input
              type="number"
              min="0"
              value={inputK}
              onChange={(e) => setInputK(e.target.value)}
              style={{ width: '80px' }}
            />
          </label>
          <button className="ra-btn ra-btn-primary" onClick={parseAndBuild}>
            套用
          </button>
        </div>
        {error && <p className="ra-error">{error}</p>}
      </div>

      {/* Array visualization */}
      {cur && (
        <>
          <div className="ra-card ra-viz">
            <div className="ra-array">
              {cur.array.map((val, i) => {
                const isHighlight = cur.highlight?.includes(i)
                const isMovingTo = cur.moving?.to === i
                const isMovingFrom = cur.moving?.from === i
                return (
                  <div
                    key={i}
                    className={`ra-cell ${isHighlight ? 'highlight' : ''} ${isMovingTo ? 'moving-to' : ''} ${isMovingFrom ? 'moving-from' : ''}`}
                  >
                    <span className="ra-cell-val">{val}</span>
                    <span className="ra-cell-idx">{i}</span>
                  </div>
                )
              })}
            </div>

            {/* Step description */}
            <div
              className="ra-desc"
              style={{ borderLeft: `4px solid ${phaseColors[cur.phase] || '#888'}` }}
            >
              {cur.desc}
            </div>

            {/* Progress */}
            <div className="ra-progress-row">
              <span className="ra-step-count">
                步驟 {stepIdx + 1} / {total}
              </span>
              <div className="ra-progress-bar">
                <div
                  className="ra-progress-fill"
                  style={{ width: `${((stepIdx + 1) / total) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="ra-card ra-controls">
            <button
              className="ra-btn"
              onClick={() => { setPlaying(false); setStepIdx(0) }}
              disabled={stepIdx === 0 && !playing}
            >
              ⏮ 重置
            </button>
            <button
              className="ra-btn"
              onClick={() => { setPlaying(false); setStepIdx((i) => Math.max(0, i - 1)) }}
              disabled={stepIdx === 0}
            >
              ◀ 上一步
            </button>
            <button
              className="ra-btn ra-btn-primary"
              onClick={() => setPlaying((p) => !p)}
              disabled={stepIdx >= total - 1}
            >
              {playing ? '⏸ 暫停' : '▶ 播放'}
            </button>
            <button
              className="ra-btn"
              onClick={() => { setPlaying(false); setStepIdx((i) => Math.min(total - 1, i + 1)) }}
              disabled={stepIdx >= total - 1}
            >
              下一步 ▶
            </button>
            <button
              className="ra-btn"
              onClick={() => { setPlaying(false); setStepIdx(total - 1) }}
              disabled={stepIdx >= total - 1}
            >
              ⏭ 結尾
            </button>
          </div>
        </>
      )}

      {/* Algorithm explanation */}
      <div className="ra-card ra-explain">
        <h2>演算法說明</h2>

        <div className="ra-explain-grid">
          <div className="ra-explain-block">
            <h3>💡 核心思路</h3>
            <p>
              每個元素直接「跳」到它最終的位置：<br />
              index <code>i</code> 的元素 → 移到 index <code>(i + k) % size</code><br />
              形成一條搬運鍊，鍊繞回起點後換下一條。
            </p>
          </div>

          <div className="ra-explain-block">
            <h3>🔄 環的數量</h3>
            <p>
              環的數量 = <code>GCD(size, k)</code><br />
              每條環的長度 = <code>size / GCD(size, k)</code><br />
              所有環的元素數加總 = size（不重不漏）
            </p>
          </div>

          <div className="ra-explain-block">
            <h3>📊 複雜度</h3>
            <p>
              ⏱ 時間：<strong>O(n)</strong>——每個元素精確寫入一次<br />
              🧠 空間：<strong>O(1)</strong>——只用幾個臨時變數<br />
              vs 三次反轉法：寫入次數少約一半
            </p>
          </div>

          <div className="ra-explain-block">
            <h3>🧮 C 語言實作</h3>
            <pre className="ra-code">{`void rotateArray(int* num, int size, int k) {
    if (size == 0 || k == 0) return;
    k = k % size;
    if (k == 0) return;

    int count = 0;
    for (int start = 0; count < size; start++) {
        int current = start;
        int prev = num[start];
        do {
            int next = (current + k) % size;
            int tmp = num[next];
            num[next] = prev;
            prev = tmp;
            current = next;
            count++;
        } while (current != start);
    }
}`}</pre>
          </div>
        </div>
      </div>

      <footer className="ra-footer">
        小吉 Ji2kai · <a href="https://ji2kai.github.io">ji2kai.github.io</a>
      </footer>
    </div>
  )
}
