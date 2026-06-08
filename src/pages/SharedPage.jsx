import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getDailyTotals, getProfile } from '../lib/queries'
import TrendChart from '../components/TrendChart'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend,
} from 'recharts'
import { format, parseISO, eachDayOfInterval, subDays } from 'date-fns'

export default function SharedPage() {
  const { session, profile } = useAuth()
  const [myTotals, setMyTotals] = useState([])
  const [partnerTotals, setPartnerTotals] = useState([])
  const [partnerProfile, setPartnerProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const partnerId = profile?.partner_id

  useEffect(() => {
    if (!session?.user?.id) return
    const fetches = [getDailyTotals(session.user.id, 30)]
    if (partnerId) {
      fetches.push(getDailyTotals(partnerId, 30))
      fetches.push(getProfile(partnerId))
    }
    Promise.all(fetches).then(([mine, theirs, pProfile]) => {
      setMyTotals(mine)
      if (theirs) setPartnerTotals(theirs)
      if (pProfile) setPartnerProfile(pProfile)
    }).finally(() => setLoading(false))
  }, [session?.user?.id, partnerId])

  const chartData = buildCombinedData(myTotals, partnerTotals)

  return (
    <div className="page">
      <h1 style={{ marginBottom: '.4rem' }}>Together</h1>
      <p style={{ color: 'var(--muted)', fontSize: '.85rem', marginBottom: '1.25rem' }}>
        Combined 30-day view
      </p>

      {!partnerId && (
        <div className="card" style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '.75rem' }}>🔗</div>
          <h2 style={{ marginBottom: '.5rem' }}>Link your partner</h2>
          <p style={{ color: 'var(--muted)', fontSize: '.88rem' }}>
            Go to Settings and enter your partner's user ID to see the shared view.
          </p>
        </div>
      )}

      {partnerId && (
        <>
          {/* Combined trend */}
          <div className="card" style={{ marginBottom: '1rem' }}>
            <h2 style={{ marginBottom: '.75rem' }}>30-Day Combined</h2>
            {loading ? <p style={{ color: 'var(--muted)' }}>Loading…</p> : (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={chartData} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
                  <XAxis dataKey="label" tick={{ fill: 'var(--muted)', fontSize: 10 }} tickLine={false} axisLine={false} interval={4} />
                  <YAxis tick={{ fill: 'var(--muted)', fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '.8rem' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '.8rem' }} />
                  <Line type="monotone" dataKey="me" name={profile?.display_name ?? 'You'} stroke="#6366f1" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="partner" name={partnerProfile?.display_name ?? 'Partner'} stroke="#34d399" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Side-by-side stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
            <StatCard
              label={profile?.display_name ?? 'You'}
              totals={myTotals}
              goal={profile?.daily_goal_mg ?? 2000}
              color="#6366f1"
            />
            <StatCard
              label={partnerProfile?.display_name ?? 'Partner'}
              totals={partnerTotals}
              goal={partnerProfile?.daily_goal_mg ?? 2000}
              color="#34d399"
            />
          </div>
        </>
      )}
    </div>
  )
}

function StatCard({ label, totals, goal, color }) {
  const avg = totals.length
    ? (totals.reduce((s, t) => s + +t.total_mg, 0) / totals.length).toFixed(0)
    : 0
  const underGoal = totals.filter(t => +t.total_mg <= goal).length

  return (
    <div className="card">
      <div style={{ fontSize: '.75rem', color: 'var(--muted)', marginBottom: '.3rem' }}>{label}</div>
      <div style={{ fontSize: '1.3rem', fontWeight: 800, color }}>{avg} mg</div>
      <div style={{ fontSize: '.7rem', color: 'var(--muted)', marginTop: '.15rem' }}>daily avg</div>
      <div style={{ fontSize: '.8rem', marginTop: '.5rem' }}>
        <span style={{ color }}>{underGoal}</span>
        <span style={{ color: 'var(--muted)' }}>/{totals.length} days under goal</span>
      </div>
    </div>
  )
}

function buildCombinedData(mine, theirs) {
  const end = new Date()
  const start = subDays(end, 29)
  const myMap = {}, theirMap = {}
  mine.forEach(({ day, total_mg }) => { myMap[day] = +total_mg })
  theirs.forEach(({ day, total_mg }) => { theirMap[day] = +total_mg })

  return eachDayOfInterval({ start, end }).map(d => {
    const key = format(d, 'yyyy-MM-dd')
    return { date: key, label: format(d, 'MMM d'), me: myMap[key] ?? 0, partner: theirMap[key] ?? 0 }
  })
}
