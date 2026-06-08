import { useState } from 'react'
import { addEntry } from '../lib/queries'

const COMMON_TAGS = ['social', 'stress', 'sleep', 'habit', 'celebration', 'boredom', 'pain', 'other']

export default function AddEntryForm({ onAdded }) {
  const [amount, setAmount] = useState('')
  const [tag, setTag] = useState('')
  const [note, setNote] = useState('')
  const [time, setTime] = useState(() => new Date().toISOString().slice(0, 16))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const mg = parseFloat(amount)
    if (isNaN(mg) || mg <= 0) { setError('Enter a valid positive amount'); return }
    setLoading(true)
    try {
      const entry = await addEntry({
        amount_mg: mg,
        logged_at: new Date(time).toISOString(),
        tag: tag || null,
        note: note || null,
      })
      onAdded(entry)
      setAmount('')
      setNote('')
      setTag('')
      setTime(new Date().toISOString().slice(0, 16))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
      <h2>Add Entry</h2>

      <div>
        <label style={{ fontSize: '.8rem', color: 'var(--muted)', display: 'block', marginBottom: '.3rem' }}>
          Amount (mg)
        </label>
        <input
          type="number" inputMode="decimal" step="any" min="0.01"
          placeholder="e.g. 1400 or 700"
          value={amount} onChange={e => setAmount(e.target.value)}
          required
        />
      </div>

      <div>
        <label style={{ fontSize: '.8rem', color: 'var(--muted)', display: 'block', marginBottom: '.45rem' }}>
          Tag (optional)
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem' }}>
          {COMMON_TAGS.map(t => (
            <button
              key={t} type="button"
              className={`chip${tag === t ? ' active' : ''}`}
              onClick={() => setTag(tag === t ? '' : t)}
            >
              {t}
            </button>
          ))}
        </div>
        <input
          style={{ marginTop: '.5rem' }}
          placeholder="or type a custom tag"
          value={tag} onChange={e => setTag(e.target.value)}
        />
      </div>

      <div>
        <label style={{ fontSize: '.8rem', color: 'var(--muted)', display: 'block', marginBottom: '.3rem' }}>
          Note (optional)
        </label>
        <input placeholder="Brief note…" value={note} onChange={e => setNote(e.target.value)} />
      </div>

      <div>
        <label style={{ fontSize: '.8rem', color: 'var(--muted)', display: 'block', marginBottom: '.3rem' }}>
          Time
        </label>
        <input type="datetime-local" value={time} onChange={e => setTime(e.target.value)} />
      </div>

      {error && <p className="error-msg">{error}</p>}

      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? 'Saving…' : 'Save Entry'}
      </button>
    </form>
  )
}
