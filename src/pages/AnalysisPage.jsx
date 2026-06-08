import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getTagStats, getDailyTotals } from '../lib/queries'
import TrendChart from '../components/TrendChart'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
} from 'recharts'

const COLORS = ['#6366f1', '#a78bfa', '#818cf8', '#c4b5fd', '#7c3aed']

export default function AnalysisPage() {
  const { session, profile } = useAuth()
  const [tagStats, setTagStats] = useState([])
  const [totals, setTotals] = useState([])
  const [days, setDays] = useState(30)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session?.user?.id) return
    setLoading(true)
    Promise.all([
      getTagStats(session.user.id),
      getDailyTotals(session.user.id, days),
    ]).then(([tags, tots]) => {
      setTagStats(tags)
      setTotals(tots)
    }).finally(() => setLoading(false))
  }, [session?.user?.id, days])

  const avg = totals.length
    ? (totals.reduce((s, t) => s + +t.total_mg, 0) / totals.length).toFixed(1)
    : 0

  const max = totals.length
    ? Math.max(...totals.map(t => +t.total_mg)).toFixed(1)
    : 0

  return (
    <div className="page">
      <h1 style={{ marginBottom: '1.25rem' }}>Analysis</h1>

      {/* Period toggle */}
      <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1.25rem' }}>
        {[7, 30, 90].map(d => (
          <button
            key={d}
            className={`chip${days === d ? ' active' : ''}`}
            onClick={() => setDays(d)}
          >
            {d}d
          </button>
        ))}
      </div>

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem', marginBottom: '1.25rem' }}>
        {[
          { label: 'Daily avg', value: `${avg} mg` },
          { label: 'Peak day', value: `${max} mg` },
          { label: 'Days tracked', value: totals.length },
          { label: 'Days under goal', value: totals.filter(t => +t.total_mg <= (profile?.daily_goal_mg ?? 2000)).length },
        ].map(({ label, value }) => (
          <div key={label} className="card">
            <div style={{ color: 'var(--muted)', fontSize: '.75rem' }}>{label}</div>
            <div style={{ fontWeight: 700, fontSize: '1.15rem', marginTop: '.2rem' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Trend */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ marginBottom: '.75rem' }}>{days}-Day Trend</h2>
        {loading ? <p style={{ color: 'var(--muted)' }}>Loading…</p> : (
          <TrendChart totals={totals} goal={profile?.daily_goal_mg} days={days} />
        )}
      </div>

      {/* Tag analysis */}
      <div className="card">
        <h2 style={{ marginBottom: '.2rem' }}>Tag Analysis</h2>
        <p style={{ color: 'var(--muted)', fontSize: '.8rem', marginBottom: '.9rem' }}>
          Avg mg per entry by tag (90-day window)
        </p>
        {tagStats.length === 0 && !loading && (
          <p style={{ color: 'var(--muted)', fontSize: '.9rem' }}>No tagged entries yet.</p>
        )}
        {tagStats.length > 0 && (
          <ResponsiveContainer width="100%" height={tagStats.length * 44 + 20}>
            <BarChart data={tagStats} layout="vertical" margin={{ left: 8, right: 20, top: 4, bottom: 4 }}>
              <XAxis type="number" tick={{ fill: 'var(--muted)', fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis dataKey="tag" type="category" tick={{ fill: 'var(--text)', fontSize: 12 }} tickLine={false} axisLine={false} width={72} />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,.04)' }}
                formatter={v => [`${v} mg avg`, '']}
                contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '.8rem' }}
              />
              <Bar dataKey="avg" radius={[0, 6, 6, 0]}>
                {tagStats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
