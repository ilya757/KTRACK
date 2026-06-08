import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { format, parseISO } from 'date-fns'
import { X, Trash2 } from 'lucide-react'
import { deleteEntry } from '../lib/queries'

export default function DayDetailModal({ date, userId, onClose, onDeleted }) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const start = new Date(date + 'T00:00:00')
    const end   = new Date(date + 'T23:59:59')

    supabase
      .from('log_entries')
      .select('*')
      .eq('user_id', userId)
      .gte('logged_at', start.toISOString())
      .lte('logged_at', end.toISOString())
      .order('logged_at', { ascending: true })
      .then(({ data }) => {
        setEntries(data ?? [])
        setLoading(false)
      })
  }, [date, userId])

  const total = entries.reduce((s, e) => s + e.amount_mg, 0)

  async function handleDelete(id) {
    await deleteEntry(id)
    setEntries(prev => prev.filter(e => e.id !== id))
    if (onDeleted) onDeleted(id, date)
  }

  const label = format(new Date(date + 'T12:00:00'), 'EEEE, MMMM d')

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
          maxHeight: '75dvh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: '.75rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.2rem' }}>
              {label}
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 900, lineHeight: 1 }}>
              {total.toFixed(1)}
              <span style={{ fontSize: '.9rem', color: 'var(--muted)', fontWeight: 400, marginLeft: '.3rem' }}>g total</span>
            </div>
          </div>
          <button className="btn-ghost" onClick={onClose} style={{ padding: '.3rem', marginTop: '.1rem' }}>
            <X size={20} />
          </button>
        </div>

        {/* Entries list */}
        <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '.6rem', flexGrow: 1 }}>
          {loading && <p style={{ color: 'var(--muted)' }}>Loading…</p>}
          {!loading && entries.length === 0 && (
            <p style={{ color: 'var(--muted)', fontSize: '.9rem' }}>No entries for this day.</p>
          )}
          {entries.map((entry, i) => (
            <div
              key={entry.id}
              style={{
                display: 'flex', alignItems: 'center', gap: '1rem',
                background: 'var(--bg)', borderRadius: 12,
                padding: '.75rem 1rem',
                border: '1px solid var(--border)',
              }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'rgba(99,102,241,.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '.75rem', fontWeight: 700, color: 'var(--accent)', flexShrink: 0,
              }}>
                {i + 1}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>{entry.amount_mg}g</div>
                <div style={{ color: 'var(--muted)', fontSize: '.78rem', marginTop: '.1rem' }}>
                  {format(parseISO(entry.logged_at), 'h:mm a')}
                </div>
              </div>
              <button
                onClick={() => handleDelete(entry.id)}
                style={{ background: 'none', border: 'none', padding: '.3rem', color: 'var(--danger)', cursor: 'pointer', flexShrink: 0 }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
