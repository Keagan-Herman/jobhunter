'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const supabase = createClient()

  const handleAuth = async () => {
    setLoading(true)
    setError('')
    setMessage('')

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
      })
      if (error) setError(error.message)
      else setMessage('Check your email for a confirmation link!')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else window.location.href = '/dashboard'
    }

    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#080812',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'DM Sans', sans-serif", padding: '24px'
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&family=DM+Mono:wght@400;700&family=Syne:wght@800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input { outline: none; }
        input:focus { border-color: #00ff87 !important; }
        .btn:hover { transform: translateY(-1px); box-shadow: 0 6px 20px #00ff8740 !important; }
      `}</style>

      <div style={{
        width: '100%', maxWidth: '400px',
        background: '#0d0d20', border: '1px solid #1e1e38',
        borderRadius: '16px', padding: '40px 32px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{
            fontFamily: "'Syne', sans-serif", fontSize: '32px',
            fontWeight: '800', color: '#fff'
          }}>
            Job<span style={{ color: '#00ff87' }}>Hunter</span>
          </h1>
          <p style={{ color: '#444', fontSize: '13px', fontFamily: "'DM Mono', monospace", marginTop: '6px' }}>
            {isSignUp ? 'create your account' : 'welcome back'}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          <input
            type="email"
            placeholder="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{
              background: '#0a0a1a', border: '1px solid #1e1e38',
              borderRadius: '8px', padding: '12px 16px',
              color: '#e0e0f0', fontSize: '14px',
              fontFamily: "'DM Mono', monospace",
              transition: 'border-color 0.2s', width: '100%'
            }}
          />
          <input
            type="password"
            placeholder="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAuth()}
            style={{
              background: '#0a0a1a', border: '1px solid #1e1e38',
              borderRadius: '8px', padding: '12px 16px',
              color: '#e0e0f0', fontSize: '14px',
              fontFamily: "'DM Mono', monospace",
              transition: 'border-color 0.2s', width: '100%'
            }}
          />
        </div>

        {error && (
          <div style={{
            background: '#ff6b6b18', border: '1px solid #ff6b6b40',
            borderRadius: '8px', padding: '10px 14px',
            color: '#ff6b6b', fontSize: '13px', marginBottom: '16px',
            fontFamily: "'DM Mono', monospace"
          }}>{error}</div>
        )}
        {message && (
          <div style={{
            background: '#00ff8718', border: '1px solid #00ff8740',
            borderRadius: '8px', padding: '10px 14px',
            color: '#00ff87', fontSize: '13px', marginBottom: '16px',
            fontFamily: "'DM Mono', monospace"
          }}>{message}</div>
        )}

        <button
          onClick={handleAuth}
          disabled={loading}
          className="btn"
          style={{
            width: '100%', background: '#00ff87', border: 'none',
            borderRadius: '8px', padding: '13px',
            color: '#0a0a1a', fontWeight: '700', fontSize: '13px',
            fontFamily: "'DM Mono', monospace", letterSpacing: '1px',
            textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1, transition: 'all 0.2s ease'
          }}
        >
          {loading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}
        </button>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#444' }}>
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}
          {' '}
          <span
            onClick={() => { setIsSignUp(!isSignUp); setError(''); setMessage('') }}
            style={{ color: '#00ff87', cursor: 'pointer', fontWeight: '600' }}
          >
            {isSignUp ? 'Sign in' : 'Sign up'}
          </span>
        </p>
      </div>
    </div>
  )
}
