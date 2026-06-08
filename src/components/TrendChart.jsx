import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, Tooltip, ReferenceLine,
} from 'recharts'
import { format, parseISO, eachDayOfInterval, subDays } from 'date-fns'

function buildChartData(totals, days = 30) {
  const end = new Date()
  const start = subDays(end, days - 1)
  const byDay = {}
  totals.forEach(({ day, total_mg }) => { byDay[day] = total_mg })

  return eachDayOfInterval({ start, end }).map(d => {
    const key = format(d, 'yyyy-MM-dd')
    return { date: key, label: format(d, 'MMM d'), total: byDay[key] ?? 0 }
  })
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 8, padding: '.5rem .75rem', fontSize: '.8rem',
    }}>
      <p style={{ color: 'var(--muted)', marginBottom: '.2rem' }}>{label}</p>
      <p style={{ color: 'var(--primary)', fontWeight: 700 }}>{payload[0].value} mg</p>
    </div>
  )
}

export default function TrendChart({ totals = [], goal, days = 30 }) {
  const data = buildChartData(totals, days)

  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="label"
          tick={{ fill: 'var(--muted)', fontSize: 10 }}
          tickLine={false} axisLine={false}
          interval={Math.floor(days / 6)}
        />
        <YAxis tick={{ fill: 'var(--muted)', fontSize: 10 }} tickLine={false} axisLine={false} />
        <Tooltip content={<CustomTooltip />} />
        {goal && (
          <ReferenceLine y={goal} stroke="var(--danger)" strokeDasharray="4 3" strokeWidth={1.5} />
        )}
        <Area
          type="monotone" dataKey="total"
          stroke="var(--primary)" strokeWidth={2}
          fill="url(#grad)" dot={false} activeDot={{ r: 4 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
