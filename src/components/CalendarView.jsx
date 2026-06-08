import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isToday } from 'date-fns'

// Color based on % of goal
function getDayColor(total, goal) {
  if (total === undefined || total === null) return { bg: 'transparent', text: 'var(--muted)' }
  if (total === 0) return { bg: 'rgba(52,211,153,.12)', text: 'var(--success)' }
  const pct = total / goal
  if (pct <= 0.5)  return { bg: 'rgba(52,211,153,.25)', text: '#34d399' }
  if (pct <= 0.8)  return { bg: 'rgba(52,211,153,.12)', text: '#34d399' }
  if (pct <= 1.0)  return { bg: 'rgba(251,191,36,.18)', text: '#fbbf24' }
  if (pct <= 1.3)  return { bg: 'rgba(248,113,113,.2)', text: '#f87171' }
  return             { bg: 'rgba(248,113,113,.38)', text: '#ef4444' }
}

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export default function CalendarView({ totals = [], goal = 2, onDayClick }) {
  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Build lookup: 'yyyy-MM-dd' -> total
  const byDay = {}
  totals.forEach(({ day, total_mg }) => { byDay[day] = +total_mg })

  // Leading empty cells
  const startDow = getDay(monthStart) // 0=Sun
  const blanks = Array(startDow).fill(null)

  return (
    <div>
      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, marginBottom: 4 }}>
        {DAYS.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: '.65rem', color: 'var(--muted)', fontWeight: 600, paddingBottom: 2 }}>
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
        {blanks.map((_, i) => <div key={`b${i}`} />)}
        {days.map(d => {
          const key = format(d, 'yyyy-MM-dd')
          const total = byDay[key]
          const { bg, text } = getDayColor(total, goal)
          const future = d > now
          const todayStyle = isToday(d) ? { outline: '2px solid var(--primary)', outlineOffset: -1 } : {}

          return (
            <div
              key={key}
              onClick={() => !future && onDayClick && onDayClick(key)}
              style={{
                background: future ? 'transparent' : bg,
                borderRadius: 8,
                padding: '5px 2px',
                textAlign: 'center',
                minHeight: 48,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                opacity: future ? 0.3 : 1,
                cursor: future ? 'default' : 'pointer',
                ...todayStyle,
              }}
            >
              <span style={{ fontSize: '.65rem', color: 'var(--muted)', fontWeight: 500 }}>
                {format(d, 'd')}
              </span>
              {!future && total !== undefined && (
                <span style={{ fontSize: '.7rem', fontWeight: 700, color: text, lineHeight: 1 }}>
                  {total === 0 ? '✓' : `${total.toFixed(1)}`}
                </span>
              )}
              {!future && total === undefined && (
                <span style={{ fontSize: '.6rem', color: 'var(--border)' }}>—</span>
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
        {[
          { color: '#34d399', label: 'Under goal' },
          { color: '#fbbf24', label: 'Near goal' },
          { color: '#f87171', label: 'Over goal' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '.35rem', fontSize: '.72rem', color: 'var(--muted)' }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: color, opacity: .7 }} />
            {label}
          </div>
        ))}
      </div>
    </div>
  )
}
