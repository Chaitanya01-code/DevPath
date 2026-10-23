import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-line bg-footer">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-5 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p>© {new Date().getFullYear()} Skillora. Learn with direction.</p>
        <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-5 gap-y-2">
          <Link to="/" className="transition-colors hover:text-teal-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal">
            Home
          </Link>
          <Link to="/dashboard" className="transition-colors hover:text-teal-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal">
            Roadmaps
          </Link>
          <Link to="/login" className="transition-colors hover:text-teal-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal">
            Log in
          </Link>
          <Link to="/signup" className="transition-colors hover:text-teal-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal">
            Sign up
          </Link>
        </nav>
      </div>
    </footer>
  )
}
