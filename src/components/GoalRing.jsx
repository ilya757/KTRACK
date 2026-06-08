export default function GoalRing({ value, goal, size = 140 }) {
  const pct = Math.min(value / goal, 1)
  const r = (size - 16) / 2
  const circ = 2 * Math.PI * r
  const dash = circ * (1 - pct)
  const color = pct < 0.7 ? 'var(--success)' : pct < 1 ? '#fbbf24' : 'var(--danger)'

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth={10} />
      <circle
        cx={size/2} cy={size/2} r={r}
        fill="none" stroke={color} strokeWidth={10}
        strokeDasharray={circ} strokeDashoffset={dash}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset .6s ease, stroke .3s' }}
      />
      <text
        x={size/2} y={size/2}
        textAnchor="middle" dominantBaseline="central"
        style={{ fill: 'var(--text)', fontSize: '1.05rem', fontWeight: 700, transform: 'rotate(90deg)', transformOrigin: `${size/2}px ${size/2}px` }}
      >
        {Math.round(pct * 100)}%
      </text>
    </svg>
  )
}
