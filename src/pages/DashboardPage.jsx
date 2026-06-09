import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getTodayEntries, getDailyTotals, getProfile } from '../lib/queries'
import GoalRing from '../components/GoalRing'
import CalendarView from '../components/CalendarView'
import EntryCard from '../components/EntryCard'
import QuickAddModal from '../components/QuickAddModal'
import DayDetailModal from '../components/DayDetailModal'
import { format } from 'date-fns'
import { Plus } from 'lucide-react'

export default function DashboardPage() {
  const { session, profile } = useAuth()
  const [todayEntries, setTodayEntries] = useState([])
  const [totals, setTotals] = useState([])
  const [partnerToday, setPartnerToday] = useState(null)
  const [partnerProfile, setPartnerProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [selectedDay, setSelectedDay] = useState(null)

  const userId = session?.user?.id
  const goal = profile?.daily_goal_mg ?? 2
  const partnerId = profile?.partner_id
  const todayTotal = todayEntries.reduce((s, e) => s + e.amount_mg, 0)

  useEffect(() => {
    if (!userId) return
    const fetches = [
      getTodayEntries(userId),
      getDailyTotals(userId, 31),
    ]
    if (partnerId) {
      fetches.push(getTodayEntries(partnerId))
      fetches.push(getProfile(partnerId))
    }
    Promise.all(fetches).then(([entries, tots, partnerEntries, pProfile]) => {
      setTodayEntries(entries)
      setTotals(tots)
      if (partnerEntries) {
        setPartnerToday(partnerEntries.reduce((s, e) => s + e.amount_mg, 0))
      }
      if (pProfile) setPartnerProfile(pProfile)
    }).finally(() => setLoading(false))
  }, [userId, partnerId])

  function handleAdded(entry) {
    setTodayEntries(prev => [entry, ...prev])
    // Update calendar totals in place so it reflects immediately
    const day = format(new Date(entry.logged_at), 'yyyy-MM-dd')
    setTotals(prev => {
      const existing = prev.find(t => t.day === day)
      if (existing) {
        return prev.map(t => t.day === day ? { ...t, total_mg: +t.total_mg + entry.amount_mg } : t)
      } else {
        return [...prev, { day, total_mg: entry.amount_mg }]
      }
    })
  }

  function handleEntryDeleted(id, day, amount) {
    removeEntry(id)
    setTotals(prev => prev.map(t =>
      t.day === day ? { ...t, total_mg: Math.max(0, +t.total_mg - amount) } : t
    ))
  }

  function removeEntry(id) {
    setTodayEntries(prev => prev.filter(e => e.id !== id))
  }

  return (
    <>
      <div className="page">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h1>{format(new Date(), 'EEEE, MMMM d')}</h1>
          </div>
        </div>

        {/* BIG ADD BUTTON */}
        <button
          onClick={() => setShowAdd(true)}
          style={{
            width: '100%',
            background: 'var(--primary)',
            color: '#fff',
            border: 'none',
            borderRadius: 20,
            padding: '1.25rem',
            fontSize: '1.2rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '.6rem',
            marginBottom: '1rem',
            boxShadow: '0 4px 24px rgba(99,102,241,.4)',
          }}
        >
          <Plus size={26} strokeWidth={2.5} />
          Add Entry
        </button>

        {/* Today's totals for both users */}
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '.75rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.75rem', fontWeight: 600 }}>
            Today's Totals
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <UserTotal
              name={profile?.display_name ?? 'You'}
              total={todayTotal}
              goal={goal}
              isMe
            />
            {partnerId ? (
              <UserTotal
                name={partnerProfile?.display_name ?? 'Partner'}
                total={partnerToday ?? null}
                goal={partnerProfile?.daily_goal_mg ?? goal}
              />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: '.8rem', textAlign: 'center' }}>
                Link partner in Settings
              </div>
            )}
          </div>
        </div>

        {/* Calendar */}
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>{format(new Date(), 'MMMM yyyy')}</h2>
          {loading ? (
            <p style={{ color: 'var(--muted)' }}>Loading…</p>
          ) : (
            <CalendarView totals={totals} goal={goal} onDayClick={setSelectedDay} />
          )}
        </div>

        {/* Today's entries */}
        <div style={{ marginBottom: '.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Today</h2>
          <span style={{ color: 'var(--muted)', fontSize: '.82rem' }}>{todayEntries.length} entries</span>
        </div>
        {!loading && todayEntries.length === 0 && (
          <p style={{ color: 'var(--muted)', fontSize: '.9rem' }}>Nothing logged yet today.</p>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
          {todayEntries.map(e => (
            <EntryCard key={e.id} entry={e} onDelete={removeEntry} />
          ))}
        </div>
      </div>

      {showAdd && (
        <QuickAddModal
          onAdded={handleAdded}
          onClose={() => setShowAdd(false)}
        />
      )}

      {selectedDay && (
        <DayDetailModal
          date={selectedDay}
          userId={userId}
          onClose={() => setSelectedDay(null)}
          onDeleted={handleEntryDeleted}
        />
      )}
    </>
  )
}

function UserTotal({ name, total, goal, isMe }) {
  const hasData = total !== null && total !== undefined
  const pct = hasData ? Math.min(total / goal, 1) : 0
  const color = !hasData ? 'var(--muted)'
    : total === 0 ? 'var(--success)'
    : pct <= 0.8 ? 'var(--success)'
    : pct <= 1.0 ? '#fbbf24'
    : 'var(--danger)'

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '.8rem', color: 'var(--muted)', marginBottom: '.35rem', fontWeight: 600 }}>
        {name}
      </div>
      <div style={{ fontSize: '2rem', fontWeight: 900, color, lineHeight: 1 }}>
        {hasData ? total.toFixed(1) : '—'}
      </div>
      <div style={{ fontSize: '.72rem', color: 'var(--muted)', marginTop: '.2rem' }}>
        grams
      </div>
      {hasData && (
        <div style={{ marginTop: '.5rem', height: 4, borderRadius: 99, background: 'var(--border)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct * 100}%`, background: color, borderRadius: 99, transition: 'width .5s ease' }} />
        </div>
      )}
    </div>
  )
}
