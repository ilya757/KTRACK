import { useState } from 'react'
import { addEntry } from '../lib/queries'
import { Plus } from 'lucide-react'

const MIN = 0.1
const MAX = 2.0
const STEP = 0.1

export default function AddEntryForm({ onAdded }) {
  const [sliderVal, setSliderVal] = useState(1.0)
  const [custom, setCustom] = useState('')
  const [useCustom, setUseCustom] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleSlider(e) {
    setSliderVal(parseFloat(e.target.value))
    setUseCustom(false)
    setCustom('')
  }

  const pct = ((sliderVal - MIN) / (MAX - MIN)) * 100

  async function handleSubmit(e) {
    e.preventDefault()
    const amount = useCustom ? parseFloat(custom) : sliderVal
    if (!amount || amount <= 0) { setError('Enter a valid amount'); return }
    setError('')
    setLoading(true)
    try {
      const entry = await addEntry({ amount_mg: amount, logged_at: new Date().toISOString() })
      onAdded(entry)
      setSliderVal(1.0)
      setCustom('')
      setUseCustom(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h2>Add Entry</h2>

      <div style={{ textAlign: 'center', fontSize: '3.5rem', fontWeight: 900, lineHeight: 1 }}>
        {useCustom ? (custom || '—') : sliderVal.toFixed(2)}
        <span style={{ fontSize: '1rem', color: 'var(--muted)', marginLeft: '.4rem' }}>g</span>
      </div>

      <div>
        <input
          type="range" min={MIN} max={MAX} step={STEP}
          value={sliderVal} onChange={handleSlider}
          style={{
            width: '100%', height: 6, appearance: 'none',
            background: `linear-gradient(to right, var(--primary) ${pct}%, var(--border) ${pct}%)`,
            borderRadius: 99, outline: 'none', cursor: 'pointer',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '.3rem', color: 'var(--muted)', fontSize: '.75rem' }}>
          <span>0.1g</span><span>2.0g</span>
        </div>
      </div>

      <div>
        <div style={{ color: 'var(--muted)', fontSize: '.82rem', marginBottom: '.35rem' }}>More than 2g?</div>
        <input
          type="number" inputMode="decimal" step="0.1" min="0.1"
          placeholder="Type custom amount (g)"
          value={custom}
          onChange={e => { setCustom(e.target.value); setUseCustom(true) }}
        />
      </div>

      {error && <p className="error-msg">{error}</p>}

      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? 'Saving…' : 'Log It'}
      </button>
    </form>
  )
}
