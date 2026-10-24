import { Link, useLocation, useNavigate } from 'react-router-dom'

import { useAdminAuth } from '../../context/AdminAuthContext'
import { useAuth } from '../../context/AuthContext'
import Button from '../ui/Button'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { admin, logout: logoutAdmin } = useAdminAuth()
  const { pathname } = useLocation()
  const navigate = useNavigate()

  if (
    pathname.startsWith('/admin') ||
    pathname === '/dashboard' ||
    pathname.startsWith('/roadmaps') ||
    pathname.startsWith('/resources') ||
    pathname.startsWith('/progress') ||
    pathname.startsWith('/profile')
  ) return null

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur-md">
      <nav aria-label="Main navigation" className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-8">
        <Link
          to="/"
          className="shrink-0 rounded-sm text-xl font-extrabold tracking-tight text-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
        >
          DevPath<span className="text-gradient">.</span>
        </Link>
        <div className="flex items-center gap-1 sm:gap-2">
          {admin ? (
            <>
              {pathname !== '/' && (
                <>
                  <Link
                    to="/admin/dashboard"
                    className="hidden rounded-lg px-3 py-2 text-sm font-medium text-body transition-colors hover:bg-teal-tint hover:text-teal-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal sm:block"
                  >
                    Admin dashboard
                  </Link>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      logoutAdmin()
                      navigate('/login', { replace: true })
                    }}
                  >
                    Log out
                  </Button>
                </>
              )}
            </>
          ) : user ? (
            <>
              {pathname !== '/' && (
                <>
                  <Link
                    to="/dashboard"
                    className="hidden rounded-lg px-3 py-2 text-sm font-medium text-body transition-colors hover:bg-teal-tint hover:text-teal-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal sm:block"
                  >
                    Dashboard
                  </Link>
                  <Button variant="secondary" onClick={logout}>
                    Log out
                  </Button>
                </>
              )}
            </>
          ) : (
            <>
              <Link
                to="/dashboard"
                className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-body transition-colors hover:bg-teal-tint hover:text-teal-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal sm:block"
              >
                Explore roadmaps
              </Link>
              <Button to="/login" variant="ghost" className="px-2.5 sm:px-3">
                Log in
              </Button>
              <Button to="/signup" className="px-3 sm:px-4">
                Sign up
              </Button>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}
