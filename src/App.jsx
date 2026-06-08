import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import LogPage from './pages/LogPage'
import AnalysisPage from './pages/AnalysisPage'
import SharedPage from './pages/SharedPage'
import SettingsPage from './pages/SettingsPage'
import NavBar from './components/NavBar'

export default function App() {
  const { session } = useAuth()

  if (session === undefined) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh' }}>
        <div style={{ color: 'var(--muted)' }}>Loading…</div>
      </div>
    )
  }

  if (!session) return <AuthPage />

  return (
    <>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/log" element={<LogPage />} />
        <Route path="/analysis" element={<AnalysisPage />} />
        <Route path="/shared" element={<SharedPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <NavBar />
    </>
  )
}
