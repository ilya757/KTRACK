import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function AuthPage() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        await signIn(email, password)
      } else {
        if (!name.trim()) throw new Error('Display name is required')
        await signUp(email, password, name.trim())
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '1.5rem',
    }}>
      <div style={{ width: '100%', maxWidth: 360 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '.5rem' }}>🌿</div>
          <h1 style={{ fontSize: '1.6rem' }}>Sobriety Tracker</h1>
          <p style={{ color: 'var(--muted)', marginTop: '.4rem', fontSize: '.9rem' }}>
            Private tracking for two
          </p>
        </div>

        <div className="card">
          <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1.5rem' }}>
            {['login', 'signup'].map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError('') }}
                style={{
                  flex: 1, padding: '.55rem',
                  background: mode === m ? 'var(--primary)' : 'transparent',
                  color: mode === m ? '#fff' : 'var(--muted)',
                  borderRadius: 10, fontWeight: 600,
                  border: mode === m ? 'none' : '1.5px solid var(--border)',
                }}
              >
                {m === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
            {mode === 'signup' && (
              <input
                placeholder="Your name (e.g. Alex)"
                value={name}
                onChange={e => setName(e.target.value)}
                autoComplete="name"
              />
            )}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              minLength={8}
              required
            />
            {error && <p className="error-msg">{error}</p>}
            <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '.25rem' }}>
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>

        {mode === 'signup' && (
          <p style={{ color: 'var(--muted)', fontSize: '.8rem', textAlign: 'center', marginTop: '1rem' }}>
            Both you and your partner each create an account, then link them in Settings.
          </p>
        )}
      </div>
    </div>
  )
}
