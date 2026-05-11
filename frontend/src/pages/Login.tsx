import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { login, register, googleLogin } from '../api/auth'
import type { CredentialResponse } from '@react-oauth/google'

const C = {
  card: '#ffffff', item: '#F8FAFC', border: '#E2E8F0',
  text: '#0F172A', muted: '#64748B',
  primaryBtn: '#2563EB', red: '#DC2626'
}

export default function Login() {
  const navigate = useNavigate()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = isLogin
        ? await login({ email, password })
        : await register({ email, password })
      localStorage.setItem('token', data.access_token)
      navigate('/app')
    } catch (err: unknown) {
      setError((err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      setLoading(true)
      const data = await googleLogin({ credential: credentialResponse.credential })
      localStorage.setItem('token', data.access_token)
      navigate('/app')
    } catch (err: unknown) {
      setError((err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Google Login failed')
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    background: C.item, border: `1px solid ${C.border}`, borderRadius: 8,
    padding: '10px 14px', fontSize: 14, color: C.text, outline: 'none',
    width: '100%', fontFamily: 'inherit', transition: 'border-color 0.15s',
    marginBottom: 12,
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#F3F4F6' }}>
      <div style={{
        background: C.card, padding: 32, borderRadius: 20, width: '100%', maxWidth: 400,
        border: `1px solid ${C.border}`,
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03), 0 2px 4px -1px rgba(0,0,0,0.02)',
      }}>
        <div style={{ marginBottom: 28, textAlign: 'center' }}>
          {/* Bar chart logo */}
          <div style={{
            width: 44, height: 44, background: '#2563EB', borderRadius: 12,
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            paddingBottom: 10, gap: 3, margin: '0 auto 14px',
            boxShadow: '0 4px 12px rgba(37,99,235,0.25)',
          }}>
            <div style={{ width: 5, height: 14, background: 'rgba(255,255,255,0.7)', borderRadius: '2px 2px 0 0' }} />
            <div style={{ width: 5, height: 18, background: '#ffffff', borderRadius: '2px 2px 0 0' }} />
            <div style={{ width: 5, height: 11, background: 'rgba(255,255,255,0.85)', borderRadius: '2px 2px 0 0' }} />
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 700, color: C.text, letterSpacing: '-0.5px' }}>tradestat</div>
          <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>personal trading journal</div>
        </div>

        {error && <div style={{ color: C.red, fontSize: 14, marginBottom: 16, textAlign: 'center' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} required />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} required />
          <button type="submit" disabled={loading} style={{
            background: C.primaryBtn, color: '#ffffff', border: 'none', borderRadius: 8,
            padding: '12px', fontSize: 15, cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit',
            width: '100%', opacity: loading ? 0.7 : 1, marginBottom: 16,
            transition: 'opacity 0.15s',
          }}>
            {loading ? 'Wait...' : (isLogin ? 'Login' : 'Register')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: 14, color: C.muted, cursor: 'pointer' }} onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? "Don't have an account? Register" : 'Already have an account? Login'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', margin: '16px 0' }}>
          <div style={{ flex: 1, height: 1, background: C.border }} />
          <div style={{ padding: '0 10px', fontSize: 12, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>or</div>
          <div style={{ flex: 1, height: 1, background: C.border }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setError('Google Login Failed')} theme="outline" size="large" />
        </div>
      </div>
    </div>
  )
}
