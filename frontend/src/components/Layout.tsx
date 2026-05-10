import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, List, PlusCircle, Brain, BarChart2, Settings, ClipboardList, BookOpen, LogOut } from 'lucide-react'

const navItems = [
  { to: '/',          icon: LayoutDashboard, end: true },
  { to: '/trades',    icon: List,            end: false },
  { to: '/add',       icon: PlusCircle,      end: false },
  { to: '/checklist', icon: ClipboardList,   end: false },
  { to: '/journal',   icon: BookOpen,        end: false },
]

export default function Layout() {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen" style={{ background: '#f1f5f9', color: '#0f172a' }}>
      <nav
        className="fixed left-0 top-0 bottom-0 flex flex-col items-center py-5 gap-1 z-10"
        style={{ width: 62, background: '#ffffff', borderRight: '1px solid rgba(0,0,0,0.08)' }}
      >
        <div className="mb-5" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="30" height="30">
            <rect width="32" height="32" rx="8" fill="#4f46e5"/>
            <rect x="5" y="18" width="5" height="9" rx="1.5" fill="rgba(255,255,255,0.5)"/>
            <rect x="13.5" y="12" width="5" height="15" rx="1.5" fill="rgba(255,255,255,0.75)"/>
            <rect x="22" y="6" width="5" height="21" rx="1.5" fill="#ffffff"/>
            <polyline points="7.5,20 16,13.5 24.5,8" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {navItems.map(({ to, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end}
            style={({ isActive }) => ({
              width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 11, transition: 'all 0.15s', cursor: 'pointer',
              color: isActive ? '#6366f1' : '#64748b',
              background: isActive ? 'rgba(99,102,241,0.1)' : 'transparent',
            })}
          >
            {({ isActive }) => <Icon size={22} color={isActive ? '#6366f1' : '#64748b'} />}
          </NavLink>
        ))}

        <div className="mt-auto flex flex-col gap-1">
          <NavLink to="/news" end={false}
            style={({ isActive }) => ({
              width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 11, transition: 'all 0.15s', cursor: 'pointer',
              color: isActive ? '#6366f1' : '#64748b',
              background: isActive ? 'rgba(99,102,241,0.1)' : 'transparent',
            })}
          >
            {({ isActive }) => <Brain size={22} color={isActive ? '#6366f1' : '#64748b'} />}
          </NavLink>
          
          <div style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 11, cursor: 'pointer', color: '#64748b', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#475569' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b' }}
          >
            <BarChart2 size={22} />
          </div>

          <div style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 11, cursor: 'pointer', color: '#64748b', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#475569' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b' }}
          >
            <Settings size={22} />
          </div>

          <div onClick={handleLogout} style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 11, cursor: 'pointer', color: '#64748b', transition: 'all 0.15s', marginTop: 10 }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(249,115,22,0.1)'; e.currentTarget.style.color = '#f97316' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b' }}
            title="Logout"
          >
            <LogOut size={22} />
          </div>
        </div>
      </nav>

      <main className="flex-1 overflow-auto" style={{ marginLeft: 62, padding: '26px 28px' }}>
        <Outlet />
      </main>
    </div>
  )
}
