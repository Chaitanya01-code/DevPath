import { Link } from 'react-router-dom'

import { useAuth } from '../../context/AuthContext'
import Button from '../ui/Button'

export default function Navbar() {
  const { user, logout } = useAuth()

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
        <Link to="/" className="text-xl font-extrabold tracking-tight text-heading">
          Skillora<span className="text-gradient">.</span>
        </Link>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link
                to="/dashboard"
                className="hidden rounded-lg px-3 py-2 text-sm font-medium text-body hover:text-teal-hover sm:block"
              >
                Dashboard
              </Link>
              <Button variant="secondary" onClick={logout}>
                Log out
              </Button>
            </>
          ) : (
            <>
              <Button to="/login" variant="ghost" className="px-3">
                Log in
              </Button>
              <Button to="/signup" className="px-4">
                Sign up
              </Button>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}
