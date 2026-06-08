import { useState } from 'react'
import { addEntry } from '../lib/queries'
import { X } from 'lucide-react'

const MIN = 0.1
const MAX = 2.0
const STEP = 0.1

export default function QuickAddModal({ onAdded, onClose }) {
  const [sliderVal, setSliderVal] = useState(1.0)
  const [custom, setCustom] = useState('')
  const [useCustom, setUseCustom] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const displayVal = useCustom ? (parseFloat(custom) || '') : sliderVal

  function handleSlider(e) {
    const v = parseFloat(e.target.value)
    setSliderVal(v)
    setUseCustom(false)
    setCustom('')
  }

  function handleCustom(e) {
    setCustom(e.target.value)
    setUseCustom(true)
  }

  async function handleSubmit() {
    const amount = useCustom ? parseFloat(custom) : sliderVal
    if (!amount || amount <= 0) { setError('Enter a valid amount'); return }
    setError('')
    setLoading(true)
    try {
      const entry = await addEntry({
        amount_mg: amount,
        logged_at: new Date().toISOString(),
      })
      onAdded(entry)
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // percentage for the slider fill
  const pct = ((sliderVal - MIN) / (MAX - MIN)) * 100

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,.6)',
        display: 'flex', alignItems: 'flex-end',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480, margin: '0 auto',
          background: 'var(--surface)',
          borderRadius: '24px 24px 0 0',
          padding: '1.5rem 1.5rem 2.5rem',
          border: '1px solid var(--border)',
        }}
      >
        {/* Handle + close */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
          <div style={{ width: 40, height: 4, borderRadius: 99, background: 'var(--border)', margin: '0 auto' }} />
          <button className="btn-ghost" onClick={onClose} style={{ position: 'absolute', right: '1.25rem', top: '1.25rem', padding: '.3rem' }}>
            <X size={20} />
          </button>
        </div>

        {/* Big amount display */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '5rem', fontWeight: 900, lineHeight: 1, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
            {useCustom ? (custom || '—') : sliderVal.toFixed(1)}
          </div>
          <div style={{ color: 'var(--muted)', fontSize: '1rem', marginTop: '.4rem' }}>grams</div>
        </div>

        {/* Slider */}
        <div style={{ marginBottom: '1.25rem' }}>
          <input
            type="range"
            min={MIN} max={MAX} step={STEP}
            value={sliderVal}
            onChange={handleSlider}
            style={{
              width: '100%', height: 6, appearance: 'none',
              background: `linear-gradient(to right, var(--primary) ${pct}%, var(--border) ${pct}%)`,
              borderRadius: 99, outline: 'none', cursor: 'pointer',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '.4rem', color: 'var(--muted)', fontSize: '.75rem' }}>
            <span>0.1g</span>
            <span>2.0g</span>
          </div>
        </div>

        {/* Custom amount toggle */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ color: 'var(--muted)', fontSize: '.82rem', marginBottom: '.4rem' }}>More than 2g?</div>
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            min="0.1"
            placeholder="Type custom amount (g)"
            value={custom}
            onChange={handleCustom}
            style={{ background: useCustom ? 'var(--bg)' : 'transparent' }}
          />
        </div>

        {error && <p className="error-msg" style={{ marginBottom: '.75rem' }}>{error}</p>}

        <button
          className="btn-primary"
          onClick={handleSubmit}
          disabled={loading}
          style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', borderRadius: 16 }}
        >
          {loading ? 'Saving…' : 'Log It'}
        </button>
      </div>
    </div>
  )
}
