import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { getApiErrorMessage } from '../api/client'
import {
  getDomains,
  getRoadmap,
  getRoadmapProgress,
  getRoadmaps,
  setStepProgress,
  updateMyDomain,
} from '../api/auth'
import { useAuth } from '../context/AuthContext'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Select from '../components/ui/Select'
import type { Domain, Roadmap, RoadmapProgress, RoadmapWithProgress } from '../types'

const sections = [
  { title: 'My Roadmaps', icon: '↗', tint: 'bg-teal-tint text-teal-hover' },
  { title: 'My Projects', icon: '✦', tint: 'bg-violet-tint text-violet' },
]

export default function Dashboard() {
  const { user, updateUser } = useAuth()
  const [domains, setDomains] = useState<Domain[]>([])
  const [selectedDomainId, setSelectedDomainId] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [messageIsError, setMessageIsError] = useState(false)
  const [roadmaps, setRoadmaps] = useState<RoadmapWithProgress[]>([])
  const [roadmapsLoading, setRoadmapsLoading] = useState(true)

  useEffect(() => {
    if (user) {
      setSelectedDomainId(String(user.domain.id))
    }
  }, [user])

  useEffect(() => {
    getDomains()
      .then(setDomains)
      .catch((error: unknown) => {
        console.error('Unable to load learning domains.', error)
        setMessage(
          getApiErrorMessage(error, 'Unable to load learning domains. Please refresh and try again.'),
        )
        setMessageIsError(true)
      })
  }, [])

  useEffect(() => {
    getRoadmaps()
      .then(setRoadmaps)
      .catch((error: unknown) => {
        console.error('Unable to load roadmaps.', error)
        setMessage(getApiErrorMessage(error, 'Unable to load roadmaps right now.'))
        setMessageIsError(true)
      })
      .finally(() => setRoadmapsLoading(false))
  }, [])

  if (!user) {
    return null
  }

  const saveDomain = async () => {
    setIsSaving(true)
    setMessage('')
    setMessageIsError(false)
    try {
      const updatedUser = await updateMyDomain(Number(selectedDomainId))
      updateUser(updatedUser)
      setMessage('Your learning domain has been updated.')
    } catch (error: unknown) {
      setMessage(
        getApiErrorMessage(error, 'Unable to update your learning domain. Please try again.'),
      )
      setMessageIsError(true)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
      <section className="mb-9 overflow-hidden rounded-3xl border border-teal/15 bg-gradient-to-r from-teal-tint via-white to-violet-tint p-6 sm:p-9">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-brand text-xl text-white shadow-lg shadow-violet/20" aria-hidden="true">
          ✦
        </span>
        <p className="mt-5 text-sm font-bold uppercase tracking-[0.14em] text-teal-hover">Your learning space</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-heading sm:text-4xl">
          Welcome, {user.name}
        </h1>
        <p className="mt-3 text-body">{user.email}</p>
      </section>
      <Card className="mb-6 p-6 sm:p-7">
        <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-hover">Your learning focus</p>
            <p className="mt-2 text-lg font-bold text-heading">{user.domain.name}</p>
          </div>
          <div className="flex flex-col gap-3 sm:min-w-80 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <Select
                label="Change your domain"
                options={domains.map((domain) => ({ value: domain.id, label: domain.name }))}
                value={selectedDomainId}
                onChange={(event) => setSelectedDomainId(event.target.value)}
                disabled={domains.length === 0 || isSaving}
              />
            </div>
            <Button
              type="button"
              onClick={saveDomain}
              disabled={domains.length === 0 || !selectedDomainId || isSaving}
            >
              {isSaving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
        {message && (
          <p role={messageIsError ? 'alert' : 'status'} className={`mt-4 rounded-xl px-4 py-3 text-sm font-semibold ${messageIsError ? 'border border-coral/40 bg-coral-tint text-heading' : 'border border-teal/20 bg-teal-tint text-teal-hover'}`}>
            {message}
          </p>
        )}
      </Card>
      <div className="grid gap-5 md:grid-cols-2">
        {sections.map((section) => (
          <Card key={section.title} className="min-h-48 p-6 sm:p-7">
            <div className="flex items-center gap-4">
              <span className={`grid h-12 w-12 place-items-center rounded-2xl text-xl ${section.tint}`} aria-hidden="true">
                {section.icon}
              </span>
              <h2 className="text-lg font-bold text-heading">{section.title}</h2>
            </div>
            <div className="mt-6 grid min-h-24 place-items-center rounded-xl border border-dashed border-line bg-page px-4 text-center">
              <p className="text-sm leading-6 text-muted">Your {section.title.toLowerCase()} will appear here.</p>
            </div>
          </Card>
        ))}
      </div>
      <section className="mt-12">
        <div className="mb-5">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-teal-hover">Keep your momentum</p>
          <h2 className="mt-2 text-2xl font-extrabold text-heading">Learning roadmaps</h2>
        </div>
        {roadmapsLoading ? (
          <p className="py-8 text-sm text-muted" role="status">Loading roadmaps…</p>
        ) : roadmaps.length === 0 ? (
          <Card className="p-6 text-sm text-muted">
            There are no published roadmaps yet. Check back soon.
          </Card>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {roadmaps.map((roadmap) => (
              <Card key={roadmap.id} className="p-6 transition hover:-translate-y-1">
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-teal-hover">
                  <span className="rounded-full bg-teal-tint px-3 py-1">{roadmap.domain.name}</span>
                  <span className="rounded-full bg-violet-tint px-3 py-1 capitalize text-violet">{roadmap.difficulty}</span>
                  <span className="text-muted">{roadmap.estimated_hours} hr</span>
                </div>
                <h3 className="mt-4 text-lg font-bold text-heading">{roadmap.title}</h3>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-body">{roadmap.description}</p>
                <div className="mt-5">
                  <div className="mb-2 flex justify-between text-xs font-semibold">
                    <span className="text-muted">
                      {roadmap.completed_required_steps} of {roadmap.total_required_steps} required steps
                    </span>
                    <span className="text-teal-hover">{Math.round(roadmap.progress_percentage)}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-teal-tint">
                    <div className="h-full rounded-full bg-gradient-brand" style={{ width: `${roadmap.progress_percentage}%` }} />
                  </div>
                </div>
                <Button to={`/roadmaps/${roadmap.id}`} className="mt-5">
                  {roadmap.progress_percentage > 0 ? 'Continue learning' : 'View roadmap'}
                </Button>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export function RoadmapDetail() {
  const { roadmapId } = useParams()
  const numericRoadmapId = Number(roadmapId)
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null)
  const [progress, setProgress] = useState<RoadmapProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [pendingStep, setPendingStep] = useState<number | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!Number.isInteger(numericRoadmapId) || numericRoadmapId < 1) {
      setError('Roadmap not found.')
      setLoading(false)
      return
    }
    Promise.all([getRoadmap(numericRoadmapId), getRoadmapProgress(numericRoadmapId)])
      .then(([roadmapData, progressData]) => {
        setRoadmap({ ...roadmapData, steps: progressData.steps })
        setProgress(progressData)
      })
      .catch((requestError: unknown) => {
        setError(getApiErrorMessage(requestError, 'Unable to load this roadmap. Please try again.'))
      })
      .finally(() => setLoading(false))
  }, [numericRoadmapId])

  const changeCompletion = async (stepId: number, isCompleted: boolean) => {
    setPendingStep(stepId)
    setError('')
    try {
      const authoritativeProgress = await setStepProgress(numericRoadmapId, stepId, isCompleted)
      setProgress(authoritativeProgress)
      setRoadmap((current) => current ? { ...current, steps: authoritativeProgress.steps } : current)
    } catch (requestError: unknown) {
      setError(
        getApiErrorMessage(requestError, 'Unable to save your progress. Please try again.'),
      )
    } finally {
      setPendingStep(null)
    }
  }

  if (loading) {
    return <div className="mx-auto max-w-5xl px-5 py-16 text-muted" role="status">Loading roadmap…</div>
  }
  if (error && !roadmap) {
    return <div className="mx-auto max-w-5xl px-5 py-16 text-heading" role="alert">{error}</div>
  }
  if (!roadmap || !progress) {
    return null
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
      <Link to="/dashboard" className="text-sm font-semibold text-teal-hover hover:text-violet">← Back to dashboard</Link>
      <Card className="mt-5 p-6 sm:p-9">
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded-full bg-teal-tint px-3 py-1 text-teal-hover">{roadmap.domain.name}</span>
          <span className="rounded-full bg-violet-tint px-3 py-1 capitalize text-violet">{roadmap.difficulty}</span>
          <span className="rounded-full bg-page px-3 py-1 text-muted">{roadmap.estimated_hours} estimated hours</span>
        </div>
        <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-heading sm:text-4xl">{roadmap.title}</h1>
        <p className="mt-4 whitespace-pre-line leading-7 text-body">{roadmap.description}</p>
        <div className="mt-7">
          <div className="mb-2 flex justify-between text-sm font-semibold">
            <span className="text-muted">
              {progress.completed_required_steps} of {progress.total_required_steps} required steps complete
            </span>
            <span className="text-teal-hover">{Math.round(progress.progress_percentage)}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-teal-tint">
            <div className="h-full rounded-full bg-gradient-brand transition-all duration-300" style={{ width: `${progress.progress_percentage}%` }} />
          </div>
        </div>
      </Card>
      {error && <p role="alert" className="mt-5 rounded-xl border border-coral/40 bg-coral-tint px-4 py-3 text-sm font-semibold text-heading">{error}</p>}
      <div className="mt-7 space-y-4">
        {roadmap.steps?.map((step) => (
          <Card key={step.id} className={`p-5 sm:p-6 ${step.is_completed ? 'bg-teal-tint/50' : ''}`}>
            <div className="flex items-start gap-4">
              <input
                type="checkbox"
                checked={step.is_completed}
                disabled={pendingStep === step.id}
                onChange={(event) => void changeCompletion(step.id, event.target.checked)}
                aria-label={`Mark ${step.title} ${step.is_completed ? 'incomplete' : 'complete'}`}
                className="mt-1 h-5 w-5 shrink-0 accent-teal"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className={`text-lg font-bold ${step.is_completed ? 'text-teal-hover' : 'text-heading'}`}>
                    {step.position}. {step.title}
                  </h2>
                  {!step.is_required && <span className="rounded-full bg-violet-tint px-2.5 py-1 text-xs font-semibold text-violet">Optional</span>}
                  {step.estimated_minutes > 0 && <span className="text-xs text-muted">{step.estimated_minutes} min</span>}
                </div>
                {step.description && <p className="mt-2 whitespace-pre-line text-sm leading-6 text-body">{step.description}</p>}
                {step.instructions && <p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted">{step.instructions}</p>}
                {step.learning_objectives.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-xs font-bold uppercase tracking-wide text-teal-hover">Learning objectives</h3>
                    <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-body">
                      {step.learning_objectives.map((objective) => <li key={objective}>{objective}</li>)}
                    </ul>
                  </div>
                )}
                {step.resources.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-xs font-bold uppercase tracking-wide text-violet">Resources</h3>
                    <ul className="mt-2 space-y-2">
                      {step.resources.map((resource) => (
                        <li key={resource.id}>
                          <a href={resource.url} target="_blank" rel="noreferrer" className="text-sm font-semibold text-teal-hover underline decoration-teal/40 underline-offset-4 hover:text-violet">
                            {resource.title}
                          </a>
                          <span className="ml-2 text-xs capitalize text-muted">{resource.resource_type}{resource.is_recommended ? ' · Recommended' : ''}</span>
                          {resource.description && <p className="mt-1 text-xs text-muted">{resource.description}</p>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
