import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, List, PlusCircle, Brain, Settings, ClipboardList, BookOpen, LogOut } from 'lucide-react'

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
    <div className="flex min-h-screen" style={{ background: '#F3F4F6', color: '#0F172A' }}>
      <nav
        className="fixed left-0 top-0 bottom-0 flex flex-col items-center py-4 z-10"
        style={{ width: 72, background: '#ffffff', borderRight: '1px solid #E2E8F0', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.03)' }}
      >
        {/* Logo — bar chart icon */}
        <div style={{
          width: 40, height: 40, background: '#2563EB', borderRadius: 12,
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          paddingBottom: 8, gap: 3, marginBottom: 20, cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(37,99,235,0.25)',
        }}>
          <div style={{ width: 4, height: 12, background: 'rgba(255,255,255,0.7)', borderRadius: '2px 2px 0 0' }} />
          <div style={{ width: 4, height: 17, background: '#ffffff', borderRadius: '2px 2px 0 0' }} />
          <div style={{ width: 4, height: 10, background: 'rgba(255,255,255,0.85)', borderRadius: '2px 2px 0 0' }} />
        </div>

        <span style={{ display: 'block', textAlign: 'center', fontSize: 9, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>App</span>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%', padding: '0 8px' }}>
          {navItems.map(({ to, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end}
              style={({ isActive }) => ({
                width: '100%', height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 12, transition: 'all 0.15s', cursor: 'pointer',
                color: isActive ? '#2563EB' : '#64748B',
                background: isActive ? '#EFF6FF' : 'transparent',
              })}
            >
              {({ isActive }) => <Icon size={20} color={isActive ? '#2563EB' : '#64748B'} strokeWidth={isActive ? 2.2 : 1.8} />}
            </NavLink>
          ))}
        </div>

        <div style={{ width: 28, height: 1, background: '#E2E8F0', margin: '10px auto' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%', padding: '0 8px', marginTop: 'auto' }}>
          <NavLink to="/news" end={false}
            style={({ isActive }) => ({
              width: '100%', height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 12, transition: 'all 0.15s', cursor: 'pointer',
              color: isActive ? '#2563EB' : '#64748B',
              background: isActive ? '#EFF6FF' : 'transparent',
            })}
          >
            {({ isActive }) => <Brain size={20} color={isActive ? '#2563EB' : '#64748B'} strokeWidth={isActive ? 2.2 : 1.8} />}
          </NavLink>

          <div style={{ width: '100%', height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12, cursor: 'pointer', color: '#64748B', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#F1F5F9' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          >
            <Settings size={20} strokeWidth={1.8} />
          </div>

          <div onClick={handleLogout}
            style={{ width: '100%', height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12, cursor: 'pointer', color: '#64748B', transition: 'all 0.15s', marginTop: 4 }}
            onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.color = '#DC2626' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748B' }}
            title="Logout"
          >
            <LogOut size={20} strokeWidth={1.8} />
          </div>
        </div>
      </nav>

      <main className="flex-1 overflow-auto" style={{ marginLeft: 72, padding: '24px 28px' }}>
        <Outlet />
      </main>
    </div>
  )
}
