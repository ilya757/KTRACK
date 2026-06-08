import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getTodayEntries, getDailyTotals } from '../lib/queries'
import GoalRing from '../components/GoalRing'
import TrendChart from '../components/TrendChart'
import EntryCard from '../components/EntryCard'
import QuickAddModal from '../components/QuickAddModal'
import { format } from 'date-fns'
import { Plus } from 'lucide-react'

export default function DashboardPage() {
  const { session, profile } = useAuth()
  const [todayEntries, setTodayEntries] = useState([])
  const [totals, setTotals] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)

  const userId = session?.user?.id
  const goal = profile?.daily_goal_mg ?? 2000
  const todayTotal = todayEntries.reduce((s, e) => s + e.amount_mg, 0)

  useEffect(() => {
    if (!userId) return
    Promise.all([
      getTodayEntries(userId),
      getDailyTotals(userId, 30),
    ]).then(([entries, tots]) => {
      setTodayEntries(entries)
      setTotals(tots)
    }).finally(() => setLoading(false))
  }, [userId])

  function handleAdded(entry) {
    setTodayEntries(prev => [entry, ...prev])
  }

  function removeEntry(id) {
    setTodayEntries(prev => prev.filter(e => e.id !== id))
  }

  const streak = computeStreak(totals, goal)

  return (
    <>
      <div className="page">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h1>Hi, {profile?.display_name ?? 'there'} 👋</h1>
            <p style={{ color: 'var(--muted)', fontSize: '.85rem' }}>{format(new Date(), 'EEEE, MMMM d')}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent)' }}>{streak}</div>
            <div style={{ fontSize: '.7rem', color: 'var(--muted)' }}>day streak</div>
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
            marginBottom: '1.25rem',
            boxShadow: '0 4px 24px rgba(99,102,241,.4)',
          }}
        >
          <Plus size={26} strokeWidth={2.5} />
          Add Entry
        </button>

        {/* Today summary */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1rem' }}>
          <GoalRing value={todayTotal} goal={goal} />
          <div>
            <div style={{ fontSize: '.8rem', color: 'var(--muted)' }}>Today's total</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{todayTotal.toFixed(1)}</div>
            <div style={{ fontSize: '.8rem', color: 'var(--muted)' }}>g of {goal} g goal</div>
            <div style={{ marginTop: '.5rem', fontSize: '.82rem', color: todayTotal < goal ? 'var(--success)' : 'var(--danger)' }}>
              {todayTotal < goal
                ? `${(goal - todayTotal).toFixed(1)} g remaining`
                : `${(todayTotal - goal).toFixed(1)} g over goal`}
            </div>
          </div>
        </div>

        {/* 30-day trend */}
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h2 style={{ marginBottom: '.75rem' }}>30-Day Trend</h2>
          <TrendChart totals={totals} goal={goal} days={30} />
        </div>

        {/* Today's entries */}
        <div style={{ marginBottom: '.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Today</h2>
          <span style={{ color: 'var(--muted)', fontSize: '.82rem' }}>{todayEntries.length} entries</span>
        </div>
        {loading && <p style={{ color: 'var(--muted)' }}>Loading…</p>}
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
    </>
  )
}

function computeStreak(totals, goal) {
  if (!totals.length) return 0
  const byDay = {}
  totals.forEach(({ day, total_mg }) => { byDay[day] = total_mg })
  let streak = 0
  const today = new Date()
  for (let i = 0; i < 30; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = format(d, 'yyyy-MM-dd')
    if (byDay[key] !== undefined && byDay[key] <= goal) streak++
    else if (i > 0) break
  }
  return streak
}
