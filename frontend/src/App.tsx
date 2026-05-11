import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Records from './pages/Records'
import Categories from './pages/Categories'
import AISettingsPage from './pages/AISettings'
import AIRecord from './pages/AIRecord'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/records" element={<Records />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/ai" element={<AIRecord />} />
        <Route path="/ai/settings" element={<AISettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}
