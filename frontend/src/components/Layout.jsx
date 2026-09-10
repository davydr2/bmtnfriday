import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../AuthContext'

export default function Layout() {
  const { user, logout } = useAuth()
  const location = useLocation()

  const nav = [
    { to: '/', label: 'Dashboard' },
    { to: '/submit', label: 'Submit Report' },
    ...(user?.isAdmin ? [{ to: '/admin', label: 'Admin' }] : []),
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <span className="font-bold text-indigo-700 text-lg tracking-tight">BMTN Friday</span>
            <nav className="flex gap-4">
              {nav.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className={`text-sm font-medium ${location.pathname === to ? 'text-indigo-700' : 'text-gray-600 hover:text-indigo-600'}`}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {user && <span className="text-sm text-gray-500">{user.signInDetails?.loginId || user.username}</span>}
            <button
              onClick={logout}
              className="text-sm text-gray-500 hover:text-red-600 cursor-pointer"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
