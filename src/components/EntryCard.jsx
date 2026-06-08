import { Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { deleteEntry } from '../lib/queries'

export default function EntryCard({ entry, onDelete }) {
  async function handleDelete() {
    if (!confirm('Delete this entry?')) return
    await deleteEntry(entry.id)
    onDelete(entry.id)
  }

  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>{entry.amount_mg} mg</span>
          {entry.tag && <span className="tag">{entry.tag}</span>}
        </div>
        {entry.note && (
          <p style={{ color: 'var(--muted)', fontSize: '.82rem', marginTop: '.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {entry.note}
          </p>
        )}
        <p style={{ color: 'var(--muted)', fontSize: '.75rem', marginTop: '.25rem' }}>
          {format(new Date(entry.logged_at), 'h:mm a')}
        </p>
      </div>
      <button className="btn-ghost" onClick={handleDelete} style={{ color: 'var(--danger)', padding: '.4rem' }}>
        <Trash2 size={17} />
      </button>
    </div>
  )
}
