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

  if (pathname === '/') {
    return (
      <header className="sticky top-0 z-50 border-b border-white/70 bg-white/90 backdrop-blur-md">
        <nav aria-label="Main navigation" className="mx-auto flex max-w-[950px] flex-wrap items-center justify-between gap-x-4 px-5 py-2 sm:px-8 lg:h-[58px] lg:flex-nowrap lg:px-0 lg:py-0">
          <Link to="/" aria-label="DevPath home" className="flex shrink-0 items-center gap-1.5 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal">
            <svg aria-hidden="true" viewBox="0 0 34 34" className="h-8 w-8">
              <path d="M3 4h7l11 13L10 30H3l11-13z" fill="#087bbb" />
              <path d="M12 3h7l12 14-12 14h-7l12-14z" fill="#0bb8b0" />
              <path d="M18 10h5l6 7-6 7h-5l6-7z" fill="#fff" />
            </svg>
            <span className="text-[21px] font-extrabold tracking-[-0.05em] text-[#142a50]">Dev<span className="text-teal-600">Path</span></span>
          </Link>
          <div className="order-3 flex w-full items-center justify-center gap-6 pb-1.5 pt-1 sm:gap-8 lg:order-none lg:w-auto lg:gap-8 lg:pb-0 lg:pt-0">
            <Link to="/" aria-current="page" className="border-b-2 border-teal-500 px-1 py-1.5 text-[11px] font-semibold text-teal-600 transition-colors hover:text-teal-700 sm:text-xs">Home</Link>
            <Link to="/roadmaps" className="border-b-2 border-transparent px-1 py-1.5 text-[11px] font-medium text-[#334766] transition-colors hover:border-teal-400 hover:text-teal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal sm:text-xs">Roadmaps</Link>
            <a href="#features" className="border-b-2 border-transparent px-1 py-1.5 text-[11px] font-medium text-[#334766] transition-colors hover:border-teal-400 hover:text-teal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal sm:text-xs">About</a>
            <a href="#contact" className="border-b-2 border-transparent px-1 py-1.5 text-[11px] font-medium text-[#334766] transition-colors hover:border-teal-400 hover:text-teal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal sm:text-xs">Contact</a>
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-2 lg:ml-0">
            <Link to="/login" className="inline-flex min-h-8 items-center justify-center rounded-full border border-teal-400 px-4 text-[10px] font-semibold text-teal-700 transition-colors hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal sm:min-h-9 sm:px-5 sm:text-xs">Login</Link>
            <Link to="/signup" className="inline-flex min-h-8 items-center justify-center rounded-full bg-gradient-brand px-4 text-[10px] font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 sm:min-h-9 sm:px-5 sm:text-xs">Get Started</Link>
          </div>
        </nav>
      </header>
    )
  }

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
                to="/roadmaps"
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
