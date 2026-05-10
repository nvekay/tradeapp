import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { login, register, googleLogin } from '../api/auth'

const C = {
  card: '#ffffff', item: '#f8fafc', border: 'rgba(0,0,0,0.08)',
  text: '#0f172a', muted: '#64748b', dim: '#94a3b8',
  purpleBtn: '#4f46e5', red: '#f97316'
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
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      setLoading(true)
      const data = await googleLogin({ credential: credentialResponse.credential })
      localStorage.setItem('token', data.access_token)
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Google Login failed')
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    background: C.item, border: `1px solid ${C.border}`, borderRadius: 8,
    padding: '10px 14px', fontSize: 14, color: C.text, outline: 'none',
    width: '100%', fontFamily: 'inherit', transition: 'border-color 0.15s',
    marginBottom: 12
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f1f5f9' }}>
      <div style={{ background: C.card, padding: 32, borderRadius: 16, width: '100%', maxWidth: 400, border: `1px solid ${C.border}` }}>
        <div style={{ marginBottom: 28, textAlign: 'center' }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="44" height="44" style={{ margin: '0 auto 12px', display: 'block' }}>
            <rect width="32" height="32" rx="8" fill="#4f46e5"/>
            <rect x="5" y="18" width="5" height="9" rx="1.5" fill="rgba(255,255,255,0.5)"/>
            <rect x="13.5" y="12" width="5" height="15" rx="1.5" fill="rgba(255,255,255,0.75)"/>
            <rect x="22" y="6" width="5" height="21" rx="1.5" fill="#ffffff"/>
            <polyline points="7.5,20 16,13.5 24.5,8" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 22, fontWeight: 700, color: C.text, letterSpacing: '-0.5px' }}>tradestat</div>
          <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>personal trading journal</div>
        </div>
        
        {error && <div style={{ color: C.red, fontSize: 14, marginBottom: 16, textAlign: 'center' }}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <input 
            type="email" 
            placeholder="Email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            style={inputStyle} 
            required 
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            style={inputStyle} 
            required 
          />
          
          <button 
            type="submit" 
            disabled={loading}
            style={{
              background: C.purpleBtn, color: '#ffffff', border: 'none', borderRadius: 8,
              padding: '12px', fontSize: 15, cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit',
              width: '100%', opacity: loading ? 0.7 : 1, marginBottom: 16
            }}
          >
            {loading ? 'Wait...' : (isLogin ? 'Login' : 'Register')}
          </button>
        </form>
        
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: 14, color: C.muted, cursor: 'pointer' }} onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
          </span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', margin: '16px 0' }}>
          <div style={{ flex: 1, height: 1, background: C.border }} />
          <div style={{ padding: '0 10px', fontSize: 12, color: C.muted, textTransform: 'uppercase' }}>or</div>
          <div style={{ flex: 1, height: 1, background: C.border }} />
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError('Google Login Failed')}
            theme="outline"
            size="large"
          />
        </div>
      </div>
    </div>
  )
}
