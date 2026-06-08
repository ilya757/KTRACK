import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { upsertProfile } from '../lib/queries'
import { supabase } from '../lib/supabase'
import { LogOut, Copy, Check } from 'lucide-react'

export default function SettingsPage() {
  const { session, profile, signOut, refreshProfile } = useAuth()
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '')
  const [goal, setGoal] = useState(profile?.daily_goal_mg ?? 2000)
  const [partnerId, setPartnerId] = useState(profile?.partner_id ?? '')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [copied, setCopied] = useState(false)

  const userId = session?.user?.id

  async function handleSave(e) {
    e.preventDefault()
    setMsg('')
    setSaving(true)
    try {
      await upsertProfile({
        id: userId,
        display_name: displayName,
        daily_goal_mg: parseFloat(goal),
        partner_id: partnerId || null,
      })
      await refreshProfile()
      setMsg('Saved!')
      setTimeout(() => setMsg(''), 2500)
    } catch (err) {
      setMsg('Error: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  function copyId() {
    navigator.clipboard.writeText(userId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="page">
      <h1 style={{ marginBottom: '1.25rem' }}>Settings</h1>

      {/* User ID card */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <h2 style={{ marginBottom: '.4rem', fontSize: '.85rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
          Your User ID
        </h2>
        <p style={{ fontSize: '.75rem', color: 'var(--muted)', marginBottom: '.6rem' }}>
          Share this with your partner so they can link to you.
        </p>
        <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
          <code style={{
            flex: 1, fontSize: '.7rem', background: 'var(--bg)', padding: '.5rem .75rem',
            borderRadius: 8, border: '1px solid var(--border)', overflowX: 'auto',
            whiteSpace: 'nowrap',
          }}>
            {userId}
          </code>
          <button className="btn-ghost" onClick={copyId} style={{ padding: '.4rem', color: 'var(--muted)', flexShrink: 0 }}>
            {copied ? <Check size={16} color="var(--success)" /> : <Copy size={16} />}
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
        <h2>Profile</h2>

        <div>
          <label style={{ fontSize: '.8rem', color: 'var(--muted)', display: 'block', marginBottom: '.3rem' }}>
            Display Name
          </label>
          <input
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder="Your name"
            required
          />
        </div>

        <div>
          <label style={{ fontSize: '.8rem', color: 'var(--muted)', display: 'block', marginBottom: '.3rem' }}>
            Daily Goal (mg)
          </label>
          <input
            type="number" inputMode="decimal" step="any" min="1"
            value={goal}
            onChange={e => setGoal(e.target.value)}
          />
          <p style={{ color: 'var(--muted)', fontSize: '.75rem', marginTop: '.3rem' }}>
            The red line on your chart. Common ranges: 0 mg (none), 500–2000 mg moderate.
          </p>
        </div>

        <div>
          <label style={{ fontSize: '.8rem', color: 'var(--muted)', display: 'block', marginBottom: '.3rem' }}>
            Partner User ID
          </label>
          <input
            value={partnerId}
            onChange={e => setPartnerId(e.target.value.trim())}
            placeholder="Paste your partner's ID here"
          />
          <p style={{ color: 'var(--muted)', fontSize: '.75rem', marginTop: '.3rem' }}>
            Enables the Together view. Both partners need to set each other's ID.
          </p>
        </div>

        {msg && (
          <p style={{ color: msg.startsWith('Error') ? 'var(--danger)' : 'var(--success)', fontSize: '.88rem' }}>
            {msg}
          </p>
        )}

        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </form>

      <button
        className="card"
        onClick={signOut}
        style={{
          marginTop: '1rem', width: '100%', display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: '.6rem', color: 'var(--danger)',
          background: 'var(--surface)', border: '1px solid var(--border)',
          padding: '1rem',
        }}
      >
        <LogOut size={17} />
        Sign Out
      </button>
    </div>
  )
}
