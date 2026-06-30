import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { format, parseISO } from 'date-fns'
import { X, Trash2, Plus } from 'lucide-react'
import { deleteEntry, addEntry } from '../lib/queries'

const MIN = 0.1
const MAX = 2.0
const STEP = 0.1

export default function DayDetailModal({ date, userId, partnerId, partnerName, onClose, onDeleted, onAdded }) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [sliderVal, setSliderVal] = useState(1.0)
  const [custom, setCustom] = useState('')
  const [useCustom, setUseCustom] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [timeInput, setTimeInput] = useState('12:00')
  const listRef = useRef(null)

  useEffect(() => {
    if (showAdd && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [showAdd])

  const now = new Date()
  const calendarToday = now.toISOString().slice(0, 10)
  const isPastDay = date < calendarToday

  useEffect(() => {
    const start = new Date(date + 'T00:00:00')
    const end   = new Date(date + 'T23:59:59')
    const userIds = [userId, partnerId].filter(Boolean)
    supabase
      .from('log_entries')
      .select('*')
      .in('user_id', userIds)
      .gte('logged_at', start.toISOString())
      .lte('logged_at', end.toISOString())
      .order('logged_at', { ascending: true })
      .then(({ data }) => { setEntries(data ?? []); setLoading(false) })
  }, [date, userId, partnerId])

  const total = entries.reduce((s, e) => s + e.amount_mg, 0)
  const label = format(new Date(date + 'T12:00:00'), 'EEEE, MMMM d')
  const pct = ((sliderVal - MIN) / (MAX - MIN)) * 100

  async function handleDelete(id) {
    const entry = entries.find(e => e.id === id)
    await deleteEntry(id)
    setEntries(prev => prev.filter(e => e.id !== id))
    if (onDeleted) onDeleted(id, date, entry?.amount_mg ?? 0)
  }

  async function handleAdd() {
    const amount = useCustom ? parseFloat(custom) : sliderVal
    if (!amount || amount <= 0) { setError('Enter a valid amount'); return }
    setError('')
    setSaving(true)
    try {
      const logged_at = isPastDay
        ? new Date(date + 'T' + timeInput + ':00').toISOString()
        : new Date().toISOString()
      const entry = await addEntry({ amount_mg: amount, logged_at })
      setEntries(prev => [...prev, entry])
      if (onAdded) onAdded(entry, date)
      setShowAdd(false)
      setSliderVal(1.0)
      setCustom('')
      setUseCustom(false)
      setTimeInput('12:00')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

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
          maxHeight: '85dvh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: '.75rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.2rem' }}>
              {label}
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 900, lineHeight: 1 }}>
              {total.toFixed(2)}
              <span style={{ fontSize: '.9rem', color: 'var(--muted)', fontWeight: 400, marginLeft: '.3rem' }}>g total</span>
            </div>
          </div>
          <button className="btn-ghost" onClick={onClose} style={{ padding: '.3rem', marginTop: '.1rem' }}>
            <X size={20} />
          </button>
        </div>

        {/* Entries list */}
        <div ref={listRef} style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '.6rem', flexGrow: 1 }}>
          {loading && <p style={{ color: 'var(--muted)' }}>Loading…</p>}
          {!loading && entries.length === 0 && !showAdd && (
            <p style={{ color: 'var(--muted)', fontSize: '.9rem' }}>No entries for this day.</p>
          )}
          {entries.map((entry, i) => {
            const isMe = entry.user_id === userId
            return (
              <div
                key={entry.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  background: 'var(--bg)', borderRadius: 12,
                  padding: '.75rem 1rem',
                  border: `1px solid ${isMe ? 'var(--border)' : 'rgba(99,102,241,.25)'}`,
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: isMe ? 'rgba(99,102,241,.15)' : 'rgba(251,191,36,.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '.75rem', fontWeight: 700,
                  color: isMe ? 'var(--accent)' : '#fbbf24',
                  flexShrink: 0,
                }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>{(+entry.amount_mg).toFixed(2)}g</div>
                  <div style={{ color: 'var(--muted)', fontSize: '.78rem', marginTop: '.1rem' }}>
                    {format(parseISO(entry.logged_at), 'h:mm a')}
                    {partnerId && (
                      <span style={{ marginLeft: '.4rem', opacity: .7 }}>· {isMe ? 'You' : partnerName}</span>
                    )}
                  </div>
                </div>
                {isMe && (
                  <button
                    onClick={() => handleDelete(entry.id)}
                    style={{ background: 'none', border: 'none', padding: '.3rem', color: 'var(--danger)', cursor: 'pointer', flexShrink: 0 }}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            )
          })}

          {/* Inline add form */}
          {showAdd && (
            <div style={{ background: 'var(--bg)', borderRadius: 12, padding: '1rem', border: '1px solid var(--primary)', overflow: 'hidden' }}>
              <div style={{ textAlign: 'center', fontSize: '2.5rem', fontWeight: 900, marginBottom: '.75rem', lineHeight: 1 }}>
                {useCustom ? (custom || '—') : sliderVal.toFixed(2)}
                <span style={{ fontSize: '.9rem', color: 'var(--muted)', fontWeight: 400, marginLeft: '.3rem' }}>g</span>
              </div>
              <input
                type="range" min={MIN} max={MAX} step={STEP}
                value={sliderVal}
                onChange={e => { setSliderVal(parseFloat(e.target.value)); setUseCustom(false); setCustom('') }}
                style={{
                  width: '100%', height: 6, appearance: 'none',
                  background: `linear-gradient(to right, var(--primary) ${pct}%, var(--border) ${pct}%)`,
                  borderRadius: 99, outline: 'none', cursor: 'pointer', marginBottom: '.5rem',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.72rem', color: 'var(--muted)', marginBottom: '.75rem' }}>
                <span>0.1g</span><span>2.0g</span>
              </div>
              <input
                type="number" inputMode="decimal" step="0.01" min="0.01"
                placeholder="More than 2g? Type here"
                value={custom}
                onChange={e => { setCustom(e.target.value); setUseCustom(true) }}
                style={{ marginBottom: '.75rem' }}
              />
              {isPastDay && (
                <div style={{ marginBottom: '.75rem' }}>
                  <div style={{ fontSize: '.78rem', color: 'var(--muted)', marginBottom: '.3rem' }}>Time</div>
                  <input
                    type="time"
                    value={timeInput}
                    onChange={e => setTimeInput(e.target.value)}
                    style={{ width: '100%', minWidth: 0, maxWidth: '100%' }}
                  />
                </div>
              )}
              {error && <p className="error-msg" style={{ marginBottom: '.5rem' }}>{error}</p>}
              <div style={{ display: 'flex', gap: '.5rem' }}>
                <button
                  onClick={() => { setShowAdd(false); setError(''); setTimeInput('12:00') }}
                  style={{ flex: 1, padding: '.65rem', background: 'transparent', border: '1.5px solid var(--border)', borderRadius: 10, color: 'var(--muted)', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  className="btn-primary"
                  onClick={handleAdd}
                  disabled={saving}
                  style={{ flex: 2, padding: '.65rem', borderRadius: 10 }}
                >
                  {saving ? 'Saving…' : 'Log It'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Add button */}
        {!showAdd && (
          <button
            onClick={() => setShowAdd(true)}
            style={{
              marginTop: '1rem', width: '100%', padding: '.85rem',
              background: 'var(--primary)', color: '#fff', border: 'none',
              borderRadius: 14, fontWeight: 700, fontSize: '1rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem',
              flexShrink: 0,
            }}
          >
            <Plus size={18} /> Add to this day
          </button>
        )}
      </div>
    </div>
  )
}
