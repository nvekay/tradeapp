import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token && location.pathname !== '/login') {
      navigate('/login')
    }
  }, [navigate, location])

  return <>{children}</>
}
