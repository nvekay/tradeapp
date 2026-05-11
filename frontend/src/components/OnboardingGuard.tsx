import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useSettings } from '../contexts/SettingsContext'

export default function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { settings, loading } = useSettings()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (loading || !settings) return
    if (!settings.onboarding_completed && location.pathname !== '/onboarding') {
      navigate('/onboarding', { replace: true })
    }
  }, [settings, loading, location.pathname, navigate])

  if (loading) return <div className="min-h-screen bg-[#F3F4F6] p-6 text-[#64748B]">Loading...</div>
  return <>{children}</>
}
