import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import { getApiErrorMessage } from '../api/client'
import {
  createAdminDomain,
  createAdminResource,
  createAdminRoadmap,
  createAdminStep,
  deleteAdminDomain,
  deleteAdminResource,
  deleteAdminRoadmap,
  deleteAdminStep,
  getAdminDomains,
  getAdminRoadmaps,
  getAdminStatistics,
  getAdminStudent,
  getAdminStudents,
  reorderAdminResources,
  reorderAdminSteps,
  updateAdminDomain,
  updateAdminResource,
  updateAdminRoadmap,
  updateAdminStep,
  updateAdminStudent,
} from '../api/auth'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import { useAdminAuth } from '../context/AdminAuthContext'
import type {
  AdminStatistics,
  Domain,
  DomainPayload,
  ResourcePayload,
  Roadmap,
  RoadmapPayload,
  RoadmapStepPayload,
  Student,
  StudentDetail,
  StudentPage,
} from '../types'

type AdminSection = 'overview' | 'domains' | 'roadmaps' | 'students'
type AsyncAction = () => Promise<void>

const defaultDomainForm: DomainPayload = {
  name: '',
  slug: '',
  description: '',
  is_active: true,
  display_order: 0,
}

const defaultRoadmapForm = (domainId = 0): RoadmapPayload => ({
  domain_id: domainId,
  title: '',
  slug: '',
  description: '',
  difficulty: 'beginner',
  estimated_hours: 1,
  display_order: 0,
  is_published: false,
  is_archived: false,
})

const defaultStepForm = (position = 1): RoadmapStepPayload => ({
  title: '',
  description: '',
  instructions: '',
  learning_objectives: [],
  position,
  estimated_minutes: 30,
  is_required: true,
})

const defaultResourceForm: ResourcePayload = {
  title: '',
  url: '',
  description: '',
  resource_type: 'documentation',
  is_recommended: false,
  display_order: 0,
}

export default function AdminDashboard() {
  const { admin, logout } = useAdminAuth()
  const navigate = useNavigate()
  const [section, setSection] = useState<AdminSection>('overview')
  const [statistics, setStatistics] = useState<AdminStatistics | null>(null)
  const [domains, setDomains] = useState<Domain[]>([])
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([])
  const [students, setStudents] = useState<StudentPage | null>(null)
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null)
  const [selectedRoadmap, setSelectedRoadmap] = useState<number | null>(null)
  const [selectedStudent, setSelectedStudent] = useState<StudentDetail | null>(null)
  const [domainForm, setDomainForm] = useState<DomainPayload>(defaultDomainForm)
  const [roadmapForm, setRoadmapForm] = useState<RoadmapPayload>(defaultRoadmapForm())
  const [stepForm, setStepForm] = useState<RoadmapStepPayload>(defaultStepForm())
  const [resourceForm, setResourceForm] = useState<ResourcePayload>(defaultResourceForm)
  const [selectedStepId, setSelectedStepId] = useState<number | null>(null)
  const [editingStepId, setEditingStepId] = useState<number | null>(null)
  const [stepTargetRoadmapId, setStepTargetRoadmapId] = useState<number | null>(null)
  const [editingResourceId, setEditingResourceId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const refreshCore = async () => {
    const [nextStatistics, nextDomains, nextRoadmaps] = await Promise.all([
      getAdminStatistics(),
      getAdminDomains(),
      getAdminRoadmaps(),
    ])
    setStatistics(nextStatistics)
    setDomains(nextDomains)
    setRoadmaps(nextRoadmaps)
  }

  useEffect(() => {
    refreshCore()
      .catch((requestError: unknown) =>
        setError(getApiErrorMessage(requestError, 'The request could not be completed.')),
      )
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (section !== 'students') return
    getAdminStudents(search, page)
      .then(setStudents)
      .catch((requestError: unknown) =>
        setError(getApiErrorMessage(requestError, 'The request could not be completed.')),
      )
  }, [section, search, page])

  const runAction = async (action: AsyncAction, successMessage: string) => {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await action()
      setNotice(successMessage)
    } catch (requestError: unknown) {
      setError(getApiErrorMessage(requestError, 'The request could not be completed.'))
    } finally {
      setBusy(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/admin/login', { replace: true })
  }

  const submitDomain = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await runAction(async () => {
      if (selectedDomain) await updateAdminDomain(selectedDomain.id, domainForm)
      else await createAdminDomain(domainForm)
      setSelectedDomain(null)
      setDomainForm(defaultDomainForm)
      await refreshCore()
    }, selectedDomain ? 'Domain updated.' : 'Domain created.')
  }

  const editDomain = (domain: Domain) => {
    setSelectedDomain(domain)
    setDomainForm({
      name: domain.name,
      slug: domain.slug ?? '',
      description: domain.description ?? '',
      is_active: domain.is_active ?? true,
      display_order: domain.display_order ?? 0,
    })
  }

  const submitRoadmap = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await runAction(async () => {
      if (selectedRoadmap !== null) await updateAdminRoadmap(selectedRoadmap, roadmapForm)
      else await createAdminRoadmap(roadmapForm)
      setSelectedRoadmap(null)
      setRoadmapForm(defaultRoadmapForm(domains[0]?.id ?? 0))
      await refreshCore()
    }, selectedRoadmap !== null ? 'Roadmap updated.' : 'Roadmap created.')
  }

  const loadStudents = async () => {
    const result = await getAdminStudents(search, page)
    setStudents(result)
  }

  const selectStudent = async (student: Student) => {
    await runAction(async () => setSelectedStudent(await getAdminStudent(student.id)), '')
  }

  const saveStudent = async (payload: { name?: string; domain_id?: number; is_active?: boolean }) => {
    if (!selectedStudent) return
    await runAction(async () => {
      await updateAdminStudent(selectedStudent.id, payload)
      setSelectedStudent(await getAdminStudent(selectedStudent.id))
      await loadStudents()
    }, 'Student profile updated.')
  }

  const submitStep = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (selectedRoadmap === null) return
    await runAction(async () => {
      if (editingStepId !== null) {
        await updateAdminStep(editingStepId, {
          ...stepForm,
          roadmap_id: stepTargetRoadmapId ?? selectedRoadmap,
        })
      }
      else await createAdminStep(selectedRoadmap, stepForm)
      setEditingStepId(null)
      setStepForm(defaultStepForm(stepForm.position + 1))
      await refreshCore()
    }, editingStepId === null ? 'Roadmap step created.' : 'Roadmap step updated.')
  }

  const submitResource = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (selectedStepId === null) return
    await runAction(async () => {
      if (editingResourceId !== null) await updateAdminResource(editingResourceId, resourceForm)
      else await createAdminResource(selectedStepId, resourceForm)
      setEditingResourceId(null)
      setResourceForm(defaultResourceForm)
      await refreshCore()
    }, editingResourceId === null ? 'Learning resource added.' : 'Resource updated.')
  }

  const stepOrder = async (roadmap: Roadmap, stepId: number, direction: -1 | 1) => {
    const steps = [...(roadmap.steps ?? [])].sort((left, right) => left.position - right.position)
    const currentIndex = steps.findIndex((step) => step.id === stepId)
    const targetIndex = currentIndex + direction
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= steps.length) return
    ;[steps[currentIndex], steps[targetIndex]] = [steps[targetIndex], steps[currentIndex]]
    await runAction(async () => {
      await reorderAdminSteps(roadmap.id, steps.map((step) => step.id))
      await refreshCore()
    }, 'Step order updated.')
  }

  const resourceOrder = async (stepId: number, resourceIds: number[]) => {
    await runAction(async () => {
      await reorderAdminResources(stepId, resourceIds)
      await refreshCore()
    }, 'Resource order updated.')
  }

  const beginRoadmapEdit = (roadmap: Roadmap) => {
    setSelectedRoadmap(roadmap.id)
    setRoadmapForm({
      domain_id: roadmap.domain_id,
      title: roadmap.title,
      slug: roadmap.slug,
      description: roadmap.description,
      difficulty: roadmap.difficulty,
      estimated_hours: roadmap.estimated_hours,
      display_order: roadmap.display_order,
      is_published: roadmap.is_published,
      is_archived: roadmap.is_archived,
    })
  }

  const sections: { id: AdminSection; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'domains', label: 'Domains' },
    { id: 'roadmaps', label: 'Roadmaps' },
    { id: 'students', label: 'Students' },
  ]

  const stats = [
    { label: 'Students', value: statistics?.total_students ?? '—', tint: 'bg-teal-tint text-teal-hover' },
    { label: 'Active domains', value: statistics?.active_domains ?? '—', tint: 'bg-violet-tint text-violet' },
    { label: 'Roadmaps', value: statistics?.total_roadmaps ?? '—', tint: 'bg-coral-tint text-heading' },
    { label: 'Published', value: statistics?.published_roadmaps ?? '—', tint: 'bg-teal-tint text-teal-hover' },
    { label: 'Steps', value: statistics?.total_steps ?? '—', tint: 'bg-violet-tint text-violet' },
    { label: 'Completed steps', value: statistics?.active_learning_records ?? '—', tint: 'bg-coral-tint text-heading' },
  ]

  return (
    <div className="mx-auto w-full max-w-7xl flex-1 px-5 py-8 sm:px-8 sm:py-12">
      <header className="mb-8 flex items-center justify-between">
        <span className="text-lg font-extrabold tracking-tight text-heading">
          Skillora<span className="text-gradient">.</span>
          <span className="ml-2 rounded-full bg-violet-tint px-2.5 py-1 text-xs font-bold text-violet">Admin</span>
        </span>
        <div className="flex items-center gap-3">
          {admin && <span className="hidden text-sm text-muted sm:block">{admin.username}</span>}
          <Button variant="secondary" onClick={handleLogout}>Log out</Button>
        </div>
      </header>

      <section className="mb-7 rounded-3xl border border-teal/15 bg-gradient-to-r from-teal-tint via-white to-violet-tint p-6 sm:p-9">
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-violet">Management workspace</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-heading sm:text-4xl">Welcome, Admin</h1>
      </section>

      <nav className="mb-7 flex gap-2 overflow-x-auto border-b border-line pb-3" aria-label="Admin sections">
        {sections.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => { setSection(item.id); setError(''); setNotice('') }}
            className={`rounded-xl px-4 py-2 text-sm font-bold transition ${section === item.id ? 'bg-gradient-brand text-white' : 'text-body hover:bg-teal-tint hover:text-heading'}`}
            aria-current={section === item.id ? 'page' : undefined}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {error && <p role="alert" className="mb-5 rounded-xl border border-coral/40 bg-coral-tint px-4 py-3 text-sm font-semibold text-heading">{error}</p>}
      {notice && <p role="status" className="mb-5 rounded-xl border border-teal/20 bg-teal-tint px-4 py-3 text-sm font-semibold text-teal-hover">{notice}</p>}
      {loading ? <p className="py-10 text-muted" role="status">Loading admin workspace…</p> : (
        <>
          {section === 'overview' && (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {stats.map((stat) => (
                  <Card key={stat.label} className="p-5">
                    <span className={`inline-flex rounded-xl px-3 py-1 text-xs font-bold ${stat.tint}`}>{stat.label}</span>
                    <p className="mt-4 text-3xl font-extrabold text-heading">{stat.value}</p>
                  </Card>
                ))}
              </div>
              <Card className="mt-5 p-6 text-sm leading-6 text-muted">
                Learning activity is the total number of completed roadmap steps recorded across students.
              </Card>
            </>
          )}

          {section === 'domains' && (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.8fr)]">
              <div className="space-y-3">
                {domains.map((domain) => (
                  <Card key={domain.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
                    <div>
                      <h2 className="font-bold text-heading">{domain.name}</h2>
                      <p className="mt-1 text-xs text-muted">{domain.slug} · order {domain.display_order} · {domain.is_active ? 'Active' : 'Inactive'}</p>
                      {domain.description && <p className="mt-2 text-sm text-body">{domain.description}</p>}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="secondary" onClick={() => editDomain(domain)}>Edit</Button>
                      <Button variant="ghost" onClick={() => void runAction(async () => { await updateAdminDomain(domain.id, { is_active: !domain.is_active }); await refreshCore() }, 'Domain visibility updated.')}>
                        {domain.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button variant="ghost" onClick={() => {
                        if (window.confirm(`Delete ${domain.name}? Domains in use cannot be deleted.`)) {
                          void runAction(async () => { await deleteAdminDomain(domain.id); await refreshCore() }, 'Domain deleted.')
                        }
                      }}>Delete</Button>
                    </div>
                  </Card>
                ))}
              </div>
              <Card className="h-fit p-6">
                <h2 className="mb-5 text-lg font-bold text-heading">{selectedDomain ? 'Edit domain' : 'Create domain'}</h2>
                <form className="space-y-4" onSubmit={submitDomain}>
                  <Input label="Name" value={domainForm.name} onChange={(event) => setDomainForm({ ...domainForm, name: event.target.value })} required />
                  <Input label="Slug" value={domainForm.slug} onChange={(event) => setDomainForm({ ...domainForm, slug: event.target.value })} pattern="[a-z0-9]+(-[a-z0-9]+)*" required />
                  <label className="block space-y-1.5 text-sm font-semibold text-heading">
                    <span>Description</span>
                    <textarea className="min-h-24 w-full rounded-xl border border-line bg-white p-3 text-sm font-normal text-body outline-none focus:border-teal focus:ring-4 focus:ring-teal/15" value={domainForm.description} onChange={(event) => setDomainForm({ ...domainForm, description: event.target.value })} />
                  </label>
                  <Input label="Display order" type="number" min="0" value={domainForm.display_order} onChange={(event) => setDomainForm({ ...domainForm, display_order: Number(event.target.value) })} required />
                  <label className="flex items-center gap-2 text-sm font-medium text-body">
                    <input type="checkbox" checked={domainForm.is_active} onChange={(event) => setDomainForm({ ...domainForm, is_active: event.target.checked })} className="accent-teal" />
                    Active and available to students
                  </label>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={busy}>{selectedDomain ? 'Save changes' : 'Create domain'}</Button>
                    {selectedDomain && <Button type="button" variant="secondary" onClick={() => { setSelectedDomain(null); setDomainForm(defaultDomainForm) }}>Cancel</Button>}
                  </div>
                </form>
              </Card>
            </div>
          )}

          {section === 'roadmaps' && (
            <div className="space-y-6">
              <Card className="p-6">
                <h2 className="mb-5 text-lg font-bold text-heading">{selectedRoadmap !== null ? 'Edit roadmap' : 'Create roadmap'}</h2>
                <form className="grid gap-4 sm:grid-cols-2" onSubmit={submitRoadmap}>
                  <Input label="Title" value={roadmapForm.title} onChange={(event) => setRoadmapForm({ ...roadmapForm, title: event.target.value })} required />
                  <Input label="Slug" value={roadmapForm.slug} onChange={(event) => setRoadmapForm({ ...roadmapForm, slug: event.target.value })} pattern="[a-z0-9]+(-[a-z0-9]+)*" required />
                  <Select label="Domain" value={roadmapForm.domain_id} options={domains.filter((domain) => domain.is_active).map((domain) => ({ value: domain.id, label: domain.name }))} onChange={(event) => setRoadmapForm({ ...roadmapForm, domain_id: Number(event.target.value) })} />
                  <Select label="Difficulty" value={roadmapForm.difficulty} options={['beginner', 'intermediate', 'advanced'].map((level) => ({ value: level, label: level }))} onChange={(event) => setRoadmapForm({ ...roadmapForm, difficulty: event.target.value as RoadmapPayload['difficulty'] })} />
                  <Input label="Estimated hours" type="number" min="0" step="0.5" value={roadmapForm.estimated_hours} onChange={(event) => setRoadmapForm({ ...roadmapForm, estimated_hours: Number(event.target.value) })} required />
                  <Input label="Display order" type="number" min="0" value={roadmapForm.display_order} onChange={(event) => setRoadmapForm({ ...roadmapForm, display_order: Number(event.target.value) })} required />
                  <label className="space-y-1.5 text-sm font-semibold text-heading sm:col-span-2">
                    <span>Description</span>
                    <textarea className="min-h-24 w-full rounded-xl border border-line bg-white p-3 text-sm font-normal text-body outline-none focus:border-teal focus:ring-4 focus:ring-teal/15" value={roadmapForm.description} onChange={(event) => setRoadmapForm({ ...roadmapForm, description: event.target.value })} />
                  </label>
                  <div className="flex flex-wrap gap-5 text-sm font-medium text-body sm:col-span-2">
                    <label className="flex items-center gap-2"><input type="checkbox" checked={roadmapForm.is_published} onChange={(event) => setRoadmapForm({ ...roadmapForm, is_published: event.target.checked })} className="accent-teal" />Published</label>
                    <label className="flex items-center gap-2"><input type="checkbox" checked={roadmapForm.is_archived} onChange={(event) => setRoadmapForm({ ...roadmapForm, is_archived: event.target.checked })} className="accent-teal" />Archived</label>
                  </div>
                  <div className="flex gap-2 sm:col-span-2">
                    <Button type="submit" disabled={busy || domains.length === 0}>{selectedRoadmap !== null ? 'Save roadmap' : 'Create roadmap'}</Button>
                    {selectedRoadmap !== null && <Button type="button" variant="secondary" onClick={() => { setSelectedRoadmap(null); setRoadmapForm(defaultRoadmapForm(domains[0]?.id ?? 0)) }}>Cancel</Button>}
                  </div>
                </form>
              </Card>

              <div className="space-y-4">
                {roadmaps.map((roadmap) => {
                  const isExpanded = selectedRoadmap === roadmap.id
                  const orderedSteps = [...(roadmap.steps ?? [])].sort((left, right) => left.position - right.position)
                  return (
                    <Card key={roadmap.id} className="p-5 sm:p-6">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <div className="flex flex-wrap gap-2 text-xs font-semibold">
                            <span className="rounded-full bg-teal-tint px-3 py-1 text-teal-hover">{roadmap.domain.name}</span>
                            <span className="rounded-full bg-violet-tint px-3 py-1 capitalize text-violet">{roadmap.difficulty}</span>
                            <span className="rounded-full bg-page px-3 py-1 text-muted">{roadmap.is_published ? 'Published' : 'Draft'}{roadmap.is_archived ? ' · Archived' : ''}</span>
                          </div>
                          <h3 className="mt-3 text-lg font-bold text-heading">{roadmap.title}</h3>
                          <p className="mt-1 text-sm text-muted">{roadmap.steps?.length ?? 0} steps · {roadmap.estimated_hours} hours</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button variant="secondary" onClick={() => beginRoadmapEdit(roadmap)}>Edit</Button>
                          <Button variant="ghost" onClick={() => void runAction(async () => { await updateAdminRoadmap(roadmap.id, { is_published: !roadmap.is_published }); await refreshCore() }, roadmap.is_published ? 'Roadmap unpublished.' : 'Roadmap published.')}>{roadmap.is_published ? 'Unpublish' : 'Publish'}</Button>
                          <Button variant="ghost" onClick={() => void runAction(async () => { await updateAdminRoadmap(roadmap.id, { is_archived: !roadmap.is_archived }); await refreshCore() }, roadmap.is_archived ? 'Roadmap reactivated.' : 'Roadmap archived.')}>{roadmap.is_archived ? 'Reactivate' : 'Archive'}</Button>
                          <Button variant="ghost" onClick={() => {
                            if (window.confirm(`Delete ${roadmap.title}? Student progress prevents deletion.`)) {
                              void runAction(async () => { await deleteAdminRoadmap(roadmap.id); await refreshCore() }, 'Roadmap deleted.')
                            }
                          }}>Delete</Button>
                          <Button variant="ghost" onClick={() => setSelectedRoadmap(isExpanded ? null : roadmap.id)}>{isExpanded ? 'Hide editor' : 'Edit steps'}</Button>
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="mt-6 border-t border-line pt-5">
                          <h4 className="font-bold text-heading">Ordered steps and resources</h4>
                          <div className="mt-4 space-y-4">
                            {orderedSteps.map((step, index) => (
                              <div key={step.id} className="rounded-2xl border border-line bg-page p-4">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                  <div>
                                    <p className="font-semibold text-heading">{step.position}. {step.title}</p>
                                    <p className="mt-1 text-xs text-muted">{step.estimated_minutes} min · {step.is_required ? 'Required' : 'Optional'}</p>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button variant="ghost" disabled={index === 0 || busy} onClick={() => void stepOrder(roadmap, step.id, -1)}>Move up</Button>
                                    <Button variant="ghost" disabled={index === orderedSteps.length - 1 || busy} onClick={() => void stepOrder(roadmap, step.id, 1)}>Move down</Button>
                                    <Button variant="ghost" onClick={() => {
                                      setEditingStepId(step.id)
                                        setStepTargetRoadmapId(step.roadmap_id)
                                        setStepForm({
                                        title: step.title,
                                        description: step.description,
                                        instructions: step.instructions,
                                        learning_objectives: step.learning_objectives,
                                        position: step.position,
                                        estimated_minutes: step.estimated_minutes,
                                        is_required: step.is_required,
                                      })
                                    }}>Edit</Button>
                                    <Button variant="ghost" onClick={() => {
                                      if (window.confirm(`Delete step "${step.title}"? Existing progress prevents deletion.`)) {
                                        void runAction(async () => { await deleteAdminStep(step.id); await refreshCore() }, 'Step deleted.')
                                      }
                                    }}>Delete</Button>
                                  </div>
                                </div>
                                <p className="mt-2 whitespace-pre-line text-sm text-body">{step.description}</p>
                                <p className="mt-2 whitespace-pre-line text-sm text-muted">{step.instructions}</p>
                                {step.learning_objectives.length > 0 && <ul className="mt-2 list-inside list-disc text-xs text-muted">{step.learning_objectives.map((objective) => <li key={objective}>{objective}</li>)}</ul>}
                                <div className="mt-3 space-y-2">
                                  {step.resources.map((resource, resourceIndex) => (
                                    <div key={resource.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                                      <a href={resource.url} target="_blank" rel="noreferrer" className="font-semibold text-teal-hover underline">{resource.title}</a>
                                      <div className="flex gap-2">
                                        <Button variant="ghost" onClick={() => void runAction(async () => { await updateAdminResource(resource.id, { is_recommended: !resource.is_recommended }); await refreshCore() }, 'Resource updated.')}>{resource.is_recommended ? 'Unrecommend' : 'Recommend'}</Button>
                                        <Button variant="ghost" onClick={() => {
                                          setSelectedStepId(step.id)
                                          setEditingResourceId(resource.id)
                                          setResourceForm({
                                            title: resource.title,
                                            url: resource.url,
                                            description: resource.description,
                                            resource_type: resource.resource_type,
                                            is_recommended: resource.is_recommended,
                                            display_order: resource.display_order,
                                          })
                                        }}>Edit</Button>
                                        <Button variant="ghost" disabled={resourceIndex === 0} onClick={() => {
                                          const ids = step.resources.map((item) => item.id)
                                          if (resourceIndex > 0) [ids[resourceIndex], ids[resourceIndex - 1]] = [ids[resourceIndex - 1], ids[resourceIndex]]
                                          void resourceOrder(step.id, ids)
                                        }}>↑</Button>
                                        <Button variant="ghost" disabled={resourceIndex === step.resources.length - 1} onClick={() => {
                                          const ids = step.resources.map((item) => item.id)
                                          if (resourceIndex < ids.length - 1) [ids[resourceIndex], ids[resourceIndex + 1]] = [ids[resourceIndex + 1], ids[resourceIndex]]
                                          void resourceOrder(step.id, ids)
                                        }}>↓</Button>
                                        <Button variant="ghost" onClick={() => void runAction(async () => { await deleteAdminResource(resource.id); await refreshCore() }, 'Resource removed.')}>Remove</Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <Button variant="ghost" className="mt-2" onClick={() => {
                                  const closing = selectedStepId === step.id
                                  setSelectedStepId(closing ? null : step.id)
                                  setEditingResourceId(null)
                                  setResourceForm(defaultResourceForm)
                                }}>
                                  {selectedStepId === step.id ? 'Close resource form' : 'Add learning resource'}
                                </Button>
                                {selectedStepId === step.id && (
                                  <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={submitResource}>
                                    <Input label="Resource title" value={resourceForm.title} onChange={(event) => setResourceForm({ ...resourceForm, title: event.target.value })} required />
                                    <Input label="HTTPS or HTTP URL" type="url" value={resourceForm.url} onChange={(event) => setResourceForm({ ...resourceForm, url: event.target.value })} required />
                                    <Select label="Resource type" value={resourceForm.resource_type} options={['documentation', 'video', 'tutorial', 'article', 'practice'].map((value) => ({ value, label: value }))} onChange={(event) => setResourceForm({ ...resourceForm, resource_type: event.target.value as ResourcePayload['resource_type'] })} />
                                    <Input label="Description" value={resourceForm.description} onChange={(event) => setResourceForm({ ...resourceForm, description: event.target.value })} />
                                    <label className="flex items-center gap-2 text-sm text-body"><input type="checkbox" checked={resourceForm.is_recommended} onChange={(event) => setResourceForm({ ...resourceForm, is_recommended: event.target.checked })} className="accent-teal" />Recommended</label>
                                    <Button type="submit" disabled={busy}>{editingResourceId === null ? 'Add resource' : 'Save resource'}</Button>
                                  </form>
                                )}
                              </div>
                            ))}
                          </div>
                          <form className="mt-6 grid gap-3 rounded-2xl border border-teal/20 bg-teal-tint/50 p-4 sm:grid-cols-2" onSubmit={submitStep}>
                            <h4 className="font-bold text-heading sm:col-span-2">{editingStepId === null ? 'Add roadmap step' : 'Edit roadmap step'}</h4>
                            <Input label="Step title" value={stepForm.title} onChange={(event) => setStepForm({ ...stepForm, title: event.target.value })} required />
                            <Input label="Position" type="number" min="1" value={stepForm.position} onChange={(event) => setStepForm({ ...stepForm, position: Number(event.target.value) })} required />
                            <Input label="Estimated minutes" type="number" min="0" value={stepForm.estimated_minutes} onChange={(event) => setStepForm({ ...stepForm, estimated_minutes: Number(event.target.value) })} />
                            {editingStepId !== null && <Select label="Move to roadmap" value={stepTargetRoadmapId ?? selectedRoadmap ?? ''} options={roadmaps.map((item) => ({ value: item.id, label: item.title }))} onChange={(event) => setStepTargetRoadmapId(Number(event.target.value))} />}
                            <label className="flex items-center gap-2 text-sm text-body"><input type="checkbox" checked={stepForm.is_required} onChange={(event) => setStepForm({ ...stepForm, is_required: event.target.checked })} className="accent-teal" />Required step</label>
                            <label className="space-y-1.5 text-sm font-semibold text-heading sm:col-span-2">
                              <span>Description</span>
                              <textarea className="min-h-20 w-full rounded-xl border border-line bg-white p-3 text-sm font-normal text-body" value={stepForm.description} onChange={(event) => setStepForm({ ...stepForm, description: event.target.value })} />
                            </label>
                            <label className="space-y-1.5 text-sm font-semibold text-heading sm:col-span-2">
                              <span>Instructions</span>
                              <textarea className="min-h-20 w-full rounded-xl border border-line bg-white p-3 text-sm font-normal text-body" value={stepForm.instructions} onChange={(event) => setStepForm({ ...stepForm, instructions: event.target.value })} />
                            </label>
                            <label className="space-y-1.5 text-sm font-semibold text-heading sm:col-span-2">
                              <span>Learning objectives (one per line)</span>
                              <textarea className="min-h-20 w-full rounded-xl border border-line bg-white p-3 text-sm font-normal text-body" value={stepForm.learning_objectives.join('\n')} onChange={(event) => setStepForm({ ...stepForm, learning_objectives: event.target.value.split('\n').map((value) => value.trim()).filter(Boolean) })} />
                            </label>
                            <div className="flex gap-2">
                              <Button type="submit" disabled={busy}>{editingStepId === null ? 'Add step' : 'Save step'}</Button>
                              {editingStepId !== null && <Button type="button" variant="secondary" onClick={() => { setEditingStepId(null); setStepForm(defaultStepForm()) }}>Cancel</Button>}
                            </div>
                          </form>
                        </div>
                      )}
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {section === 'students' && (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.85fr)]">
              <div>
                <Input label="Search students" value={search} onChange={(event) => { setPage(1); setSearch(event.target.value) }} placeholder="Name or email" />
                <div className="mt-4 space-y-3">
                  {(students?.items ?? []).map((student) => (
                    <Card key={student.id} className={`cursor-pointer p-4 transition hover:-translate-y-0.5 ${selectedStudent?.id === student.id ? 'ring-2 ring-teal' : ''}`} onClick={() => void selectStudent(student)}>
                      <p className="font-semibold text-heading">{student.name}</p>
                      <p className="mt-1 text-sm text-muted">{student.email} · {student.domain.name}</p>
                    </Card>
                  ))}
                  {!students?.items.length && <Card className="p-5 text-sm text-muted">No students found.</Card>}
                </div>
                {students && (
                  <div className="mt-4 flex items-center justify-between text-sm text-muted">
                    <span>{students.total} students · page {students.page}</span>
                    <div className="flex gap-2">
                      <Button variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
                      <Button variant="secondary" disabled={page * students.page_size >= students.total} onClick={() => setPage(page + 1)}>Next</Button>
                    </div>
                  </div>
                )}
              </div>
              {selectedStudent ? (
                <Card className="h-fit p-6">
                  <h2 className="text-xl font-bold text-heading">{selectedStudent.name}</h2>
                  <p className="mt-1 text-sm text-muted">{selectedStudent.email}</p>
                  <div className="mt-5 space-y-4">
                    <Input label="Student name" value={selectedStudent.name} onChange={(event) => setSelectedStudent({ ...selectedStudent, name: event.target.value })} />
                    <Select label="Learning domain" value={selectedStudent.domain.id} options={domains.map((domain) => ({ value: domain.id, label: domain.name }))} onChange={(event) => setSelectedStudent({ ...selectedStudent, domain: domains.find((domain) => domain.id === Number(event.target.value)) ?? selectedStudent.domain })} />
                    <label className="flex items-center gap-2 text-sm text-body">
                      <input type="checkbox" checked={selectedStudent.is_active} onChange={(event) => setSelectedStudent({ ...selectedStudent, is_active: event.target.checked })} className="accent-teal" />
                      Account active
                    </label>
                    <Button onClick={() => void saveStudent({ name: selectedStudent.name, domain_id: selectedStudent.domain.id, is_active: selectedStudent.is_active })} disabled={busy}>Save student profile</Button>
                  </div>
                  <div className="mt-7 border-t border-line pt-5">
                    <h3 className="font-bold text-heading">Roadmap progress</h3>
                    <div className="mt-3 space-y-3">
                      {selectedStudent.roadmap_progress.map((item) => (
                        <div key={item.roadmap_id} className="rounded-xl bg-page p-3">
                          <p className="text-sm font-semibold text-heading">{item.roadmap_title}</p>
                          <p className="mt-1 text-xs text-muted">{item.completed_required_steps}/{item.total_required_steps} required · {Math.round(item.progress_percentage)}%</p>
                          <div className="mt-2 h-2 overflow-hidden rounded-full bg-violet-tint"><div className="h-full rounded-full bg-gradient-brand" style={{ width: `${item.progress_percentage}%` }} /></div>
                        </div>
                      ))}
                      {!selectedStudent.roadmap_progress.length && <p className="text-sm text-muted">No roadmap activity yet.</p>}
                    </div>
                  </div>
                </Card>
              ) : (
                <Card className="grid min-h-48 place-items-center p-6 text-center text-sm text-muted">Select a student to view their profile and progress.</Card>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
