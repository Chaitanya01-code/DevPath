import axios from 'axios'
import { useEffect, useState } from 'react'

import { getDomains, updateMyDomain } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Select from '../components/ui/Select'
import type { Domain } from '../types'

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
        setMessage('Unable to load learning domains. Please refresh and try again.')
        setMessageIsError(true)
      })
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
      const detail = axios.isAxiosError<{ detail?: string }>(error)
        ? error.response?.data.detail
        : undefined
      setMessage(detail ?? 'Unable to update your learning domain. Please try again.')
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
          <Card key={section.title} className="min-h-60 p-6 sm:p-7">
            <div className="flex items-center gap-4">
              <span className={`grid h-12 w-12 place-items-center rounded-2xl text-xl ${section.tint}`} aria-hidden="true">
                {section.icon}
              </span>
              <h2 className="text-lg font-bold text-heading">{section.title}</h2>
            </div>
            <div className="mt-6 grid min-h-28 place-items-center rounded-xl border border-dashed border-line bg-page px-4 text-center">
              <p className="text-sm leading-6 text-muted">
                Your {section.title.toLowerCase()} will appear here.
              </p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
