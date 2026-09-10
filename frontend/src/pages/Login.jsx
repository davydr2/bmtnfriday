import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'

export default function Login() {
  const { user, loading, login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && user) navigate('/', { replace: true })
  }, [user, loading, navigate])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-md p-10 max-w-sm w-full text-center">
        <h1 className="text-2xl font-bold text-indigo-700 mb-1">BMTN Friday</h1>
        <p className="text-gray-500 text-sm mb-8">Weekly Report Challenge</p>
        <button
          onClick={login}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg transition cursor-pointer"
        >
          Sign in with your company account
        </button>
      </div>
    </div>
  )
}
