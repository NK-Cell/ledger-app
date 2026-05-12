import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Setup from './pages/Setup'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Records from './pages/Records'
import Categories from './pages/Categories'
import AISettingsPage from './pages/AISettings'
import AIRecord from './pages/AIRecord'

function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-gray-400">加载中...</p>
    </div>
  )
}

export default function App() {
  const { loading, needsSetup, token } = useAuth()

  if (loading) return <Loading />

  if (needsSetup) {
    return (
      <Routes>
        <Route path="*" element={<Setup />} />
      </Routes>
    )
  }

  if (!token) {
    return (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    )
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/records" element={<Records />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/ai" element={<AIRecord />} />
        <Route path="/ai/settings" element={<AISettingsPage />} />
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}
