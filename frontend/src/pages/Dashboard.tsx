import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { getApiErrorMessage } from '../api/client'
import {
  getDomains,
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
import type { Domain, Roadmap, RoadmapProgress, RoadmapWithProgress } from '../types'

const getSafeResourceUrl = (value: string): string | null => {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null
  } catch {
    return null
  }
}

export default function Dashboard() {
  const { user, updateUser } = useAuth()
  const [domains, setDomains] = useState<Domain[]>([])
  const [domainsLoading, setDomainsLoading] = useState(true)
  const [domainsError, setDomainsError] = useState('')
  const [selectedDomainId, setSelectedDomainId] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [messageIsError, setMessageIsError] = useState(false)
  const [roadmaps, setRoadmaps] = useState<RoadmapWithProgress[]>([])
  const [roadmapsLoading, setRoadmapsLoading] = useState(true)
  const [roadmapsError, setRoadmapsError] = useState('')

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
        setDomainsError(getApiErrorMessage(error, 'Unable to load learning domains. Please refresh and try again.'))
      })
      .finally(() => setDomainsLoading(false))
  }, [])

  useEffect(() => {
    if (!user) return
    let current = true
    setRoadmapsLoading(true)
    setRoadmapsError('')
    setRoadmaps([])
    getRoadmaps()
      .then((items) => {
        if (current) setRoadmaps(items)
      })
      .catch((error: unknown) => {
        console.error('Unable to load roadmaps.', error)
        if (current) setRoadmapsError(getApiErrorMessage(error, 'Unable to load roadmaps right now.'))
      })
      .finally(() => {
        if (current) setRoadmapsLoading(false)
      })
    return () => {
      current = false
    }
  }, [user?.domain.id])

  if (!user) {
    return null
  }

  const activeRoadmaps = roadmaps.filter(
    (roadmap) => roadmap.is_started && roadmap.progress_percentage < 100,
  ).length
  const completedRoadmaps = roadmaps.filter(
    (roadmap) => roadmap.is_started && roadmap.progress_percentage >= 100,
  ).length
  const hasStartedRoadmaps = roadmaps.some((roadmap) => roadmap.is_started)
  const continueRoadmap = roadmaps.find(
    (roadmap) => roadmap.is_started && roadmap.progress_percentage < 100,
  )
  const recommendedRoadmaps = [...roadmaps].sort(
    (left, right) =>
      Number(right.domain_id === user.domain.id) - Number(left.domain_id === user.domain.id),
  )

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
    <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-8 sm:py-7">
      <section className="mb-4 flex flex-col gap-4 overflow-hidden rounded-3xl border border-teal/15 bg-gradient-to-r from-teal-tint via-white to-violet-tint p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-hover">Your learning space</p>
          <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight text-heading sm:text-3xl">
            Welcome, {user.name}
          </h1>
          <p className="mt-1.5 text-sm text-body sm:text-base">Pick up where you left off, or choose a new skill to explore.</p>
        </div>
        <Button to="/dashboard#roadmaps" className="w-full shrink-0 sm:w-auto">
          Explore roadmaps <span aria-hidden="true">→</span>
        </Button>
      </section>

      <section className="grid gap-3 sm:grid-cols-3" aria-label="Learning progress summary">
        <Card className="p-4 sm:p-5">
          <p className="text-xs font-semibold text-muted sm:text-sm">Roadmaps in progress</p>
          <p className="mt-1 text-2xl font-extrabold text-heading">{roadmapsLoading ? '…' : roadmapsError ? '—' : activeRoadmaps}</p>
          {!roadmapsLoading && !roadmapsError && <p className="mt-1 text-xs text-muted">Started and not yet complete</p>}
        </Card>
        <Card className="p-4 sm:p-5">
          <p className="text-xs font-semibold text-muted sm:text-sm">Completed roadmaps</p>
          <p className="mt-1 text-2xl font-extrabold text-heading">{roadmapsLoading ? '…' : roadmapsError ? '—' : completedRoadmaps}</p>
          {!roadmapsLoading && !roadmapsError && <p className="mt-1 text-xs text-muted">Based on required step completion</p>}
        </Card>
        <Card className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-muted sm:text-sm">Your next action</p>
            <p className="mt-1 text-sm font-bold text-heading">
              {roadmapsLoading ? 'Finding your next step…' : roadmapsError ? 'Roadmaps could not be loaded' : continueRoadmap ? 'Continue your current roadmap' : hasStartedRoadmaps ? 'Choose another roadmap to explore' : 'Choose a roadmap to get started'}
            </p>
          </div>
          {continueRoadmap && (
            <Button to={`/roadmaps/${continueRoadmap.id}`} className="shrink-0 px-3 text-xs">
              Continue
            </Button>
          )}
        </Card>
      </section>

      <Card id="learning-focus" className="mt-4 scroll-mt-24 p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(260px,0.85fr)_auto] sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-hover">Learning focus</p>
            <p className="mt-1 text-lg font-bold text-heading">{user.domain.name}</p>
            <p className="mt-1 text-xs text-muted">Only published roadmaps for this domain are shown below.</p>
          </div>
          <Select
            label="Change your domain"
            options={domains.map((domain) => ({ value: domain.id, label: domain.name }))}
            value={selectedDomainId}
            onChange={(event) => setSelectedDomainId(event.target.value)}
            disabled={domainsLoading || domains.length === 0 || isSaving}
            helperText={domainsLoading ? 'Loading learning domains…' : undefined}
          />
          <Button
            type="button"
            onClick={saveDomain}
            disabled={domainsLoading || domains.length === 0 || !selectedDomainId || isSaving || Number(selectedDomainId) === user.domain.id}
          >
            {isSaving ? 'Saving…' : 'Save focus'}
          </Button>
        </div>
        {domainsError && <p role="alert" className="mt-3 rounded-xl border border-coral/40 bg-coral-tint px-4 py-3 text-sm font-semibold text-heading">{domainsError}</p>}
        {message && (
          <p role={messageIsError ? 'alert' : 'status'} className={`mt-3 rounded-xl px-4 py-3 text-sm font-semibold ${messageIsError ? 'border border-coral/40 bg-coral-tint text-heading' : 'border border-teal/20 bg-teal-tint text-teal-hover'}`}>
            {message}
          </p>
        )}
      </Card>

      <section className="mt-6" aria-labelledby="continue-learning-heading">
        <div className="mb-3">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-violet">Pick up where you left off</p>
          <h2 id="continue-learning-heading" className="mt-1 text-xl font-extrabold text-heading sm:text-2xl">Continue learning</h2>
        </div>
        {roadmapsLoading ? (
          <Card className="p-5 text-sm text-muted" role="status">Checking your learning progress…</Card>
        ) : roadmapsError ? (
          <Card className="p-5 text-sm text-heading" role="alert">{roadmapsError}</Card>
        ) : continueRoadmap ? (
          <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="min-w-0">
              <div className="flex flex-wrap gap-2 text-xs font-semibold">
                <span className="rounded-full bg-teal-tint px-3 py-1 text-teal-hover">{continueRoadmap.domain.name}</span>
                <span className="rounded-full bg-violet-tint px-3 py-1 capitalize text-violet">{continueRoadmap.difficulty}</span>
              </div>
              <h3 className="mt-2 text-lg font-bold text-heading">{continueRoadmap.title}</h3>
              <p className="mt-1 text-sm text-muted">{continueRoadmap.completed_required_steps} of {continueRoadmap.total_required_steps} required steps complete</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-teal-tint" role="progressbar" aria-label={`${continueRoadmap.title} completion`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(continueRoadmap.progress_percentage)}>
                <div className="h-full rounded-full bg-gradient-brand" style={{ width: `${continueRoadmap.progress_percentage}%` }} />
              </div>
            </div>
            <Button to={`/roadmaps/${continueRoadmap.id}`} className="w-full shrink-0 sm:w-auto">Continue learning</Button>
          </Card>
        ) : (
          <Card className="flex flex-col items-start gap-4 border-dashed p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <h3 className="font-bold text-heading">{hasStartedRoadmaps ? 'You have completed your started roadmaps.' : 'Your first roadmap is ready when you are.'}</h3>
              <p className="mt-1 text-sm leading-6 text-muted">{hasStartedRoadmaps ? 'Choose another published roadmap when you are ready to continue learning.' : 'Starting a roadmap saves it to your learning space so you can return whenever you like.'}</p>
            </div>
            <Button to="/dashboard#roadmaps" variant="secondary" className="w-full shrink-0 sm:w-auto">Explore roadmaps</Button>
          </Card>
        )}
      </section>

      <section id="roadmaps" className="mt-7 scroll-mt-24" aria-labelledby="roadmaps-heading">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-hover">Choose your next skill</p>
            <h2 id="roadmaps-heading" className="mt-1 text-xl font-extrabold text-heading sm:text-2xl">Recommended roadmaps</h2>
          </div>
          {!roadmapsLoading && !roadmapsError && roadmaps.length > 0 && (
            <p className="text-xs text-muted">{roadmaps.length} published {roadmaps.length === 1 ? 'roadmap' : 'roadmaps'}</p>
          )}
        </div>
        {roadmapsLoading ? (
          <p className="py-5 text-sm text-muted" role="status">Loading published roadmaps…</p>
        ) : roadmapsError ? (
          <Card className="p-5 text-sm text-heading" role="alert">{roadmapsError}</Card>
        ) : roadmaps.length === 0 ? (
          <Card className="flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <h3 className="font-bold text-heading">No roadmaps are available for your selected domain yet.</h3>
              <p className="mt-1 text-sm leading-6 text-muted">Your saved progress is kept if you change domains. You can switch back any time.</p>
            </div>
            <Button to="/dashboard#learning-focus" variant="secondary" className="w-full shrink-0 sm:w-auto">
              Change domain
            </Button>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {recommendedRoadmaps.map((roadmap) => (
              <Card key={roadmap.id} className="flex h-full flex-col p-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-card-hover sm:p-5 motion-reduce:transform-none motion-reduce:transition-none">
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                  <span className="rounded-full bg-teal-tint px-3 py-1 text-teal-hover">{roadmap.domain.name}</span>
                  <span className="rounded-full bg-violet-tint px-3 py-1 capitalize text-violet">{roadmap.difficulty}</span>
                  {roadmap.estimated_hours > 0 && <span className="text-muted">{roadmap.estimated_hours} hr</span>}
                  {roadmap.domain_id === user.domain.id && <span className="rounded-full bg-coral-tint px-3 py-1 text-heading">Your focus</span>}
                </div>
                <h3 className="mt-3 text-lg font-bold text-heading">{roadmap.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm leading-6 text-body">{roadmap.description}</p>
                <p className="mt-2 text-xs text-muted">{roadmap.total_required_steps} required {roadmap.total_required_steps === 1 ? 'step' : 'steps'}</p>
                {roadmap.is_started && (
                  <div className="mt-4">
                    <div className="mb-1.5 flex justify-between text-xs font-semibold">
                      <span className="text-muted">{roadmap.completed_required_steps} of {roadmap.total_required_steps} required complete</span>
                      <span className="text-teal-hover">{Math.round(roadmap.progress_percentage)}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-teal-tint" role="progressbar" aria-label={`${roadmap.title} completion`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(roadmap.progress_percentage)}>
                      <div className="h-full rounded-full bg-gradient-brand" style={{ width: `${roadmap.progress_percentage}%` }} />
                    </div>
                  </div>
                )}
                <Button to={`/roadmaps/${roadmap.id}`} className="mt-4 self-start">
                  {roadmap.progress_percentage >= 100 ? 'Review roadmap' : roadmap.is_started ? 'Continue learning' : 'Start learning'}
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
  const [starting, setStarting] = useState(false)
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

  const beginRoadmap = async () => {
    setStarting(true)
    setError('')
    try {
      const startedProgress = await startRoadmap(numericRoadmapId)
      setProgress(startedProgress)
      setRoadmap((current) => current ? { ...current, steps: startedProgress.steps } : current)
    } catch (requestError: unknown) {
      setError(getApiErrorMessage(requestError, 'Unable to start this roadmap. Please try again.'))
    } finally {
      setStarting(false)
    }
  }

  if (loading) {
    return <div className="mx-auto max-w-5xl px-5 py-8 text-muted" role="status">Loading roadmap…</div>
  }
  if (error && !roadmap) {
    return <div className="mx-auto max-w-5xl px-5 py-8 text-heading" role="alert">{error}</div>
  }
  if (!roadmap || !progress) {
    return null
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-7 sm:px-8 sm:py-9">
      <Link to="/dashboard" className="text-sm font-semibold text-teal-hover hover:text-violet">← Back to dashboard</Link>
      <Card className="mt-4 p-5 sm:p-7">
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded-full bg-teal-tint px-3 py-1 text-teal-hover">{roadmap.domain.name}</span>
          <span className="rounded-full bg-violet-tint px-3 py-1 capitalize text-violet">{roadmap.difficulty}</span>
          {roadmap.estimated_hours > 0 && <span className="rounded-full bg-page px-3 py-1 text-muted">{roadmap.estimated_hours} estimated hours</span>}
        </div>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-heading sm:text-4xl">{roadmap.title}</h1>
        <p className="mt-3 whitespace-pre-line leading-7 text-body">{roadmap.description}</p>
        {!progress.is_started && (
          <div className="mt-5 flex flex-col gap-3 rounded-2xl bg-teal-tint/70 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-6 text-body">Start this roadmap to save it to your learning space and track your progress.</p>
            <Button type="button" onClick={() => void beginRoadmap()} disabled={starting} className="w-full shrink-0 sm:w-auto">
              {starting ? 'Starting…' : 'Start learning'}
            </Button>
          </div>
        )}
        <div className="mt-5">
          <div className="mb-2 flex justify-between text-sm font-semibold">
            <span className="text-muted">
              {progress.completed_required_steps} of {progress.total_required_steps} required steps complete
            </span>
            <span className="text-teal-hover">{Math.round(progress.progress_percentage)}%</span>
          </div>
          <div
            className="h-3 overflow-hidden rounded-full bg-teal-tint"
            role="progressbar"
            aria-label={`${roadmap.title} completion`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress.progress_percentage)}
          >
            <div className="h-full rounded-full bg-gradient-brand transition-all duration-300" style={{ width: `${progress.progress_percentage}%` }} />
          </div>
        </div>
      </Card>
      {error && <p role="alert" className="mt-5 rounded-xl border border-coral/40 bg-coral-tint px-4 py-3 text-sm font-semibold text-heading">{error}</p>}
      <ol className="mt-5 space-y-3" aria-label="Roadmap steps">
        {roadmap.steps?.map((step) => (
          <li key={step.id}>
          <Card className={`p-5 sm:p-6 ${step.is_completed ? 'bg-teal-tint/50' : ''}`}>
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
                          {getSafeResourceUrl(resource.url) ? (
                            <a href={getSafeResourceUrl(resource.url) ?? undefined} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-teal-hover underline decoration-teal/40 underline-offset-4 hover:text-violet">
                              {resource.title}
                            </a>
                          ) : (
                            <span className="text-sm font-semibold text-muted">{resource.title} (invalid link)</span>
                          )}
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
          </li>
        ))}
      </ol>
    </div>
  )
}
