import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './AuthContext'
import Layout from './components/Layout'
import Portal from './pages/Portal'
import Submit from './pages/Submit'
import Admin from './pages/Admin'
import Login from './pages/Login'

function PrivateRoute({ children, adminOnly }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center min-h-screen text-gray-500">Loading…</div>
  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && !user.isAdmin) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Layout />}>
            <Route index element={<PrivateRoute><Portal /></PrivateRoute>} />
            <Route path="submit" element={<PrivateRoute><Submit /></PrivateRoute>} />
            <Route path="admin" element={<PrivateRoute adminOnly><Admin /></PrivateRoute>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
