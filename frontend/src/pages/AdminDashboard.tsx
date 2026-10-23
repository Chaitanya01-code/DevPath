import { useNavigate } from 'react-router-dom'

import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { useAdminAuth } from '../context/AdminAuthContext'

const sections = [
  { title: 'Users', icon: '◎', tint: 'bg-teal-tint text-teal-hover' },
  { title: 'Roadmaps', icon: '↗', tint: 'bg-violet-tint text-violet' },
  { title: 'Projects', icon: '✦', tint: 'bg-coral-tint text-heading ring-1 ring-coral/35' },
]

export default function AdminDashboard() {
  const { admin, logout } = useAdminAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 sm:px-8 sm:py-12">
      <header className="mb-8 flex items-center justify-between">
        <span className="text-lg font-extrabold tracking-tight text-heading">
          Skillora<span className="text-gradient">.</span>
          <span className="ml-2 rounded-full bg-violet-tint px-2.5 py-1 text-xs font-bold text-violet">Admin</span>
        </span>
        <Button variant="secondary" onClick={handleLogout}>Log out</Button>
      </header>
      <section className="mb-8 rounded-3xl border border-teal/15 bg-gradient-to-r from-teal-tint via-white to-violet-tint p-6 sm:p-9">
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-violet">Admin workspace</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-heading sm:text-4xl">Welcome, Admin</h1>
        {admin && <p className="mt-3 text-body">{admin.username}</p>}
      </section>
      <div className="grid gap-5 md:grid-cols-3">
        {sections.map((section) => (
          <Card key={section.title} className="min-h-52 p-6 sm:p-7">
            <span className={`grid h-12 w-12 place-items-center rounded-2xl text-xl ${section.tint}`} aria-hidden="true">
              {section.icon}
            </span>
            <h2 className="mt-5 text-lg font-bold text-heading">{section.title}</h2>
            <div className="mt-4 grid min-h-16 place-items-center rounded-xl border border-dashed border-line bg-page px-4 text-center">
              <p className="text-sm text-muted">{section.title} tools will appear here.</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
