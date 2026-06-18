import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getRecentEntries } from '../lib/queries'
import AddEntryForm from '../components/AddEntryForm'
import EntryCard from '../components/EntryCard'
import { format } from 'date-fns'

function groupByDay(entries) {
  const groups = {}
  entries.forEach(e => {
    const day = format(new Date(e.logged_at), 'yyyy-MM-dd')
    if (!groups[day]) groups[day] = []
    groups[day].push(e)
  })
  return groups
}

export default function LogPage() {
  const { session } = useAuth()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session?.user?.id) return
    getRecentEntries(session.user.id, 100)
      .then(setEntries)
      .finally(() => setLoading(false))
  }, [session?.user?.id])

  function handleAdded(entry) {
    setEntries(prev => [entry, ...prev])
  }

  function handleDelete(id) {
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  const groups = groupByDay(entries)
  const days = Object.keys(groups).sort((a, b) => b.localeCompare(a))

  return (
    <div className="page">
      <h1 style={{ marginBottom: '1.25rem' }}>Log</h1>
      <AddEntryForm onAdded={handleAdded} />

      <div style={{ marginTop: '1.75rem' }}>
        {loading && <p style={{ color: 'var(--muted)' }}>Loading…</p>}
        {days.map(day => (
          <div key={day} style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.5rem' }}>
              <h3 style={{ color: 'var(--muted)', fontSize: '.82rem', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                {format(new Date(day + 'T12:00:00'), 'EEEE, MMMM d')}
              </h3>
              <span style={{ color: 'var(--muted)', fontSize: '.82rem' }}>
                {groups[day].reduce((s, e) => s + e.amount_mg, 0).toFixed(2)} mg
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.55rem' }}>
              {groups[day].map(e => (
                <EntryCard key={e.id} entry={e} onDelete={handleDelete} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
