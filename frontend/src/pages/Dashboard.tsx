import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, NavLink, Outlet, useMatch, useParams, useSearchParams } from 'react-router-dom'

import { getApiErrorMessage } from '../api/client'
import {
  getDomains,
  getLearningResources,
  getMyLearningSummary,
  getMyRoadmapProgress,
  getRoadmap,
  getRoadmapProgress,
  getRoadmaps,
  startRoadmap,
  setStepProgress,
  updateMyDomain,
  updateMyProfile,
} from '../api/auth'
import { useAuth } from '../context/AuthContext'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Select from '../components/ui/Select'
import type {
  Domain,
  Difficulty,
  LearningSummary,
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
type SidebarMode = 'expanded' | 'collapsed' | 'hidden'

const studentSidebarPreferenceKey = 'devpath.student.sidebar'

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
  const learningWorkspace = Boolean(useMatch('/roadmaps/:roadmapId'))
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [sidebarMode, setSidebarModeState] = useState<SidebarMode>(() => {
    const saved = window.localStorage.getItem(studentSidebarPreferenceKey)
    return saved === 'collapsed' || saved === 'hidden' ? saved : 'expanded'
  })
  const setSidebarMode = useCallback((mode: SidebarMode) => {
    window.localStorage.setItem(studentSidebarPreferenceKey, mode)
    setSidebarModeState(mode)
  }, [])
  useEffect(() => {
    if (!learningWorkspace) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previousOverflow }
  }, [learningWorkspace])
  const initials = user?.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'S'
  const closeDrawer = () => setDrawerOpen(false)

  return (
    <div className={learningWorkspace ? 'fixed inset-0 z-40 flex h-dvh min-h-0 flex-col overflow-hidden bg-page' : 'flex min-h-screen flex-col bg-page'}>
      {!learningWorkspace && <header className="sticky top-0 z-30 border-b border-line/80 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex h-[4.5rem] w-full max-w-[1600px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label={window.matchMedia('(min-width: 1024px)').matches
                ? sidebarMode === 'expanded' ? 'Collapse sidebar' : 'Expand sidebar'
                : drawerOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={drawerOpen}
              title={window.matchMedia('(min-width: 1024px)').matches
                ? sidebarMode === 'expanded' ? 'Collapse sidebar' : 'Expand sidebar'
                : drawerOpen ? 'Close menu' : 'Open menu'}
              onClick={() => {
                if (window.matchMedia('(min-width: 1024px)').matches) {
                  setSidebarMode(sidebarMode === 'expanded' ? 'collapsed' : 'expanded')
                } else {
                  if (sidebarMode === 'hidden') setSidebarMode('expanded')
                  setDrawerOpen((open) => !open)
                }
              }}
              className="rounded-lg p-2 text-heading hover:bg-teal-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal lg:hidden"
            >
              <span aria-hidden="true" className="text-xl leading-none">{drawerOpen ? '×' : '☰'}</span>
            </button>
            <button
              type="button"
              aria-label={sidebarMode === 'expanded' ? 'Collapse sidebar' : 'Expand sidebar'}
              title={sidebarMode === 'expanded' ? 'Collapse sidebar' : 'Expand sidebar'}
              onClick={() => setSidebarMode(sidebarMode === 'expanded' ? 'collapsed' : 'expanded')}
              className="hidden rounded-lg p-2 text-heading hover:bg-teal-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal lg:inline-flex"
            >
              <span aria-hidden="true" className="text-lg leading-none">☷</span>
            </button>
            <Link to="/dashboard" className="rounded-sm text-xl font-extrabold tracking-tight text-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal">
              DevPath<span className="text-gradient">.</span>
            </Link>
            <span className="hidden border-l border-line pl-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted sm:block">Learning space</span>
          </div>
          {user && (
            <details className="relative">
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl p-1.5 text-left hover:bg-page focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-brand text-sm font-bold text-white shadow-sm">{initials}</span>
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
      </header>}
      <div className={`relative mx-auto flex w-full max-w-[1600px] flex-1 ${learningWorkspace ? 'min-h-0 max-w-none overflow-hidden' : ''}`}>
        {!learningWorkspace && drawerOpen && <button type="button" aria-label="Close navigation menu" className="fixed inset-0 z-30 bg-heading/20 lg:hidden" onClick={closeDrawer} />}
        {!learningWorkspace && sidebarMode !== 'hidden' && <aside className={`${drawerOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-[4.5rem] left-0 z-40 flex w-72 flex-col border-r border-line/80 bg-white p-4 shadow-xl transition-all duration-200 lg:sticky lg:top-[4.5rem] lg:z-10 lg:h-[calc(100vh-4.5rem)] lg:translate-x-0 lg:border-r-0 lg:bg-transparent lg:shadow-none motion-reduce:transition-none ${sidebarMode === 'collapsed' ? 'lg:w-[4.75rem] lg:px-2 lg:py-5' : 'lg:w-64 lg:p-5'}`}>
          <div className={`mb-5 rounded-2xl border border-line/80 bg-white p-3 shadow-card ${sidebarMode === 'collapsed' ? 'lg:flex lg:justify-center lg:border-transparent lg:bg-transparent lg:p-1 lg:shadow-none' : ''}`}>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-brand text-sm font-extrabold text-white" title={sidebarMode === 'collapsed' ? user?.name : undefined}>{initials}</span>
              <div className={`min-w-0 ${sidebarMode === 'collapsed' ? 'lg:hidden' : ''}`}>
                <p className="truncate text-sm font-bold text-heading">{user?.name}</p>
                <p className="mt-0.5 text-xs text-muted">Student account</p>
              </div>
            </div>
            {user?.domain?.name && sidebarMode !== 'collapsed' && <p className="mt-3 truncate rounded-lg bg-teal-tint px-3 py-2 text-xs font-semibold text-teal-hover">Focus · {user.domain.name}</p>}
          </div>
          <p className={`px-3 pb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-muted ${sidebarMode === 'collapsed' ? 'lg:sr-only' : ''}`}>Workspace</p>
          <nav aria-label="Student navigation" className="space-y-1">
            {studentNavigation.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={closeDrawer}
                title={sidebarMode === 'collapsed' ? item.label : undefined}
                aria-label={sidebarMode === 'collapsed' ? item.label : undefined}
                className={({ isActive }) => `group flex min-h-10 items-center gap-3 rounded-xl border px-3 py-2 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal ${sidebarMode === 'collapsed' ? 'lg:justify-center lg:px-2' : ''} ${isActive ? 'border-teal/15 bg-teal-tint text-teal-hover shadow-sm' : 'border-transparent text-body hover:border-line hover:bg-white hover:text-heading'}`}
              >
                <StudentIcon name={item.icon} />
                <span className={sidebarMode === 'collapsed' ? 'lg:hidden' : ''}>{item.label}</span>
              </NavLink>
            ))}
          </nav>
          <div className={`mt-7 rounded-2xl border border-teal/15 bg-gradient-to-br from-white via-teal-tint to-violet-tint p-4 shadow-card ${sidebarMode === 'collapsed' ? 'lg:hidden' : ''}`}>
            <span className="inline-flex rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-teal-hover">Keep going</span>
            <p className="mt-2 text-sm font-bold text-heading">Small steps add up</p>
            <p className="mt-1 text-xs leading-5 text-muted">Choose a path and return whenever you are ready to learn.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSidebarMode('hidden')
              closeDrawer()
            }}
            className="mb-2 hidden min-h-10 items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-muted transition-colors hover:bg-page hover:text-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal lg:flex"
          >
            <span aria-hidden="true" className="text-lg leading-none">←</span>
            <span className={sidebarMode === 'collapsed' ? 'lg:hidden' : ''}>Hide sidebar</span>
          </button>
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
        </aside>}
        <main id="student-main" className={learningWorkspace
          ? 'relative h-full min-h-0 min-w-0 flex-1 overflow-hidden bg-page p-0'
          : 'relative min-w-0 flex-1 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-violet-tint/35 via-page to-page px-4 pb-10 pt-5 sm:px-6 sm:pb-12 sm:pt-7 lg:px-8 lg:pt-7'}>
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
  const lessonCount = roadmap.steps?.length ?? totalRequiredSteps
  const progressPercentage = Number.isFinite(roadmap.progress_percentage)
    ? Math.max(0, Math.min(100, roadmap.progress_percentage))
    : null

  return (
    <Card className="flex h-full flex-col p-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-card-hover motion-reduce:transform-none motion-reduce:transition-none sm:p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          {domainName && <span className="rounded-full bg-teal-tint px-2.5 py-1 text-teal-hover">{domainName}</span>}
          {roadmap.difficulty && <span className="rounded-full bg-violet-tint px-2.5 py-1 capitalize text-violet">{roadmap.difficulty}</span>}
          {estimatedHours !== null && <span className="text-muted">{estimatedHours} hr</span>}
        </div>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-teal-tint to-violet-tint text-teal-hover" aria-hidden="true">
          <StudentIcon name="roadmaps" />
        </span>
      </div>
      <h2 className="mt-2.5 text-base font-bold leading-snug text-heading">{roadmap.title}</h2>
      {description && <p className="mt-1.5 flex-1 text-[13px] leading-5 text-body">{description}</p>}
      {lessonCount !== null && lessonCount !== undefined && (
        <p className="mt-3 text-xs text-muted">{lessonCount} {lessonCount === 1 ? 'lesson' : 'lessons'}</p>
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

    void getRoadmaps({ domain_id: user.domain.id })
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
  const continueRoadmap = selectedDomainRoadmaps.find((roadmap) => roadmap.is_started && roadmap.progress_percentage < 100)
  const totalRequiredSteps = progressSummaries.reduce((total, summary) => total + summary.total_required_steps, 0)
  const totalCompletedSteps = progressSummaries.reduce((total, summary) => total + summary.completed_required_steps, 0)
  const overallProgress = totalRequiredSteps ? Math.round((totalCompletedSteps / totalRequiredSteps) * 100) : 0
  return (
    <div className="mx-auto w-full max-w-7xl">
      <section className="relative mb-6 flex flex-col gap-5 overflow-hidden rounded-3xl border border-teal/15 bg-gradient-to-r from-teal-tint via-white to-violet-tint p-5 shadow-soft sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <span aria-hidden="true" className="pointer-events-none absolute -right-8 -top-16 h-52 w-52 rounded-full border-[24px] border-white/50" />
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-hover">Your learning space</p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-heading sm:text-3xl">Welcome back, {user.name}</h1>
          <p className="mt-1.5 text-sm text-body sm:text-base">Keep building your skills, one focused step at a time.</p>
          <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/80 px-3 py-1.5 text-xs font-semibold text-violet shadow-sm">
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-teal" />
            Current focus: {user.domain.name}
          </p>
        </div>
        <Button to="/roadmaps" className="relative w-full shrink-0 sm:w-auto">Explore roadmaps <span aria-hidden="true">→</span></Button>
      </section>

      <section className="grid gap-3 sm:grid-cols-3" aria-label="Learning progress summary">
        {[
          { label: 'Roadmaps in progress', value: activeRoadmaps, detail: 'Started and not yet complete', icon: 'roadmaps' as const },
          { label: 'Completed roadmaps', value: completedRoadmaps, detail: 'Required steps completed', icon: 'progress' as const },
          { label: 'Overall progress', value: `${overallProgress}%`, detail: totalRequiredSteps ? `${totalCompletedSteps} of ${totalRequiredSteps} required steps complete` : 'No started roadmaps yet', icon: 'dashboard' as const },
        ].map((stat) => (
          <Card key={stat.label} className="group relative flex items-start gap-4 overflow-hidden p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover sm:p-5">
            <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-gradient-brand opacity-70" />
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-tint to-violet-tint text-teal-hover transition-transform group-hover:scale-105"><StudentIcon name={stat.icon} /></span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-muted sm:text-sm">{stat.label}</p>
              <p className="mt-1 text-2xl font-extrabold tracking-tight text-heading">{progressLoading ? '…' : progressError ? '—' : stat.value}</p>
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
      <div className="mt-8">
        <section aria-labelledby="continue-learning-heading">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-violet">
              {continueRoadmap ? 'Pick up where you left off' : 'Find your next learning path'}
            </p>
            <h2 id="continue-learning-heading" className="mt-1.5 text-xl font-extrabold tracking-tight text-heading sm:text-2xl">
              {continueRoadmap ? 'Continue learning' : 'Available roadmaps'}
            </h2>
            </div>
            <Link to="/roadmaps" className="text-sm font-semibold text-teal-hover underline decoration-teal/40 underline-offset-4 hover:decoration-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal">
              View all paths <span aria-hidden="true">→</span>
            </Link>
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
              <h3 className="font-bold text-heading">No published roadmaps are available for {user.domain.name}.</h3>
              <p className="mt-1 text-sm leading-6 text-muted">You can explore published roadmaps in other domains or update your learning focus.</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button to="/roadmaps" variant="secondary">Explore all roadmaps</Button>
                <Button to="/profile" variant="ghost">Update learning focus</Button>
              </div>
            </Card>
          ) : (
            <>
              {completedRoadmaps > 0 && (
                <p className="mb-4 text-sm text-muted">Your started roadmaps are complete. Choose another path to keep learning.</p>
              )}
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {selectedDomainRoadmaps.slice(0, 3).map((roadmap) => (
                  <RoadmapCard key={roadmap.id} roadmap={roadmap} />
                ))}
              </div>
              {selectedDomainRoadmaps.length > 3 && (
                <div className="mt-4">
                  <Button to={`/roadmaps?domain_id=${user.domain.id}`} variant="secondary">Browse all {selectedDomainRoadmaps.length} roadmaps</Button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  )
}

export function RoadmapsPage() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [roadmaps, setRoadmaps] = useState<RoadmapWithProgress[]>([])
  const [search, setSearch] = useState('')
  const [sortOrder, setSortOrder] = useState<'default' | 'difficulty' | 'duration'>('default')
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | Difficulty>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retryCount, setRetryCount] = useState(0)
  const roadmapRequestRef = useRef<{ key: string; promise: Promise<RoadmapWithProgress[]> } | null>(null)
  const domainParam = searchParams.get('domain_id')
  const parsedDomainId = domainParam ? Number(domainParam) : Number.NaN
  const selectedDomain =
    Number.isSafeInteger(parsedDomainId) && parsedDomainId > 0 ? parsedDomainId : null

  const setDomainFilter = (domainId: number | null) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      if (domainId === null) next.delete('domain_id')
      else next.set('domain_id', String(domainId))
      return next
    })
  }

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
  const filtered = useMemo(() => roadmaps.filter((roadmap) => {
    const description = typeof roadmap.description === 'string' ? roadmap.description : ''
    const matchesSearch = `${roadmap.title} ${description}`.toLowerCase().includes(normalizedSearch)
    const matchesDomain = selectedDomain === null || roadmap.domain_id === selectedDomain
    const matchesDifficulty = difficultyFilter === 'all' || roadmap.difficulty === difficultyFilter
    return matchesSearch && matchesDomain && matchesDifficulty
  }), [roadmaps, normalizedSearch, selectedDomain, difficultyFilter])
  const difficultyRank: Record<RoadmapWithProgress['difficulty'], number> = {
    beginner: 0,
    intermediate: 1,
    advanced: 2,
  }
  const sortedRoadmaps = useMemo(() => {
    const sorted = [...filtered]
    if (sortOrder === 'difficulty') {
      sorted.sort((left, right) => difficultyRank[left.difficulty] - difficultyRank[right.difficulty])
    } else if (sortOrder === 'duration') {
      sorted.sort((left, right) => {
        const leftDuration = left.estimated_hours > 0 ? left.estimated_hours : Number.POSITIVE_INFINITY
        const rightDuration = right.estimated_hours > 0 ? right.estimated_hours : Number.POSITIVE_INFINITY
        return leftDuration - rightDuration
      })
    }
    return sorted
  }, [filtered, sortOrder])
  const hasActiveFilters = Boolean(search.trim()) || selectedDomain !== null || difficultyFilter !== 'all' || sortOrder !== 'default'
  const clearFilters = () => {
    setSearch('')
    setDomainFilter(null)
    setDifficultyFilter('all')
    setSortOrder('default')
  }

  return (
    <div className="mx-auto w-full max-w-7xl">
      <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-teal-hover">Explore your learning path</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-heading">Learning Roadmaps</h1>
          <p className="mt-1 text-sm leading-5 text-muted">Follow structured learning paths and build practical skills.</p>
        </div>
        {!loading && !error && <p className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-muted shadow-card" aria-live="polite">{filtered.length} {filtered.length === 1 ? 'roadmap' : 'roadmaps'}</p>}
      </header>
      {!loading && !error && roadmaps.length > 0 && (
        <section className="mb-4 rounded-2xl border border-line/80 bg-white p-3 shadow-card sm:p-4" aria-label="Roadmap filters">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_minmax(160px,0.7fr)_minmax(150px,0.6fr)_minmax(150px,0.6fr)_auto] sm:items-end">
            <label className="block text-xs font-semibold text-heading">
              Search
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by title or description"
                className="mt-1 w-full rounded-lg border border-line bg-page/50 px-3 py-2 text-sm font-normal text-body outline-none focus:border-teal focus:ring-4 focus:ring-teal/15"
              />
            </label>
            <label className="block text-xs font-semibold text-heading">
              Domain
              <select value={selectedDomain ?? ''} onChange={(event) => setDomainFilter(event.target.value ? Number(event.target.value) : null)} className="mt-1 min-h-10 w-full rounded-lg border border-line bg-page/50 px-3 py-2 text-sm font-normal text-body outline-none focus:border-teal focus:ring-4 focus:ring-teal/15">
                <option value="">All domains</option>
                {domains.map(([domainId, domainName]) => <option key={domainId} value={domainId}>{domainName}</option>)}
              </select>
            </label>
            <label className="block text-xs font-semibold text-heading">
              Difficulty
              <select value={difficultyFilter} onChange={(event) => {
                const value = event.target.value
                if (value === 'all' || value === 'beginner' || value === 'intermediate' || value === 'advanced') setDifficultyFilter(value)
              }} className="mt-1 min-h-10 w-full rounded-lg border border-line bg-page/50 px-3 py-2 text-sm font-normal text-body outline-none focus:border-teal focus:ring-4 focus:ring-teal/15">
                <option value="all">All levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </label>
            <label className="block text-xs font-semibold text-heading">
              Sort by
              <select
                value={sortOrder}
                onChange={(event) => {
                  const value = event.target.value
                  if (value === 'default' || value === 'difficulty' || value === 'duration') {
                    setSortOrder(value)
                  }
                }}
                className="mt-1 min-h-10 w-full rounded-lg border border-line bg-page/50 px-3 py-2 text-sm font-normal text-body outline-none focus:border-teal focus:ring-4 focus:ring-teal/15"
              >
                <option value="default">Recommended order</option>
                <option value="difficulty">Beginner to advanced</option>
                <option value="duration">Shortest to longest</option>
              </select>
            </label>
            {hasActiveFilters && (
              <Button type="button" variant="secondary" className="w-full px-3 sm:w-auto" onClick={clearFilters}>
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
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{sortedRoadmaps.map((roadmap) => <RoadmapCard key={roadmap.id} roadmap={roadmap} />)}</div>
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
      <header className="mb-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-violet">Study materials</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-heading">Learning Resources</h1>
        <p className="mt-1.5 text-sm leading-5 text-muted">Materials connected to published roadmaps in {user?.domain.name}.</p>
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
                <Card key={roadmap.id} className="p-4">
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
  const [summary, setSummary] = useState<LearningSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let current = true
    setLoading(true)
    setError('')
    setSummary(null)
    getMyLearningSummary()
      .then((data) => {
        if (current) setSummary(data)
      })
      .catch((requestError: unknown) => { if (current) setError(getApiErrorMessage(requestError, 'Unable to load your progress.')) })
      .finally(() => { if (current) setLoading(false) })
    return () => { current = false }
  }, [user?.id])
  const activityDateSet = new Set(summary?.activity_dates ?? [])
  const todayUtc = new Date().toISOString().slice(0, 10)
  const calendarDays = Array.from({ length: 30 }, (_, index) => {
    const day = new Date()
    day.setUTCHours(0, 0, 0, 0)
    day.setUTCDate(day.getUTCDate() - (29 - index))
    return day.toISOString().slice(0, 10)
  })
  const formatActivityDate = (value: string) => new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
  const formatUtcDay = (value: string, options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(undefined, {
    ...options,
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00Z`))

  return (
    <div className="mx-auto w-full max-w-7xl">
      <header className="mb-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-teal-hover">Your learning history</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-heading">My Progress</h1>
        <p className="mt-1.5 text-sm leading-5 text-muted">Track your learning journey, celebrate milestones, and see how far you've come.</p>
      </header>
      {loading ? <Card role="status" className="p-4 text-sm text-muted">Loading your learning analytics…</Card>
        : error || !summary ? <Card role="alert" className="p-4 text-sm text-heading">{error || 'Learning analytics are unavailable.'}</Card>
          : (
            <div className="space-y-5">
              <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6" aria-label="Learning statistics">
                {[
                  ['Roadmaps started', summary.roadmaps_started],
                  ['Roadmaps completed', summary.roadmaps_completed],
                  ['Lessons completed', summary.lessons_completed],
                  ['Overall progress', `${Math.round(summary.overall_progress)}%`],
                  ['Current streak', `${summary.current_streak} days`],
                  ['Active days', summary.active_days],
                ].map(([label, value]) => (
                  <Card key={String(label)} className="p-3.5">
                    <p className="text-xs font-semibold text-muted">{label}</p>
                    <p className="mt-1 text-2xl font-extrabold tracking-tight text-heading">{value}</p>
                  </Card>
                ))}
              </section>

              <section aria-labelledby="learning-roadmaps-heading">
                <div className="mb-3 flex items-end justify-between gap-3">
                  <div>
                    <h2 id="learning-roadmaps-heading" className="text-lg font-extrabold text-heading">Your Learning Roadmaps</h2>
                    <p className="mt-0.5 text-xs text-muted">Roadmaps with recorded learning activity.</p>
                  </div>
                </div>
                {summary.roadmaps.length === 0 ? (
                  <Card className="p-4">
                    <h3 className="font-bold text-heading">Your learning progress will show here.</h3>
                    <p className="mt-1 text-sm text-muted">Start a published roadmap to track completed lessons and progress.</p>
                    <Button to="/roadmaps" className="mt-3">Explore roadmaps</Button>
                  </Card>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    {summary.roadmaps.map((roadmap) => {
                      const completed = roadmap.progress_percentage >= 100
                      return (
                        <Card key={roadmap.roadmap_id} className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="font-bold leading-snug text-heading">{roadmap.roadmap_title}</h3>
                              <p className="mt-1 text-xs text-muted">{roadmap.domain_name} · <span className="capitalize">{roadmap.difficulty}</span></p>
                            </div>
                            <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${completed ? 'bg-teal-tint text-teal-hover' : 'bg-violet-tint text-violet'}`}>{completed ? 'Completed' : 'In progress'}</span>
                          </div>
                          <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted">
                            <span>{roadmap.completed_required_steps} of {roadmap.total_required_steps} required lessons</span>
                            <span className="font-bold text-teal-hover">{Math.round(roadmap.progress_percentage)}%</span>
                          </div>
                          <div className="mt-1.5"><ProgressBar value={roadmap.progress_percentage} label={`${roadmap.roadmap_title} completion`} /></div>
                          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                            <span className="text-[11px] text-muted">{roadmap.last_activity_at ? `Last activity ${formatActivityDate(roadmap.last_activity_at)}` : 'No completed lesson yet'}</span>
                            <Button to={`/roadmaps/${roadmap.roadmap_id}`} variant={completed ? 'secondary' : 'primary'} className="min-h-9 px-3 text-xs">{completed ? 'Review Roadmap' : 'Continue Learning'}</Button>
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </section>

              <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
                <section aria-labelledby="recent-activity-heading">
                  <h2 id="recent-activity-heading" className="mb-3 text-lg font-extrabold text-heading">Recent Activity</h2>
                  <Card className="p-4">
                    {summary.recent_activity.length ? (
                      <ol className="divide-y divide-line">
                        {summary.recent_activity.slice(0, 10).map((activity) => (
                          <li key={`${activity.step_id}-${activity.occurred_at}`} className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                            <div className="flex min-w-0 gap-2.5">
                              <span aria-hidden="true" className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-teal-tint text-xs font-bold text-teal-hover">✓</span>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-heading">Completed {activity.step_title}</p>
                                <p className="truncate text-xs text-muted">{activity.roadmap_title}</p>
                              </div>
                            </div>
                            <time className="shrink-0 text-[11px] text-muted" dateTime={activity.occurred_at}>{formatActivityDate(activity.occurred_at)}</time>
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p className="text-sm text-muted">Completed lessons will appear here. Starting a roadmap alone does not count as a learning streak day.</p>
                    )}
                  </Card>
                </section>

                <section aria-labelledby="achievements-heading">
                  <h2 id="achievements-heading" className="mb-3 text-lg font-extrabold text-heading">Achievements</h2>
                  <Card className="p-4">
                    {summary.achievements.length ? (
                      <ul className="space-y-3">
                        {summary.achievements.map((achievement) => (
                          <li key={achievement.key} className="flex items-start gap-3">
                            <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-teal-tint to-violet-tint text-sm font-bold text-violet">✦</span>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-heading">{achievement.name}</p>
                              <p className="text-xs leading-5 text-muted">{achievement.description} · Earned {formatUtcDay(achievement.earned_at, { dateStyle: 'medium' })}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : <p className="text-sm text-muted">Achievements appear when their activity-based criteria are met.</p>}
                  </Card>
                </section>
              </div>

              <section aria-labelledby="activity-calendar-heading">
                <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <h2 id="activity-calendar-heading" className="text-lg font-extrabold text-heading">Learning Activity</h2>
                    <p className="mt-0.5 text-xs text-muted">Last 30 days · {summary.active_days} active days total · UTC calendar</p>
                  </div>
                  <p className="text-[11px] text-muted">Each square is one calendar day</p>
                </div>
                <Card className="p-4">
                  <div className="grid grid-cols-6 gap-2 sm:grid-cols-10 md:grid-cols-15" role="img" aria-label="Learning activity for the last 30 UTC calendar days">
                    {calendarDays.map((day) => {
                      const active = activityDateSet.has(day)
                      return <span key={day} title={`${formatUtcDay(day, { dateStyle: 'medium' })}${active ? ' · Learning activity' : ' · No activity'}`} className={`aspect-square min-h-7 rounded-md border ${active ? 'border-teal/30 bg-teal' : day === todayUtc ? 'border-violet/40 bg-violet-tint' : 'border-line bg-page'}`} />
                    })}
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-[11px] text-muted"><span className="h-3 w-3 rounded-sm bg-teal" /> Activity <span className="ml-2 h-3 w-3 rounded-sm border border-line bg-page" /> No activity <span className="ml-2 h-3 w-3 rounded-sm border border-violet/40 bg-violet-tint" /> Today</div>
                </Card>
              </section>
            </div>
          )}
    </div>
  )
}

export function ProfilePage() {
  const { user, updateUser } = useAuth()
  const [domains, setDomains] = useState<Domain[]>([])
  const [learningSummary, setLearningSummary] = useState<LearningSummary | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [selectedDomainId, setSelectedDomainId] = useState('')
  const [profileName, setProfileName] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingDomain, setSavingDomain] = useState(false)
  const [error, setError] = useState('')
  const [streakError, setStreakError] = useState('')
  const [domainError, setDomainError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (user) {
      setSelectedDomainId(String(user.domain.id))
      setProfileName(user.name)
    }
  }, [user])

  useEffect(() => {
    let current = true
    setProfileLoading(true)
    setStreakError('')
    setLearningSummary(null)
    getMyLearningSummary()
      .then((summary) => { if (current) setLearningSummary(summary) })
      .catch((requestError: unknown) => {
        if (current) setStreakError(getApiErrorMessage(requestError, 'Unable to load your learning streak.'))
      })
      .finally(() => { if (current) setProfileLoading(false) })
    return () => { current = false }
  }, [user?.id])

  useEffect(() => {
    let current = true
    setDomainError('')
    getDomains()
      .then((items) => { if (current) setDomains(items) })
      .catch((requestError: unknown) => {
        if (current) setDomainError(getApiErrorMessage(requestError, 'Unable to load learning domains.'))
      })
    return () => { current = false }
  }, [])

  const saveProfileName = async () => {
    const normalizedName = profileName.trim()
    if (!normalizedName) {
      setError('Name cannot be blank.')
      return
    }
    setSavingProfile(true)
    setError('')
    setMessage('')
    try {
      const updatedUser = await updateMyProfile(normalizedName)
      updateUser(updatedUser)
      setProfileName(updatedUser.name)
      setEditingName(false)
      setMessage('Your profile name has been updated.')
    } catch (requestError: unknown) {
      setError(getApiErrorMessage(requestError, 'Unable to update your profile.'))
    } finally {
      setSavingProfile(false)
    }
  }

  const saveDomain = async () => {
    setSavingDomain(true)
    setError('')
    setMessage('')
    try {
      const updatedUser = await updateMyDomain(Number(selectedDomainId))
      updateUser(updatedUser)
      setMessage('Your learning domain has been updated. Your saved progress is unchanged.')
    } catch (requestError: unknown) {
      setError(getApiErrorMessage(requestError, 'Unable to update your learning domain.'))
    } finally {
      setSavingDomain(false)
    }
  }

  if (!user) return null
  const initials = user.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'S'
  const localDayFormat = (day: string, options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(undefined, {
    ...options,
    timeZone: 'UTC',
  }).format(new Date(`${day}T00:00:00Z`))
  const today = new Date().toISOString().slice(0, 10)
  const activityDays = new Set(learningSummary?.activity_dates ?? [])
  const recentSevenDays = Array.from({ length: 7 }, (_, index) => {
    const day = new Date()
    day.setUTCHours(0, 0, 0, 0)
    day.setUTCDate(day.getUTCDate() - (6 - index))
    const dateKey = day.toISOString().slice(0, 10)
    return { dateKey, active: activityDays.has(dateKey), isToday: dateKey === today }
  })
  return (
    <div className="mx-auto w-full max-w-4xl">
      <header className="mb-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-violet">Your account</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-heading">Profile</h1>
        <p className="mt-1.5 text-sm leading-5 text-muted">Personal information, learning preferences, and consistency.</p>
      </header>
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-teal-tint via-white to-violet-tint p-4 sm:p-5">
          <div className="flex min-w-0 items-center gap-3">
            <span aria-hidden="true" className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-brand text-base font-extrabold text-white">{initials}</span>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-extrabold text-heading">{user.name}</h2>
              <p className="truncate text-sm text-muted">{user.email}</p>
            </div>
          </div>
          <span className="rounded-full border border-white/80 bg-white/75 px-3 py-1 text-xs font-semibold text-violet">Student</span>
        </div>
        <div className="p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-bold text-heading">Personal information</h2>
            {!editingName && <Button type="button" variant="secondary" className="min-h-9 px-3 text-xs" onClick={() => { setProfileName(user.name); setEditingName(true); setError(''); setMessage('') }}>Edit profile</Button>}
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted">Full name</p>
              {editingName ? (
                <div className="mt-1.5 space-y-2">
                  <input aria-label="Full name" value={profileName} maxLength={120} onChange={(event) => setProfileName(event.target.value)} className="min-h-10 w-full rounded-lg border border-line px-3 py-2 text-sm text-heading outline-none focus:border-teal focus:ring-4 focus:ring-teal/15" />
                  <div className="flex gap-2">
                    <Button type="button" className="min-h-9 px-3 text-xs" onClick={() => void saveProfileName()} disabled={savingProfile}>{savingProfile ? 'Saving…' : 'Save changes'}</Button>
                    <Button type="button" variant="ghost" className="min-h-9 px-3 text-xs" onClick={() => { setEditingName(false); setProfileName(user.name); setError('') }} disabled={savingProfile}>Cancel</Button>
                  </div>
                </div>
              ) : <p className="mt-1 text-sm font-semibold text-heading">{user.name}</p>}
            </div>
            <div><p className="text-[11px] font-bold uppercase tracking-wide text-muted">Email</p><p className="mt-1 break-all text-sm font-semibold text-heading">{user.email}</p></div>
            {user.github_username && <div><p className="text-[11px] font-bold uppercase tracking-wide text-muted">GitHub username</p><p className="mt-1 text-sm font-semibold text-heading">{user.github_username}</p></div>}
            <div><p className="text-[11px] font-bold uppercase tracking-wide text-muted">Member since</p><p className="mt-1 text-sm font-semibold text-heading">{new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(user.created_at))}</p></div>
          </div>
          <div className="mt-5 border-t border-line pt-4">
            <h2 className="font-bold text-heading">Learning preference</h2>
            <p className="mt-1 text-xs text-muted">Change your focus without affecting saved progress.</p>
            {domainError ? <p role="alert" className="mt-3 text-sm text-coral">{domainError}</p> : (
              <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                <Select label="Selected domain" options={domains.map((domain) => ({ value: domain.id, label: domain.name }))} value={selectedDomainId} onChange={(event) => setSelectedDomainId(event.target.value)} disabled={savingDomain || domains.length === 0} />
                <Button type="button" onClick={saveDomain} disabled={savingDomain || !selectedDomainId || Number(selectedDomainId) === user.domain.id}>{savingDomain ? 'Saving…' : 'Save domain'}</Button>
              </div>
            )}
          </div>
        </div>
      </Card>
      <section className="mt-5" aria-labelledby="learning-streak-heading">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="learning-streak-heading" className="text-lg font-extrabold text-heading">Your Learning Streak</h2>
            <p className="mt-0.5 text-xs text-muted">A day counts when you complete a lesson · UTC calendar</p>
          </div>
        </div>
        {profileLoading ? <Card role="status" className="p-4 text-sm text-muted">Loading your streak…</Card>
          : streakError || !learningSummary ? <Card role="alert" className="p-4 text-sm text-heading">{streakError || 'Learning streak data is unavailable.'}</Card>
            : (
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-[1.2fr_0.8fr]">
                  <Card className="flex items-center gap-4 bg-gradient-to-r from-white to-coral-tint p-4">
                    <span aria-hidden="true" className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white text-2xl shadow-card">🔥</span>
                    <div>
                      <p className="text-xs font-semibold text-muted">Current streak</p>
                      <p className="text-2xl font-extrabold tracking-tight text-heading">{learningSummary.current_streak} {learningSummary.current_streak === 1 ? 'day' : 'days'}</p>
                      <p className="text-xs text-muted">{learningSummary.has_activity_today ? 'You have learned today. Keep it going!' : 'Complete a lesson today to keep your streak going.'}</p>
                    </div>
                  </Card>
                  <Card className="flex items-center justify-between gap-3 p-4">
                    <div>
                      <p className="text-xs font-semibold text-muted">Longest streak</p>
                      <p className="mt-1 text-2xl font-extrabold text-heading">{learningSummary.longest_streak} {learningSummary.longest_streak === 1 ? 'day' : 'days'}</p>
                    </div>
                    <span className="rounded-full bg-violet-tint px-3 py-1.5 text-xs font-bold text-violet">{learningSummary.active_days} active {learningSummary.active_days === 1 ? 'day' : 'days'}</span>
                  </Card>
                </div>
                <Card className="p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="text-sm font-bold text-heading">Last seven days</h3>
                    <span className="text-[11px] text-muted">Qualifying lesson completions</span>
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {recentSevenDays.map(({ dateKey, active, isToday }) => (
                      <div key={dateKey} className="flex min-w-0 flex-col items-center gap-1.5">
                        <span className="text-[10px] font-semibold text-muted">{localDayFormat(dateKey, { weekday: 'short' })}</span>
                        <span title={`${localDayFormat(dateKey, { dateStyle: 'medium' })}${active ? ' · Activity completed' : ' · No activity'}`} className={`grid h-8 w-8 place-items-center rounded-lg border text-xs font-bold ${active ? 'border-teal bg-teal text-white' : isToday ? 'border-violet/40 bg-violet-tint text-violet' : 'border-line bg-page text-muted'}`}>{active ? '✓' : localDayFormat(dateKey, { day: 'numeric' })}</span>
                        {isToday && <span className="text-[9px] font-semibold text-violet">Today</span>}
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}
      </section>
      {error && <p role="alert" className="mt-4 rounded-xl border border-coral/40 bg-coral-tint px-4 py-3 text-sm font-semibold text-heading">{error}</p>}
      {message && <p role="status" className="mt-4 rounded-xl border border-teal/20 bg-teal-tint px-4 py-3 text-sm font-semibold text-teal-hover">{message}</p>}
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
  const [focusMode, setFocusMode] = useState(false)
  const [roadmapPanelOpen, setRoadmapPanelOpen] = useState(false)
  const [infoPanelOpen, setInfoPanelOpen] = useState(false)
  const [showRoadmapPanel, setShowRoadmapPanel] = useState(true)
  const [showInfoPanel, setShowInfoPanel] = useState(true)
  const previousPanelVisibility = useRef({ roadmap: true, info: true })
  const lessonScrollRef = useRef<HTMLElement>(null)
  const currentStepParam = searchParams.get('step')

  useEffect(() => {
    if (lessonScrollRef.current) lessonScrollRef.current.scrollTop = 0
  }, [currentStepParam])

  const toggleFocusMode = () => {
    if (focusMode) {
      setShowRoadmapPanel(previousPanelVisibility.current.roadmap)
      setShowInfoPanel(previousPanelVisibility.current.info)
      setFocusMode(false)
      return
    }
    previousPanelVisibility.current = { roadmap: showRoadmapPanel, info: showInfoPanel }
    setRoadmapPanelOpen(false)
    setInfoPanelOpen(false)
    setShowRoadmapPanel(false)
    setShowInfoPanel(false)
    setFocusMode(true)
  }

  useEffect(() => {
    if (!focusMode) return
    const exitOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') toggleFocusMode()
    }
    window.addEventListener('keydown', exitOnEscape)
    return () => window.removeEventListener('keydown', exitOnEscape)
  }, [focusMode, showInfoPanel, showRoadmapPanel])

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
  const goToStep = (step: RoadmapStep) => setSearchParams({ step: String(step.id) })
  const isDesktopViewport = window.matchMedia('(min-width: 1024px)').matches
  const isWideViewport = window.matchMedia('(min-width: 1280px)').matches

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-page">
      <header className="z-20 flex min-h-[3.5rem] shrink-0 items-center justify-between gap-2 border-b border-line bg-white px-2.5 shadow-sm sm:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            aria-label={isDesktopViewport
              ? showRoadmapPanel ? 'Hide roadmap lessons' : 'Show roadmap lessons'
              : roadmapPanelOpen ? 'Close lesson menu' : 'Open lesson menu'}
            title={isDesktopViewport
              ? showRoadmapPanel ? 'Hide roadmap lessons' : 'Show roadmap lessons'
              : roadmapPanelOpen ? 'Close lesson menu' : 'Open lesson menu'}
            onClick={() => {
              if (isDesktopViewport) setShowRoadmapPanel((visible) => !visible)
              else {
                setShowRoadmapPanel(true)
                setRoadmapPanelOpen((open) => !open)
                setInfoPanelOpen(false)
              }
            }}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line text-heading hover:bg-teal-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
          >
            <span aria-hidden="true">☷</span>
          </button>
          <Link to="/roadmaps" aria-label="Back to roadmaps" className="hidden h-9 w-9 shrink-0 place-items-center rounded-lg border border-line text-heading hover:bg-teal-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal sm:grid">
            <span aria-hidden="true">←</span>
          </Link>
          <div className="min-w-0">
            <p className="truncate text-[11px] font-medium text-muted">{roadmap.domain.name} · {roadmap.title}</p>
            <p className="truncate text-sm font-bold text-heading">{currentStep ? `Lesson ${currentStep.position}: ${currentStep.title}` : 'Learning workspace'}</p>
          </div>
        </div>
        <div className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">
          <div className="hidden w-24 items-center gap-2 sm:flex md:w-32">
            <ProgressBar value={progress.progress_percentage} label={`${roadmap.title} completion`} />
            <span className="text-xs font-bold text-teal-hover">{Math.round(progress.progress_percentage)}%</span>
          </div>
          {!progress.is_started && (
            <Button type="button" className="min-h-9 px-3 text-xs" onClick={() => void beginRoadmap()} disabled={starting || steps.length === 0}>
              {starting ? 'Starting…' : 'Start'}
            </Button>
          )}
          <button
            type="button"
            aria-label={isWideViewport
              ? showInfoPanel ? 'Hide learning information' : 'Show learning information'
              : infoPanelOpen ? 'Close information panel' : 'Open information panel'}
            title={isWideViewport
              ? showInfoPanel ? 'Hide learning information' : 'Show learning information'
              : infoPanelOpen ? 'Close information panel' : 'Open information panel'}
            onClick={() => {
              if (isWideViewport) setShowInfoPanel((visible) => !visible)
              else {
                setShowInfoPanel(true)
                setInfoPanelOpen((open) => !open)
                setRoadmapPanelOpen(false)
              }
            }}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line text-heading hover:bg-teal-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
          >
            <span aria-hidden="true">ⓘ</span>
          </button>
          <Button type="button" variant="secondary" className="min-h-9 px-2.5 text-xs sm:px-3" onClick={toggleFocusMode}>
            {focusMode ? 'Exit focus' : <><span aria-hidden="true">⛶</span><span className="hidden sm:inline">Focus</span></>}
          </Button>
        </div>
      </header>

      {error && <p role="alert" className="z-10 shrink-0 border-b border-coral/30 bg-coral-tint px-4 py-2 text-xs font-semibold text-heading">{error}</p>}
      {loading ? (
        <div className="grid min-h-0 flex-1 place-items-center text-sm text-muted" role="status">Loading roadmap…</div>
      ) : steps.length === 0 ? (
        <div className="grid min-h-0 flex-1 place-items-center p-5">
          <Card className="max-w-lg p-5" role="status">
            <h2 className="font-bold text-heading">Lessons are not available yet.</h2>
            <p className="mt-1 text-sm text-muted">The roadmap administrator needs to add lessons before learning can begin.</p>
          </Card>
        </div>
      ) : (
        <div className="relative flex min-h-0 flex-1 overflow-hidden">
          {(roadmapPanelOpen || infoPanelOpen) && (
            <button
              type="button"
              aria-label="Close learning panel"
              onClick={() => { setRoadmapPanelOpen(false); setInfoPanelOpen(false) }}
              className="absolute inset-0 z-20 bg-heading/20 xl:hidden"
            />
          )}
          {showRoadmapPanel && (
            <aside className={`${roadmapPanelOpen ? 'translate-x-0' : '-translate-x-full'} absolute inset-y-0 left-0 z-30 flex w-[min(86vw,290px)] shrink-0 flex-col border-r border-line bg-white shadow-xl transition-transform duration-200 motion-reduce:transition-none lg:relative lg:z-auto lg:w-[250px] lg:translate-x-0 lg:shadow-none`}>
              <div className="shrink-0 border-b border-line px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-teal-hover">{roadmap.domain.name}</p>
                    <h1 className="mt-1 line-clamp-2 text-sm font-bold leading-5 text-heading">{roadmap.title}</h1>
                  </div>
                  <button type="button" onClick={() => { setShowRoadmapPanel(false); setRoadmapPanelOpen(false) }} aria-label="Hide roadmap panel" title="Hide roadmap panel" className="hidden h-8 w-8 shrink-0 place-items-center rounded-lg text-muted hover:bg-page hover:text-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal lg:grid">‹</button>
                  <button type="button" onClick={() => setRoadmapPanelOpen(false)} aria-label="Close lessons menu" className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted hover:bg-page lg:hidden">×</button>
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-muted">
                  <span>{progress.completed_required_steps} of {progress.total_required_steps} lessons</span>
                  <span className="text-teal-hover">{Math.round(progress.progress_percentage)}%</span>
                </div>
                <div className="mt-1.5"><ProgressBar value={progress.progress_percentage} label={`${roadmap.title} completion`} /></div>
              </div>
              <nav aria-label="Roadmap lessons" className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2.5">
                <ol className="space-y-1">
                  {steps.map((step) => (
                    <li key={step.id}>
                      <button
                        type="button"
                        aria-current={step.id === currentStep?.id ? 'step' : undefined}
                        onClick={() => { goToStep(step); setRoadmapPanelOpen(false) }}
                        className={`flex min-h-10 w-full items-start gap-2.5 rounded-lg border-l-2 px-2.5 py-2 text-left text-xs leading-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal ${step.id === currentStep?.id ? 'border-teal bg-teal-tint font-semibold text-teal-hover' : 'border-transparent text-body hover:bg-page'}`}
                      >
                        <span aria-hidden="true" className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-bold ${step.is_completed ? 'bg-teal-tint text-teal-hover' : step.id === currentStep?.id ? 'bg-white text-teal-hover' : 'bg-page text-muted'}`}>{step.is_completed ? '✓' : step.position}</span>
                        <span className={step.is_completed ? 'min-w-0 flex-1 text-muted' : 'min-w-0 flex-1'}>{step.title}</span>
                      </button>
                    </li>
                  ))}
                </ol>
              </nav>
              <div className="shrink-0 border-t border-line px-4 py-2.5">
                <p className="text-[11px] text-muted">{progress.completed_required_steps} of {progress.total_required_steps} required complete</p>
              </div>
            </aside>
          )}

          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <section ref={lessonScrollRef} id="lesson-content" className="min-h-0 flex-1 overflow-y-auto overscroll-contain scroll-smooth px-3 py-4 sm:px-5 sm:py-5" aria-live="polite">
              {currentStep && (
                <article className="mx-auto w-full max-w-4xl">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-muted">
                    <span>Lesson {currentStep.position} of {steps.length}</span>
                    {currentStep.estimated_minutes > 0 && <span>· {currentStep.estimated_minutes} min</span>}
                    {!currentStep.is_required && <span className="rounded-full bg-violet-tint px-2.5 py-1 text-violet">Optional</span>}
                    {currentStep.is_completed && <span className="rounded-full bg-teal-tint px-2.5 py-1 text-teal-hover">Completed</span>}
                  </div>
                  <h2 className="mt-2 text-2xl font-extrabold leading-tight tracking-tight text-heading sm:text-3xl">{currentStep.title}</h2>
                  {currentStep.description && !getLessonSection(currentStep.instructions, 'Explanation') && (
                    <p className="mt-3 whitespace-pre-line text-sm leading-6 text-body sm:text-[15px] sm:leading-7">{currentStep.description}</p>
                  )}
                  {currentStep.learning_objectives.length > 0 && (
                    <div className="mt-5 rounded-xl border border-teal/10 bg-white p-4">
                      <h3 className="text-sm font-bold text-heading">Learning objectives</h3>
                      <ul className="mt-2 list-inside list-disc space-y-1 text-sm leading-6 text-body">
                        {currentStep.learning_objectives.map((objective) => <li key={objective}>{objective}</li>)}
                      </ul>
                    </div>
                  )}
                  <div className="mt-5 overflow-hidden">
                    <LessonInstructions content={currentStep.instructions || currentStep.description} />
                  </div>
                </article>
              )}
            </section>
            <footer className="z-10 flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-line bg-white px-3 py-2.5 sm:px-5">
              <Button type="button" variant="secondary" onClick={() => currentStepIndex > 0 && goToStep(steps[currentStepIndex - 1])} disabled={currentStepIndex <= 0} className="min-h-9 px-3 text-xs">Previous</Button>
              <Button type="button" onClick={() => currentStep && void changeCompletion(currentStep.id, !currentStep.is_completed)} disabled={!currentStep || pendingStep === currentStep.id || (!progress.is_started && !currentStep.is_completed)} className="min-h-9 px-3 text-xs sm:px-4">
                {pendingStep === currentStep?.id ? 'Saving…' : currentStep?.is_completed ? 'Mark as Incomplete' : 'Mark as Complete'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => currentStepIndex >= 0 && currentStepIndex < steps.length - 1 && goToStep(steps[currentStepIndex + 1])} disabled={currentStepIndex < 0 || currentStepIndex >= steps.length - 1} className="min-h-9 px-3 text-xs">Next lesson</Button>
            </footer>
          </div>

          {showInfoPanel && (
            <aside className={`${infoPanelOpen ? 'translate-x-0' : 'translate-x-full'} absolute inset-y-0 right-0 z-30 flex w-[min(86vw,300px)] shrink-0 flex-col border-l border-line bg-white shadow-xl transition-transform duration-200 motion-reduce:transition-none xl:relative xl:z-auto xl:w-[270px] xl:translate-x-0 xl:shadow-none`}>
              <div className="flex shrink-0 items-center justify-between border-b border-line px-4 py-3">
                <div>
                  <h2 className="text-sm font-bold text-heading">Learning assistant</h2>
                  <p className="mt-0.5 text-[11px] text-muted">Lesson details and resources</p>
                </div>
                <button type="button" onClick={() => { setShowInfoPanel(false); setInfoPanelOpen(false) }} aria-label="Hide learning information panel" title="Hide information panel" className="hidden h-8 w-8 place-items-center rounded-lg text-muted hover:bg-page hover:text-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal xl:grid">›</button>
                <button type="button" onClick={() => setInfoPanelOpen(false)} aria-label="Close information panel" className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-page xl:hidden">×</button>
              </div>
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-3">
                <section className="rounded-xl border border-line p-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xs font-bold text-heading">Roadmap progress</h3>
                    <span className="text-xs font-bold text-teal-hover">{Math.round(progress.progress_percentage)}%</span>
                  </div>
                  <p className="mt-1.5 text-[11px] text-muted">{progress.completed_required_steps} of {progress.total_required_steps} required lessons complete</p>
                  <div className="mt-2"><ProgressBar value={progress.progress_percentage} label={`${roadmap.title} completion`} /></div>
                </section>
                {currentStep?.estimated_minutes ? (
                  <section className="rounded-xl border border-line p-3">
                    <h3 className="text-xs font-bold text-heading">Estimated time</h3>
                    <p className="mt-1 text-xs text-muted">{currentStep.estimated_minutes} minutes</p>
                  </section>
                ) : null}
                {currentStep?.learning_objectives.length ? (
                  <section className="rounded-xl border border-line p-3">
                    <h3 className="text-xs font-bold text-heading">Key objectives</h3>
                    <ul className="mt-2 space-y-2 text-xs leading-5 text-body">
                      {currentStep.learning_objectives.map((objective) => <li key={objective} className="flex gap-2"><span aria-hidden="true" className="text-teal-hover">•</span><span>{objective}</span></li>)}
                    </ul>
                  </section>
                ) : null}
                {getLessonSection(currentStep?.instructions ?? '', 'Practical exercise') && (
                  <section className="rounded-xl border border-line bg-page/60 p-3">
                    <h3 className="text-xs font-bold text-heading">Practical task</h3>
                    <p className="mt-2 whitespace-pre-line text-xs leading-5 text-body">{getLessonSection(currentStep?.instructions ?? '', 'Practical exercise')}</p>
                  </section>
                )}
                <section className="rounded-xl border border-line p-3">
                  <h3 className="text-xs font-bold text-heading">Resources</h3>
                  {currentStep?.resources.length ? (
                    <ul className="mt-2 space-y-3">
                      {currentStep.resources.map((resource) => {
                        const safeUrl = getSafeResourceUrl(resource.url)
                        return (
                          <li key={resource.id}>
                            {safeUrl ? (
                              <a href={safeUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-teal-hover underline decoration-teal/40 underline-offset-4 hover:text-violet focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal">{resource.title}<span className="sr-only"> (opens in a new tab)</span></a>
                            ) : <span className="text-xs font-semibold text-muted">{resource.title} (invalid link)</span>}
                            {resource.description && <p className="mt-1 text-[11px] leading-4 text-muted">{resource.description}</p>}
                          </li>
                        )
                      })}
                    </ul>
                  ) : <p className="mt-1.5 text-xs text-muted">No resources for this lesson.</p>}
                </section>
              </div>
            </aside>
          )}
        </div>
      )}
    </div>
  )
}
