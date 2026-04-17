import React, { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    if (!email || !password) return
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 44, height: 44, background: '#c8ff3e', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>⚡</div>
            <span style={{ fontSize: 30, fontWeight: 800, color: '#c8ff3e', fontStyle: 'italic', letterSpacing: -1 }}>SplitLog</span>
          </div>
          <p style={{ color: '#4b5563', fontSize: 14 }}>Track & Field Coaching Platform</p>
        </div>

        <div className="card" style={{ padding: 24 }}>
          <div style={{ marginBottom: 14 }}>
            <label className="lbl">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" onKeyDown={e => e.key === 'Enter' && handleLogin()} autoFocus />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label className="lbl">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" onKeyDown={e => e.key === 'Enter' && handleLogin()} />
          </div>
          {error && <div style={{ color: '#ff6b6b', fontSize: 13, background: '#2b0d0d', padding: '8px 12px', borderRadius: 6, marginBottom: 12 }}>{error}</div>}
          <button className="btn" style={{ width: '100%', padding: 11 }} onClick={handleLogin} disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In →'}
          </button>
          <p style={{ color: '#4b5563', fontSize: 12, textAlign: 'center', marginTop: 16, lineHeight: 1.5 }}>
            Don't have an account? Ask your coach to set one up for you.
          </p>
        </div>
      </div>
    </div>
  )
}
