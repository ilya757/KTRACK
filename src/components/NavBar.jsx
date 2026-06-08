import { useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, BookOpen, BarChart2, Users, Settings } from 'lucide-react'

const items = [
  { path: '/',         label: 'Home',    Icon: LayoutDashboard },
  { path: '/log',      label: 'Log',     Icon: BookOpen },
  { path: '/analysis', label: 'Analysis',Icon: BarChart2 },
  { path: '/shared',   label: 'Together',Icon: Users },
  { path: '/settings', label: 'Settings',Icon: Settings },
]

export default function NavBar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <nav className="nav">
      {items.map(({ path, label, Icon }) => (
        <button
          key={path}
          className={`nav-item${pathname === path ? ' active' : ''}`}
          onClick={() => navigate(path)}
        >
          <Icon />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  )
}
