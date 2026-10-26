import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, NavLink, Outlet, useParams, useSearchParams } from 'react-router-dom'

import { getApiErrorMessage } from '../api/client'
import {
  getDomains,
  getLearningResources,
  getMyRoadmapProgress,
  getRoadmap,
  getRoadmapProgress,
  getRoadmaps,
  startRoadmap,
  setStepProgress,
  updateMyDomain,
} from '../api/auth'
import { useAuth } from '../context/AuthContext'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Select from '../components/ui/Select'
import type {
  Domain,
  LearningResource,
  MyRoadmapProgressSummary,
  Roadmap,
  RoadmapProgress,
  RoadmapStep,
  RoadmapWithProgress,
} from '../types'

const getSafeResourceUrl = (value: string): string | null => {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null
  } catch {
    return null
  }
}

type StudentNavIcon = 'dashboard' | 'roadmaps' | 'resources' | 'progress' | 'profile'

function StudentIcon({ name, className = 'h-5 w-5' }: { name: StudentNavIcon; className?: string }) {
  const shared = { fill: 'none', stroke: 'currentColor', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, strokeWidth: 1.8 }
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} {...shared}>
      {name === 'dashboard' && <><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" /></>}
      {name === 'roadmaps' && <><path d="m3.5 6 5.5-2 6 2 5.5-2v14l-5.5 2-6-2-5.5 2z" /><path d="M9 4v14m6-12v14" /></>}
      {name === 'resources' && <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 1 4 16.5z" /><path d="M4 16.5A2.5 2.5 0 0 1 6.5 14H20M8 7h8m-8 3h6" /></>}
      {name === 'progress' && <><path d="M4 20V11m5 9V5m5 15v-7m5 7V8" /><path d="M2.5 20.5h19" /></>}
      {name === 'profile' && <><circle cx="12" cy="8" r="3.5" /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" /></>}
    </svg>
  )
}

const studentNavigation: { to: string; label: string; icon: StudentNavIcon; end?: boolean }[] = [
  { to: '/dashboard', label: 'Dashboard', icon: 'dashboard', end: true },
  { to: '/roadmaps', label: 'Roadmaps', icon: 'roadmaps' },
  { to: '/resources', label: 'Learning Resources', icon: 'resources' },
  { to: '/progress', label: 'My Progress', icon: 'progress' },
  { to: '/profile', label: 'Profile', icon: 'profile' },
]

export function StudentLayout() {
  const { user, logout } = useAuth()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const initials = user?.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'S'
  const closeDrawer = () => setDrawerOpen(false)

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label={drawerOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={drawerOpen}
              onClick={() => setDrawerOpen((open) => !open)}
              className="rounded-lg p-2 text-heading hover:bg-teal-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal lg:hidden"
            >
              <span aria-hidden="true" className="text-xl leading-none">{drawerOpen ? '×' : '☰'}</span>
            </button>
            <Link to="/dashboard" className="rounded-sm text-xl font-extrabold tracking-tight text-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal">
              DevPath<span className="text-gradient">.</span>
            </Link>
          </div>
          {user && (
            <details className="relative">
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl p-1.5 text-left hover:bg-page focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-brand text-sm font-bold text-white">{initials}</span>
                <span className="hidden max-w-40 truncate text-sm font-semibold text-heading sm:block">{user.name}</span>
                <span aria-hidden="true" className="text-xs text-muted">⌄</span>
              </summary>
              <div className="absolute right-0 mt-2 w-48 rounded-xl border border-line bg-white p-2 shadow-card">
                <Link to="/profile" className="block rounded-lg px-3 py-2 text-sm font-medium text-body hover:bg-teal-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal">Profile</Link>
                <button type="button" onClick={logout} className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-coral hover:bg-coral-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal">Log out</button>
              </div>
            </details>
          )}
        </div>
      </header>
      <div className="relative mx-auto flex w-full max-w-[1600px] flex-1">
        {drawerOpen && <button type="button" aria-label="Close navigation menu" className="fixed inset-0 z-30 bg-heading/20 lg:hidden" onClick={closeDrawer} />}
        <aside className={`${drawerOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-16 left-0 z-40 flex w-72 flex-col border-r border-line bg-white p-4 transition-transform duration-200 lg:sticky lg:top-16 lg:z-10 lg:h-[calc(100vh-4rem)] lg:w-60 lg:shrink-0 lg:translate-x-0 lg:p-5 motion-reduce:transition-none`}>
          <p className="px-3 pb-3 pt-2 text-[11px] font-bold uppercase tracking-[0.16em] text-muted">Learning space</p>
          <nav aria-label="Student navigation" className="space-y-1">
            {studentNavigation.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={closeDrawer}
                className={({ isActive }) => `flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal ${isActive ? 'bg-teal-tint text-teal-hover' : 'text-body hover:bg-page hover:text-heading'}`}
              >
                <StudentIcon name={item.icon} />
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-8 rounded-2xl border border-teal/15 bg-gradient-to-br from-teal-tint to-violet-tint p-4">
            <p className="text-sm font-bold text-heading">Small steps add up</p>
            <p className="mt-1 text-xs leading-5 text-muted">Choose a path and return whenever you are ready to learn.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              closeDrawer()
              logout()
            }}
            className="mt-auto flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-coral transition-colors hover:bg-coral-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8">
              <path d="M10 4H5.5A1.5 1.5 0 0 0 4 5.5v13A1.5 1.5 0 0 0 5.5 20H10" />
              <path d="M14 16l4-4-4-4m4 4H9" />
            </svg>
            Log out
          </button>
        </aside>
        <main id="student-main" className="min-w-0 flex-1 px-4 pb-10 pt-5 sm:px-6 sm:pb-12 sm:pt-7 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function ProgressBar({ value, label }: { value: number; label: string }) {
  const percentage = Math.max(0, Math.min(100, Math.round(value)))
  return (
    <div className="h-2 overflow-hidden rounded-full bg-teal-tint" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentage}>
      <div className="h-full rounded-full bg-gradient-brand transition-all duration-300 motion-reduce:transition-none" style={{ width: `${percentage}%` }} />
    </div>
  )
}

function RoadmapCard({ roadmap }: { roadmap: RoadmapWithProgress }) {
  const domainName = typeof roadmap.domain?.name === 'string' ? roadmap.domain.name : ''
  const description = typeof roadmap.description === 'string' ? roadmap.description : ''
  const estimatedHours = Number.isFinite(roadmap.estimated_hours) && roadmap.estimated_hours > 0
    ? roadmap.estimated_hours
    : null
  const totalRequiredSteps = Number.isFinite(roadmap.total_required_steps)
    ? roadmap.total_required_steps
    : null
  const progressPercentage = Number.isFinite(roadmap.progress_percentage)
    ? Math.max(0, Math.min(100, roadmap.progress_percentage))
    : null

  return (
    <Card className="flex h-full flex-col p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-card-hover motion-reduce:transform-none motion-reduce:transition-none">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          {domainName && <span className="rounded-full bg-teal-tint px-3 py-1 text-teal-hover">{domainName}</span>}
          {roadmap.difficulty && <span className="rounded-full bg-violet-tint px-3 py-1 capitalize text-violet">{roadmap.difficulty}</span>}
          {estimatedHours !== null && <span className="text-muted">{estimatedHours} hr</span>}
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-tint to-violet-tint text-teal-hover" aria-hidden="true">
          <StudentIcon name="roadmaps" />
        </span>
      </div>
      <h2 className="mt-3 text-lg font-bold text-heading">{roadmap.title}</h2>
      {description && <p className="mt-1 flex-1 text-sm leading-6 text-body">{description}</p>}
      {totalRequiredSteps !== null && (
        <p className="mt-3 text-xs text-muted">{totalRequiredSteps} required {totalRequiredSteps === 1 ? 'step' : 'steps'}</p>
      )}
      {roadmap.is_started && progressPercentage !== null && (
        <div className="mt-4">
          <div className="mb-1.5 flex justify-between text-xs font-semibold">
            <span className="text-muted">{roadmap.completed_required_steps} of {roadmap.total_required_steps} complete</span>
            <span className="text-teal-hover">{Math.round(progressPercentage)}%</span>
          </div>
          <ProgressBar value={progressPercentage} label={`${roadmap.title} completion`} />
        </div>
      )}
      <Button to={`/roadmaps/${roadmap.id}`} className="mt-4 self-start">
        {progressPercentage !== null && progressPercentage >= 100
          ? 'Review Roadmap'
          : roadmap.is_started
            ? 'Continue Learning'
            : 'Start Learning'}
      </Button>
    </Card>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [roadmaps, setRoadmaps] = useState<RoadmapWithProgress[]>([])
  const [progressSummaries, setProgressSummaries] = useState<MyRoadmapProgressSummary[]>([])
  const [roadmapsLoading, setRoadmapsLoading] = useState(true)
  const [roadmapsError, setRoadmapsError] = useState('')
  const [progressLoading, setProgressLoading] = useState(true)
  const [progressError, setProgressError] = useState('')
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    if (!user) return
    let current = true
    setRoadmapsLoading(true)
    setRoadmapsError('')
    setProgressLoading(true)
    setProgressError('')

    void getRoadmaps({ all_domains: true })
      .then((items) => {
        if (!Array.isArray(items)) throw new Error('The roadmap response was not a list.')
        if (current) setRoadmaps(items)
      })
      .catch((error: unknown) => {
        console.error('Unable to load dashboard roadmaps.', error)
        if (current) {
          setRoadmaps([])
          setRoadmapsError(getApiErrorMessage(error, 'Unable to load roadmaps right now.'))
        }
      })
      .finally(() => { if (current) setRoadmapsLoading(false) })

    void getMyRoadmapProgress()
      .then((progress) => {
        if (!Array.isArray(progress)) throw new Error('The progress response was not a list.')
        if (current) setProgressSummaries(progress)
      })
      .catch((error: unknown) => {
        console.error('Unable to load dashboard progress.', error)
        if (current) {
          setProgressSummaries([])
          setProgressError(getApiErrorMessage(error, 'Unable to load your progress right now.'))
        }
      })
      .finally(() => { if (current) setProgressLoading(false) })

    return () => { current = false }
  }, [user?.id, user?.domain.id, retryCount])

  if (!user) return null

  const activeRoadmaps = progressSummaries.filter((summary) => summary.progress_percentage < 100).length
  const completedRoadmaps = progressSummaries.filter((summary) => summary.progress_percentage >= 100).length
  const selectedDomainRoadmaps = roadmaps.filter((roadmap) => roadmap.domain_id === user.domain.id)
  const continueRoadmap = roadmaps.find((roadmap) => roadmap.is_started && roadmap.progress_percentage < 100)
  const totalRequiredSteps = progressSummaries.reduce((total, summary) => total + summary.total_required_steps, 0)
  const totalCompletedSteps = progressSummaries.reduce((total, summary) => total + summary.completed_required_steps, 0)
  const overallProgress = totalRequiredSteps ? Math.round((totalCompletedSteps / totalRequiredSteps) * 100) : 0
  return (
    <div className="mx-auto w-full max-w-7xl">
      <section className="mb-5 flex flex-col gap-4 overflow-hidden rounded-3xl border border-teal/15 bg-gradient-to-r from-teal-tint via-white to-violet-tint p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-hover">Your learning space</p>
          <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight text-heading sm:text-3xl">Welcome, {user.name}</h1>
          <p className="mt-1.5 text-sm text-body sm:text-base">Keep building your skills, one focused step at a time.</p>
          <p className="mt-3 inline-flex rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-violet">Current focus: {user.domain.name}</p>
        </div>
        <Button to="/roadmaps" className="w-full shrink-0 sm:w-auto">Explore roadmaps <span aria-hidden="true">→</span></Button>
      </section>

      <section className="grid gap-3 sm:grid-cols-3" aria-label="Learning progress summary">
        {[
          { label: 'Roadmaps in progress', value: activeRoadmaps, detail: 'Started and not yet complete', icon: 'roadmaps' as const },
          { label: 'Completed roadmaps', value: completedRoadmaps, detail: 'Required steps completed', icon: 'progress' as const },
          { label: 'Overall progress', value: `${overallProgress}%`, detail: totalRequiredSteps ? `${totalCompletedSteps} of ${totalRequiredSteps} required steps complete` : 'No started roadmaps yet', icon: 'dashboard' as const },
        ].map((stat) => (
          <Card key={stat.label} className="flex items-start gap-3 p-4 sm:p-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-tint text-teal-hover"><StudentIcon name={stat.icon} /></span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-muted sm:text-sm">{stat.label}</p>
              <p className="mt-0.5 text-2xl font-extrabold text-heading">{progressLoading ? '…' : progressError ? '—' : stat.value}</p>
              {!progressLoading && !progressError && <p className="mt-1 truncate text-xs text-muted">{stat.detail}</p>}
              {progressError && <p className="mt-1 text-xs text-coral">Unavailable</p>}
            </div>
          </Card>
        ))}
      </section>
      {progressError && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-coral/30 bg-coral-tint px-4 py-3">
          <p className="text-sm text-heading">Progress statistics could not be loaded. {progressError}</p>
          <Button type="button" variant="secondary" className="px-3 py-2 text-sm" onClick={() => setRetryCount((count) => count + 1)}>Retry</Button>
        </div>
      )}
      <div className="mt-6 grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <section aria-labelledby="continue-learning-heading">
          <div className="mb-3">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-violet">Pick up where you left off</p>
            <h2 id="continue-learning-heading" className="mt-1 text-xl font-extrabold text-heading sm:text-2xl">Continue learning</h2>
          </div>
          {roadmapsLoading ? (
            <Card className="p-5 text-sm text-muted" role="status">Checking your learning progress…</Card>
          ) : roadmapsError ? (
            <Card className="p-5" role="alert">
              <p className="text-sm text-heading">Your roadmap progress could not be loaded. {roadmapsError}</p>
              <Button type="button" variant="secondary" className="mt-4" onClick={() => setRetryCount((count) => count + 1)}>Retry</Button>
            </Card>
          ) : continueRoadmap ? (
            <Card className="p-5 sm:p-6">
              <div className="flex flex-wrap gap-2 text-xs font-semibold">
                <span className="rounded-full bg-teal-tint px-3 py-1 text-teal-hover">{continueRoadmap.domain.name}</span>
                <span className="rounded-full bg-violet-tint px-3 py-1 capitalize text-violet">{continueRoadmap.difficulty}</span>
                {continueRoadmap.estimated_hours > 0 && <span className="rounded-full bg-page px-3 py-1 text-muted">{continueRoadmap.estimated_hours} hours</span>}
              </div>
              <h3 className="mt-3 text-lg font-bold text-heading">{continueRoadmap.title}</h3>
              <p className="mt-1 text-sm leading-6 text-body">{continueRoadmap.description}</p>
              <p className="mt-3 text-xs text-muted">{continueRoadmap.completed_required_steps} of {continueRoadmap.total_required_steps} required steps complete</p>
              <div className="mt-2"><ProgressBar value={continueRoadmap.progress_percentage} label={`${continueRoadmap.title} completion`} /></div>
              <Button to={`/roadmaps/${continueRoadmap.id}`} className="mt-4">Continue learning</Button>
            </Card>
          ) : selectedDomainRoadmaps.length === 0 ? (
            <Card className="p-5 sm:p-6">
              <h3 className="font-bold text-heading">No published roadmaps for {user.domain.name} yet.</h3>
              <p className="mt-1 text-sm leading-6 text-muted">Your progress in other domains remains saved. You can update your learning focus from your profile.</p>
              <Button to="/profile" variant="secondary" className="mt-4">Update learning focus</Button>
            </Card>
          ) : (
            <Card className="p-5 sm:p-6">
              <h3 className="font-bold text-heading">{completedRoadmaps > 0 ? 'You have completed your started roadmaps.' : 'Your first roadmap is ready when you are.'}</h3>
              <p className="mt-1 text-sm leading-6 text-muted">Explore the published paths for your selected domain and choose what to learn next.</p>
              <Button to="/roadmaps" variant="secondary" className="mt-4">Explore roadmaps</Button>
            </Card>
          )}
        </section>
      </div>
    </div>
  )
}

export function RoadmapsPage() {
  const { user } = useAuth()
  const [roadmaps, setRoadmaps] = useState<RoadmapWithProgress[]>([])
  const [search, setSearch] = useState('')
  const [selectedDomain, setSelectedDomain] = useState<number | null>(null)
  const [sortOrder, setSortOrder] = useState<'default' | 'difficulty' | 'duration'>('default')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retryCount, setRetryCount] = useState(0)
  const roadmapRequestRef = useRef<{ key: string; promise: Promise<RoadmapWithProgress[]> } | null>(null)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    let current = true
    setLoading(true)
    setError('')
    const requestKey = `${user.id}:${user.domain.id}:${retryCount}`
    const request = roadmapRequestRef.current?.key === requestKey
      ? roadmapRequestRef.current.promise
      : getRoadmaps({ all_domains: true })
    roadmapRequestRef.current = { key: requestKey, promise: request }
    void request
      .then((items) => {
        if (!Array.isArray(items)) throw new Error('The roadmap response was not a list.')
        if (current) setRoadmaps(items)
      })
      .catch((requestError: unknown) => {
        console.error('Unable to load roadmaps.', requestError)
        if (current) {
          setRoadmaps([])
          setError(getApiErrorMessage(requestError, 'Unable to load roadmaps.'))
        }
      })
      .finally(() => {
        if (current) setLoading(false)
        if (roadmapRequestRef.current?.key === requestKey) roadmapRequestRef.current = null
      })
    return () => { current = false }
  }, [user?.id, user?.domain.id, retryCount])

  const domains = [...new Map(roadmaps.map((roadmap) => [roadmap.domain_id, roadmap.domain.name]))]
  const normalizedSearch = search.trim().toLowerCase()
  const filtered = roadmaps.filter((roadmap) => {
    const description = typeof roadmap.description === 'string' ? roadmap.description : ''
    const matchesSearch = `${roadmap.title} ${description}`.toLowerCase().includes(normalizedSearch)
    const matchesDomain = selectedDomain === null || roadmap.domain_id === selectedDomain
    return matchesSearch && matchesDomain
  })
  const difficultyRank: Record<RoadmapWithProgress['difficulty'], number> = {
    beginner: 0,
    intermediate: 1,
    advanced: 2,
  }
  const sortedRoadmaps = [...filtered]
  if (sortOrder === 'difficulty') {
    sortedRoadmaps.sort((left, right) => difficultyRank[left.difficulty] - difficultyRank[right.difficulty])
  } else if (sortOrder === 'duration') {
    sortedRoadmaps.sort((left, right) => {
      const leftDuration = left.estimated_hours > 0 ? left.estimated_hours : Number.POSITIVE_INFINITY
      const rightDuration = right.estimated_hours > 0 ? right.estimated_hours : Number.POSITIVE_INFINITY
      return leftDuration - rightDuration
    })
  }
  const hasActiveFilters = Boolean(search.trim()) || selectedDomain !== null || sortOrder !== 'default'
  const clearFilters = () => {
    setSearch('')
    setSelectedDomain(null)
    setSortOrder('default')
  }

  return (
    <div className="mx-auto w-full max-w-7xl">
      <header className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-hover">Explore your learning path</p>
        <h1 className="mt-1 text-2xl font-extrabold text-heading sm:text-3xl">Learning Roadmaps</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Choose your path, build practical skills, and track your progress.</p>
      </header>
      {!loading && !error && roadmaps.length > 0 && (
        <section className="mb-6 space-y-4" aria-label="Roadmap filters">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by domain">
            <button
              type="button"
              aria-pressed={selectedDomain === null}
              onClick={() => setSelectedDomain(null)}
              className={`min-h-10 rounded-xl px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal ${selectedDomain === null ? 'bg-gradient-brand text-white shadow-md shadow-teal/20' : 'border border-line bg-white text-body hover:bg-teal-tint'}`}
            >
              All Roadmaps
            </button>
            {domains.map(([domainId, domainName]) => (
              <button
                key={domainId}
                type="button"
                aria-pressed={selectedDomain === domainId}
                onClick={() => setSelectedDomain(domainId)}
                className={`min-h-10 rounded-xl px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal ${selectedDomain === domainId ? 'bg-gradient-brand text-white shadow-md shadow-teal/20' : 'border border-line bg-white text-body hover:bg-teal-tint'}`}
              >
                {domainName}
              </button>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end">
            <label className="block text-sm font-semibold text-heading">
              Search roadmaps
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by title or description"
                className="mt-1.5 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm font-normal text-body outline-none focus:border-teal focus:ring-4 focus:ring-teal/15"
              />
            </label>
            <label className="block text-sm font-semibold text-heading">
              Sort by
              <select
                value={sortOrder}
                onChange={(event) => {
                  const value = event.target.value
                  if (value === 'default' || value === 'difficulty' || value === 'duration') {
                    setSortOrder(value)
                  }
                }}
                className="mt-1.5 min-h-11 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm font-normal text-body outline-none focus:border-teal focus:ring-4 focus:ring-teal/15"
              >
                <option value="default">Recommended order</option>
                <option value="difficulty">Beginner to advanced</option>
                <option value="duration">Shortest to longest</option>
              </select>
            </label>
            {hasActiveFilters && (
              <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
          </div>
        </section>
      )}
      {loading ? <Card role="status" className="p-5 text-sm text-muted">Loading published roadmaps…</Card>
        : error ? (
          <Card role="alert" className="p-5 sm:p-6">
            <h2 className="font-bold text-heading">Roadmaps could not be loaded.</h2>
            <p className="mt-1 text-sm leading-6 text-muted">{error}</p>
            <Button type="button" variant="secondary" className="mt-4" onClick={() => setRetryCount((count) => count + 1)}>Retry</Button>
          </Card>
        )
          : filtered.length === 0 ? (
            <Card className="p-6">
              <h2 className="font-bold text-heading">{roadmaps.length === 0 ? 'No published roadmaps are available yet.' : 'No roadmaps match your filters.'}</h2>
              <p className="mt-1 text-sm leading-6 text-muted">{roadmaps.length === 0 ? `Published paths for ${user?.domain.name} will appear here when they are available.` : 'Try another search or clear your filters to see all available roadmaps.'}</p>
              {roadmaps.length === 0
                ? <Button to="/profile" variant="secondary" className="mt-4">Change learning domain</Button>
                : <Button type="button" variant="secondary" className="mt-4" onClick={clearFilters}>Clear filters</Button>}
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">{sortedRoadmaps.map((roadmap) => <RoadmapCard key={roadmap.id} roadmap={roadmap} />)}</div>
          )}
    </div>
  )
}

export function LearningResourcesPage() {
  const { user } = useAuth()
  const [resources, setResources] = useState<{ roadmap: Roadmap; resource: LearningResource }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let current = true
    setLoading(true)
    setError('')
    getLearningResources()
      .then((roadmaps) => {
        const items = roadmaps.flatMap((roadmap) => (roadmap.steps ?? []).flatMap((step) =>
          step.resources.map((resource) => ({ roadmap, resource })),
        ))
        if (current) setResources(items)
      })
      .catch((requestError: unknown) => { if (current) setError(getApiErrorMessage(requestError, 'Unable to load learning resources.')) })
      .finally(() => { if (current) setLoading(false) })
    return () => { current = false }
  }, [user?.domain.id])

  const grouped = resources.reduce<Map<number, { roadmap: Roadmap; resources: LearningResource[] }>>((groups, item) => {
    const group = groups.get(item.roadmap.id) ?? { roadmap: item.roadmap, resources: [] }
    group.resources.push(item.resource)
    groups.set(item.roadmap.id, group)
    return groups
  }, new Map())

  return (
    <div className="mx-auto w-full max-w-7xl">
      <header className="mb-5">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-violet">Study materials</p>
        <h1 className="mt-1 text-2xl font-extrabold text-heading sm:text-3xl">Learning Resources</h1>
        <p className="mt-2 text-sm leading-6 text-muted">Materials connected to published roadmaps in {user?.domain.name}.</p>
      </header>
      {loading ? <Card role="status" className="p-5 text-sm text-muted">Loading learning resources…</Card>
        : error ? <Card role="alert" className="p-5 text-sm text-heading">{error}</Card>
          : resources.length === 0 ? (
            <Card className="p-6">
              <h2 className="font-bold text-heading">No learning resources are available yet.</h2>
              <p className="mt-1 text-sm leading-6 text-muted">Resources will appear here when they are added to published roadmap steps for your selected domain.</p>
              <Button to="/roadmaps" variant="secondary" className="mt-4">View roadmaps</Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {[...grouped.values()].map(({ roadmap, resources: roadmapResources }) => (
                <Card key={roadmap.id} className="p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div><p className="text-xs font-semibold text-teal-hover">{roadmap.domain.name}</p><h2 className="mt-1 text-lg font-bold text-heading">{roadmap.title}</h2></div>
                    <Link to={`/roadmaps/${roadmap.id}`} className="text-sm font-semibold text-teal-hover underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal">Open roadmap</Link>
                  </div>
                  <ul className="mt-4 divide-y divide-line">
                    {roadmapResources.map((resource) => (
                      <li key={resource.id} className="py-3 first:pt-0 last:pb-0">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          {getSafeResourceUrl(resource.url) ? (
                            <a href={getSafeResourceUrl(resource.url) ?? undefined} target="_blank" rel="noopener noreferrer" className="font-semibold text-heading underline decoration-teal/40 underline-offset-4 hover:text-teal-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal">{resource.title}</a>
                          ) : <span className="font-semibold text-muted">{resource.title} (invalid URL)</span>}
                          <span className="rounded-full bg-violet-tint px-2.5 py-1 text-xs capitalize text-violet">{resource.resource_type}</span>
                        </div>
                        {resource.description && <p className="mt-1 text-sm leading-6 text-muted">{resource.description}</p>}
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>
          )}
    </div>
  )
}

export function MyProgressPage() {
  const { user } = useAuth()
  const [summaries, setSummaries] = useState<MyRoadmapProgressSummary[]>([])
  const [currentRoadmaps, setCurrentRoadmaps] = useState<RoadmapWithProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let current = true
    setLoading(true)
    setError('')
    Promise.all([getMyRoadmapProgress(), getRoadmaps({ all_domains: true })])
      .then(([progress, roadmaps]) => {
        if (!current) return
        setSummaries(progress)
        setCurrentRoadmaps(roadmaps)
      })
      .catch((requestError: unknown) => { if (current) setError(getApiErrorMessage(requestError, 'Unable to load your progress.')) })
      .finally(() => { if (current) setLoading(false) })
    return () => { current = false }
  }, [user?.domain.id])

  const completed = summaries.filter((summary) => summary.progress_percentage >= 100).length
  const inProgress = summaries.length - completed
  const totalRequired = summaries.reduce((total, summary) => total + summary.total_required_steps, 0)
  const totalCompleted = summaries.reduce((total, summary) => total + summary.completed_required_steps, 0)
  const overall = totalRequired ? Math.round((totalCompleted / totalRequired) * 100) : 0
  const currentRoadmapById = new Map(currentRoadmaps.map((roadmap) => [roadmap.id, roadmap]))

  return (
    <div className="mx-auto w-full max-w-7xl">
      <header className="mb-5">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-hover">Your learning history</p>
        <h1 className="mt-1 text-2xl font-extrabold text-heading sm:text-3xl">My Progress</h1>
        <p className="mt-2 text-sm leading-6 text-muted">Progress is saved to your account, including roadmaps from domains you followed previously.</p>
      </header>
      {loading ? <Card role="status" className="p-5 text-sm text-muted">Loading your progress…</Card>
        : error ? <Card role="alert" className="p-5 text-sm text-heading">{error}</Card>
          : (
            <>
              <section className="mb-5 grid gap-3 sm:grid-cols-3" aria-label="Progress summary">
                {[
                  ['Roadmaps in progress', inProgress],
                  ['Completed roadmaps', completed],
                  ['Overall completion', `${overall}%`],
                ].map(([label, value]) => <Card key={String(label)} className="p-5"><p className="text-sm font-semibold text-muted">{label}</p><p className="mt-1 text-3xl font-extrabold text-heading">{summaries.length ? value : label === 'Overall completion' ? '0%' : 0}</p></Card>)}
              </section>
              {summaries.length === 0 ? (
                <Card className="p-6">
                  <h2 className="font-bold text-heading">Your learning progress will show here.</h2>
                  <p className="mt-1 text-sm text-muted">Start a published roadmap to begin tracking completed steps.</p>
                  <Button to="/roadmaps" className="mt-4">Explore roadmaps</Button>
                </Card>
              ) : (
                <section className="space-y-3" aria-label="Roadmap progress">
                  {summaries.map((summary) => {
                    const accessibleRoadmap = currentRoadmapById.get(summary.roadmap_id)
                    const percentage = Math.round(summary.progress_percentage)
                    return (
                      <Card key={summary.roadmap_id} className="p-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h2 className="font-bold text-heading">{summary.roadmap_title}</h2>
                              <span className="rounded-full bg-teal-tint px-2.5 py-1 text-xs font-semibold text-teal-hover">{summary.domain_name}</span>
                            </div>
                            <p className="mt-1 text-xs text-muted">{summary.completed_required_steps} of {summary.total_required_steps} required steps complete</p>
                            <div className="mt-2"><ProgressBar value={percentage} label={`${summary.roadmap_title} completion`} /></div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-teal-hover">{percentage}%</span>
                            {accessibleRoadmap
                              ? <Button to={`/roadmaps/${summary.roadmap_id}`} className="px-3 text-sm">{percentage >= 100 ? 'Review' : 'Continue'}</Button>
                              : <Button to="/profile" variant="secondary" className="px-3 text-sm">Change domain</Button>}
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </section>
              )}
            </>
          )}
    </div>
  )
}

export function ProfilePage() {
  const { user, updateUser } = useAuth()
  const [domains, setDomains] = useState<Domain[]>([])
  const [selectedDomainId, setSelectedDomainId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (user) setSelectedDomainId(String(user.domain.id))
  }, [user])

  useEffect(() => {
    getDomains()
      .then(setDomains)
      .catch((requestError: unknown) => setError(getApiErrorMessage(requestError, 'Unable to load profile settings.')))
      .finally(() => setLoading(false))
  }, [])

  const saveDomain = async () => {
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const updatedUser = await updateMyDomain(Number(selectedDomainId))
      updateUser(updatedUser)
      setMessage('Your learning domain has been updated. Your saved progress is unchanged.')
    } catch (requestError: unknown) {
      setError(getApiErrorMessage(requestError, 'Unable to update your learning domain.'))
    } finally {
      setSaving(false)
    }
  }

  if (!user) return null
  return (
    <div className="mx-auto w-full max-w-4xl">
      <header className="mb-5">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-violet">Account details</p>
        <h1 className="mt-1 text-2xl font-extrabold text-heading sm:text-3xl">Profile</h1>
        <p className="mt-2 text-sm leading-6 text-muted">Your account information and learning preferences.</p>
      </header>
      <Card className="p-5 sm:p-7">
        <div className="grid gap-5 sm:grid-cols-2">
          <div><p className="text-xs font-bold uppercase tracking-wide text-muted">Name</p><p className="mt-1 font-semibold text-heading">{user.name}</p></div>
          <div><p className="text-xs font-bold uppercase tracking-wide text-muted">Email</p><p className="mt-1 break-all font-semibold text-heading">{user.email}</p></div>
          {user.github_username && <div><p className="text-xs font-bold uppercase tracking-wide text-muted">GitHub username</p><p className="mt-1 font-semibold text-heading">{user.github_username}</p></div>}
        </div>
        <div className="mt-6 border-t border-line pt-5">
          <h2 className="font-bold text-heading">Learning domain</h2>
          <p className="mt-1 text-sm text-muted">Changing your focus updates your roadmap list without removing your previous progress.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <Select label="Selected domain" options={domains.map((domain) => ({ value: domain.id, label: domain.name }))} value={selectedDomainId} onChange={(event) => setSelectedDomainId(event.target.value)} disabled={loading || saving || domains.length === 0} helperText={loading ? 'Loading domains…' : undefined} />
            <Button type="button" onClick={saveDomain} disabled={loading || saving || !selectedDomainId || Number(selectedDomainId) === user.domain.id}>{saving ? 'Saving…' : 'Save domain'}</Button>
          </div>
        </div>
        {error && <p role="alert" className="mt-4 rounded-xl border border-coral/40 bg-coral-tint px-4 py-3 text-sm font-semibold text-heading">{error}</p>}
        {message && <p role="status" className="mt-4 rounded-xl border border-teal/20 bg-teal-tint px-4 py-3 text-sm font-semibold text-teal-hover">{message}</p>}
      </Card>
      <p className="mt-4 text-xs leading-5 text-muted">Name and email are shown as read-only because this project does not currently expose a student profile-edit API.</p>
    </div>
  )
}

function LessonInstructions({ content }: { content: string }) {
  const blocks = content.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean)
  return (
    <div className="space-y-4">
      {blocks.map((block, index) => {
        const heading = block.match(/^## ([^\n]+)\n?([\s\S]*)$/)
        const body = heading ? heading[2].trim() : block
        let contentBlock: ReactNode
        if (body.startsWith('```')) {
          return (
            <div key={index}>
              {heading && <h3 className="mb-2 text-base font-bold text-heading">{heading[1]}</h3>}
              <pre className="overflow-x-auto rounded-xl border border-line bg-page p-4 text-sm leading-6 text-heading">
                <code>{body.replace(/^```[^\n]*\n?/, '').replace(/\n?```$/, '')}</code>
              </pre>
            </div>
          )
        }
        const lines = body.split('\n')
        if (lines.every((line) => line.startsWith('- '))) {
          contentBlock = (
            <ul className="list-inside list-disc space-y-1 text-sm leading-6 text-body">
              {lines.map((line, lineIndex) => <li key={`${lineIndex}:${line}`}>{line.slice(2)}</li>)}
            </ul>
          )
        } else {
          contentBlock = <p className="whitespace-pre-line text-sm leading-7 text-body">{body}</p>
        }
        return (
          <div key={index}>
            {heading && <h3 className="mb-2 text-base font-bold text-heading">{heading[1]}</h3>}
            {contentBlock}
          </div>
        )
      })}
    </div>
  )
}

const getLessonSection = (content: string, section: string): string => {
  const match = content.match(new RegExp(`(?:^|\\n)## ${section}\\s*\\n([\\s\\S]*?)(?=\\n## |$)`))
  return match?.[1]?.trim() ?? ''
}

export function RoadmapDetail() {
  const { roadmapId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const numericRoadmapId = Number(roadmapId)
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null)
  const [progress, setProgress] = useState<RoadmapProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [pendingStep, setPendingStep] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    let current = true
    setLoading(true)
    setError('')
    if (!Number.isInteger(numericRoadmapId) || numericRoadmapId < 1) {
      setError('Roadmap not found.')
      setLoading(false)
      return () => { current = false }
    }
    Promise.all([getRoadmap(numericRoadmapId), getRoadmapProgress(numericRoadmapId)])
      .then(([roadmapData, progressData]) => {
        if (current) {
          setRoadmap({ ...roadmapData, steps: progressData.steps })
          setProgress(progressData)
        }
      })
      .catch((requestError: unknown) => {
        if (current) {
          console.error('Unable to load roadmap learning content.', requestError)
          setError(getApiErrorMessage(requestError, 'Unable to load this roadmap. Please try again.'))
        }
      })
      .finally(() => { if (current) setLoading(false) })
    return () => { current = false }
  }, [numericRoadmapId, retryCount])

  const changeCompletion = async (stepId: number, isCompleted: boolean) => {
    setPendingStep(stepId)
    setError('')
    try {
      const authoritativeProgress = await setStepProgress(numericRoadmapId, stepId, isCompleted)
      setProgress(authoritativeProgress)
      setRoadmap((current) => current ? { ...current, steps: authoritativeProgress.steps } : current)
    } catch (requestError: unknown) {
      console.error('Unable to save lesson completion.', requestError)
      setError(
        getApiErrorMessage(requestError, 'Unable to save your progress. Please try again.'),
      )
    } finally {
      setPendingStep(null)
    }
  }

  const beginRoadmap = async () => {
    setStarting(true)
    setError('')
    try {
      const startedProgress = await startRoadmap(numericRoadmapId)
      setProgress(startedProgress)
      setRoadmap((current) => current ? { ...current, steps: startedProgress.steps } : current)
      const firstRequiredStep = startedProgress.steps.find((step) => step.is_required)
      if (firstRequiredStep) setSearchParams({ step: String(firstRequiredStep.id) })
    } catch (requestError: unknown) {
      console.error('Unable to start roadmap.', requestError)
      setError(getApiErrorMessage(requestError, 'Unable to start this roadmap. Please try again.'))
    } finally {
      setStarting(false)
    }
  }

  if (loading) {
    return <div className="mx-auto max-w-7xl py-8 text-muted" role="status">Loading roadmap…</div>
  }
  if (error && !roadmap) {
    return (
      <Card className="mx-auto max-w-3xl p-6" role="alert">
        <h1 className="font-bold text-heading">Roadmap could not be loaded.</h1>
        <p className="mt-2 text-sm text-muted">{error}</p>
        <Button type="button" variant="secondary" className="mt-4" onClick={() => setRetryCount((count) => count + 1)}>Retry</Button>
      </Card>
    )
  }
  if (!roadmap || !progress) {
    return null
  }

  const steps = [...(roadmap.steps ?? [])].sort((left, right) => left.position - right.position)
  const firstIncompleteStep = steps.find((step) => step.is_required && !step.is_completed)
    ?? steps.find((step) => !step.is_completed)
    ?? steps[0]
  const requestedStepId = Number(searchParams.get('step'))
  const currentStep = steps.find((step) => step.id === requestedStepId) ?? firstIncompleteStep
  const currentStepIndex = currentStep ? steps.findIndex((step) => step.id === currentStep.id) : -1
  const isRoadmapComplete = progress.total_required_steps > 0
    && progress.completed_required_steps >= progress.total_required_steps
  const goToStep = (step: RoadmapStep) => setSearchParams({ step: String(step.id) })

  return (
    <div className="mx-auto w-full max-w-7xl">
      <Link to="/roadmaps" className="text-sm font-semibold text-teal-hover hover:text-violet">← Back to roadmaps</Link>
      <Card className="mt-4 p-5 sm:p-7">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span className="rounded-full bg-teal-tint px-3 py-1 text-teal-hover">{roadmap.domain.name}</span>
          {roadmap.difficulty && <span className="rounded-full bg-violet-tint px-3 py-1 capitalize text-violet">{roadmap.difficulty}</span>}
          {roadmap.estimated_hours > 0 && <span className="rounded-full bg-page px-3 py-1 text-muted">{roadmap.estimated_hours} estimated hours</span>}
        </div>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-heading sm:text-3xl">{roadmap.title}</h1>
        <p className="mt-3 whitespace-pre-line leading-7 text-body">{roadmap.description}</p>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex justify-between gap-3 text-sm font-semibold">
              <span className="text-muted">{progress.completed_required_steps} of {progress.total_required_steps} required lessons complete</span>
              <span className="text-teal-hover">{Math.round(progress.progress_percentage)}%</span>
            </div>
            <ProgressBar value={progress.progress_percentage} label={`${roadmap.title} completion`} />
          </div>
          {!progress.is_started ? (
            <Button type="button" onClick={() => void beginRoadmap()} disabled={starting || steps.length === 0} className="w-full sm:w-auto">
              {starting ? 'Starting…' : 'Start Learning'}
            </Button>
          ) : (
            <Button type="button" onClick={() => { if (firstIncompleteStep) goToStep(firstIncompleteStep) }} disabled={!firstIncompleteStep} className="w-full sm:w-auto">
              {isRoadmapComplete ? 'Review Roadmap' : 'Continue Learning'}
            </Button>
          )}
        </div>
      </Card>
      {error && <p role="alert" className="mt-5 rounded-xl border border-coral/40 bg-coral-tint px-4 py-3 text-sm font-semibold text-heading">{error}</p>}
      {steps.length === 0 ? (
        <Card className="mt-5 p-6" role="status">
          <h2 className="font-bold text-heading">Lessons are not available yet.</h2>
          <p className="mt-1 text-sm text-muted">The roadmap administrator needs to add lessons before learning can begin.</p>
        </Card>
      ) : (
        <>
          <details className="mt-5 rounded-2xl border border-line bg-white p-4 lg:hidden">
            <summary className="cursor-pointer font-semibold text-heading">Lessons ({steps.length})</summary>
            <ol className="mt-3 space-y-1">
              {steps.map((step) => (
                <li key={step.id}>
                  <button type="button" aria-current={step.id === currentStep?.id ? 'step' : undefined} onClick={() => goToStep(step)} className={`flex min-h-11 w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal ${step.id === currentStep?.id ? 'bg-teal-tint font-semibold text-teal-hover' : 'text-body hover:bg-page'}`}>
                    <span aria-hidden="true">{step.is_completed ? '✓' : step.position}</span>
                    <span className="min-w-0 flex-1">{step.title}</span>
                  </button>
                </li>
              ))}
            </ol>
          </details>
          <div className="mt-5 grid items-start gap-4 lg:grid-cols-[220px_minmax(0,1fr)_250px]">
            <aside className="sticky top-20 hidden max-h-[calc(100vh-6rem)] overflow-y-auto rounded-2xl border border-line bg-white p-3 lg:block">
              <h2 className="px-2 py-2 text-sm font-bold text-heading">Course lessons</h2>
              <ol className="space-y-1">
                {steps.map((step) => (
                  <li key={step.id}>
                    <button type="button" aria-current={step.id === currentStep?.id ? 'step' : undefined} onClick={() => goToStep(step)} className={`flex min-h-11 w-full items-start gap-2 rounded-lg px-2 py-2 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal ${step.id === currentStep?.id ? 'bg-teal-tint font-semibold text-teal-hover' : 'text-body hover:bg-page'}`}>
                      <span aria-hidden="true" className={step.is_completed ? 'font-bold text-teal-hover' : 'text-muted'}>{step.is_completed ? '✓' : step.position}</span>
                      <span className="min-w-0 flex-1">{step.title}</span>
                    </button>
                  </li>
                ))}
              </ol>
              <div className="mt-4 border-t border-line px-2 pt-3">
                <p className="mb-2 text-xs text-muted">{progress.completed_required_steps} of {progress.total_required_steps} required complete · {Math.round(progress.progress_percentage)}%</p>
                <ProgressBar value={progress.progress_percentage} label={`${roadmap.title} completion`} />
              </div>
            </aside>

            <section id="lesson-content" className="min-w-0" aria-live="polite">
              {currentStep && (
                <Card className="p-5 sm:p-7">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-muted">
                    <span>Lesson {currentStep.position} of {steps.length}</span>
                    {currentStep.estimated_minutes > 0 && <span>· {currentStep.estimated_minutes} min</span>}
                    {!currentStep.is_required && <span className="rounded-full bg-violet-tint px-2.5 py-1 text-violet">Optional</span>}
                  </div>
                  <h2 className="mt-3 text-2xl font-extrabold text-heading">{currentStep.title}</h2>
                  {currentStep.description && !getLessonSection(currentStep.instructions, 'Explanation') && (
                    <p className="mt-3 whitespace-pre-line text-sm leading-7 text-body">{currentStep.description}</p>
                  )}
                  {currentStep.learning_objectives.length > 0 && (
                    <div className="mt-5 rounded-xl bg-teal-tint/60 p-4">
                      <h3 className="text-sm font-bold text-heading">Learning objectives</h3>
                      <ul className="mt-2 list-inside list-disc space-y-1 text-sm leading-6 text-body">
                        {currentStep.learning_objectives.map((objective) => <li key={objective}>{objective}</li>)}
                      </ul>
                    </div>
                  )}
                  <div className="mt-6">
                    <LessonInstructions content={currentStep.instructions || currentStep.description} />
                  </div>
                  <div className="mt-7 flex flex-col gap-2 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <Button type="button" variant="secondary" onClick={() => currentStepIndex > 0 && goToStep(steps[currentStepIndex - 1])} disabled={currentStepIndex <= 0} className="w-full sm:w-auto">Previous Lesson</Button>
                    <Button type="button" onClick={() => void changeCompletion(currentStep.id, !currentStep.is_completed)} disabled={pendingStep === currentStep.id || (!progress.is_started && !currentStep.is_completed)} className="w-full sm:w-auto">
                      {pendingStep === currentStep.id ? 'Saving…' : currentStep.is_completed ? 'Mark as Incomplete' : 'Mark as Complete'}
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => currentStepIndex < steps.length - 1 && goToStep(steps[currentStepIndex + 1])} disabled={currentStepIndex < 0 || currentStepIndex >= steps.length - 1} className="w-full sm:w-auto">Next Lesson</Button>
                  </div>
                </Card>
              )}
            </section>

            <aside className="space-y-4">
              <Card className="p-5">
                <h2 className="font-bold text-heading">Learning resources</h2>
                {currentStep?.resources.length ? (
                  <ul className="mt-3 space-y-3">
                    {currentStep.resources.map((resource) => {
                      const safeUrl = getSafeResourceUrl(resource.url)
                      return (
                        <li key={resource.id}>
                          {safeUrl ? (
                            <a href={safeUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-teal-hover underline decoration-teal/40 underline-offset-4 hover:text-violet focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal">{resource.title}</a>
                          ) : <span className="text-sm font-semibold text-muted">{resource.title} (invalid link)</span>}
                          {resource.description && <p className="mt-1 text-xs leading-5 text-muted">{resource.description}</p>}
                        </li>
                      )
                    })}
                  </ul>
                ) : <p className="mt-2 text-sm text-muted">No resources have been added for this lesson.</p>}
              </Card>
              <Card className="p-5">
                <h2 className="font-bold text-heading">Practical task</h2>
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-body">
                  {getLessonSection(currentStep?.instructions ?? '', 'Practical exercise') || 'Review the lesson and practice the learning objectives.'}
                </p>
              </Card>
              <Card className="p-5">
                <h2 className="font-bold text-heading">Roadmap progress</h2>
                <p className="mt-2 text-sm text-muted">{progress.completed_required_steps} of {progress.total_required_steps} required lessons complete</p>
                <div className="mt-3"><ProgressBar value={progress.progress_percentage} label={`${roadmap.title} completion`} /></div>
              </Card>
            </aside>
          </div>
        </>
      )}
    </div>
  )
}
