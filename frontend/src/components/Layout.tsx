import { type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { path: '/', label: '仪表盘', icon: '📊' },
  { path: '/records', label: '账单', icon: '📝' },
  { path: '/ai', label: 'AI记账', icon: '🤖' },
  { path: '/categories', label: '分类', icon: '🏷️' },
]

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold text-gray-800">
            <span>💰</span>
            <span>记账本</span>
          </Link>
          <nav className="flex gap-1">
            {navItems.map(item => {
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors' +
                    (isActive
                      ? ' bg-blue-50 text-blue-600'
                      : ' text-gray-600 hover:bg-gray-100')
                  }
                >
                  <span className="mr-1.5">{item.icon}</span>
                  {item.label}
                </Link>
              )
            })}
            <button
              onClick={handleLogout}
              className="ml-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="退出登录"
            >
              退出
            </button>
          </nav>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
