import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { getDomains } from '../api/auth'
import { getApiErrorMessage } from '../api/client'
import Button from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'
import type { Domain } from '../types'

type IconName = 'roadmap' | 'book' | 'progress' | 'star' | 'web' | 'ai' | 'python' | 'data' | 'security' | 'algorithms'

function Icon({ name, className = 'h-6 w-6' }: { name: IconName; className?: string }) {
  const shared = {
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 1.8,
    viewBox: '0 0 24 24',
    className,
    'aria-hidden': true as const,
  }

  return (
    <svg {...shared}>
      {name === 'roadmap' && <><circle cx="6" cy="6" r="2" /><circle cx="18" cy="18" r="2" /><path d="M8 6h4a3 3 0 0 1 3 3v3a3 3 0 0 0 3 3" /><path d="M6 8v8" /></>}
      {name === 'book' && <><path d="M3.5 5.5A2.5 2.5 0 0 1 6 3h6v17H6a2.5 2.5 0 0 0-2.5 1z" /><path d="M20.5 5.5A2.5 2.5 0 0 0 18 3h-6v17h6a2.5 2.5 0 0 1 2.5 1z" /></>}
      {name === 'progress' && <><path d="M4 19V11h4v8m4 0V5h4v14m4 0V9h2v10" /><path d="m4 8 5-3 4 2 6-5" /></>}
      {name === 'star' && <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />}
      {name === 'web' && <><path d="m8 7-5 5 5 5m8-10 5 5-5 5m-3-13-2 16" /></>}
      {name === 'ai' && <><path d="M9 4a3 3 0 0 0-5 2.2A3.5 3.5 0 0 0 4 13a3 3 0 0 0 5 2.2V4zm6 0a3 3 0 0 1 5 2.2A3.5 3.5 0 0 1 20 13a3 3 0 0 1-5 2.2V4zM9 8h6m-6 4h6m-6 4v4m6-4v4" /></>}
      {name === 'python' && <><path d="M12 3H8a3 3 0 0 0-3 3v4h7a2 2 0 0 1 2 2v1" /><path d="M12 21h4a3 3 0 0 0 3-3v-4h-7a2 2 0 0 1-2-2v-1" /><circle cx="9" cy="6.5" r=".5" /><circle cx="15" cy="17.5" r=".5" /></>}
      {name === 'data' && <><path d="M4 19h16M6 16v-5h3v5m3 0V5h3v11m3 0V9h3v7" /></>}
      {name === 'security' && <><path d="M12 3 20 6v5c0 5-3.4 8.2-8 10-4.6-1.8-8-5-8-10V6z" /><path d="m9 12 2 2 4-4" /></>}
      {name === 'algorithms' && <><circle cx="12" cy="5" r="2" /><circle cx="6" cy="18" r="2" /><circle cx="18" cy="18" r="2" /><path d="m11 7-4 9m6-9 4 9M8 18h8" /></>}
    </svg>
  )
}

const features: { title: string; description: string; icon: IconName }[] = [
  { title: 'Structured Roadmaps', description: 'Follow clear learning paths from beginner to advanced.', icon: 'roadmap' },
  { title: 'Text-Based Lessons', description: 'Easy-to-understand explanations with examples and exercises.', icon: 'book' },
  { title: 'Track Your Progress', description: 'Monitor your learning journey and celebrate your milestones.', icon: 'progress' },
  { title: 'Earn Achievements', description: 'Stay motivated with streaks, badges and rewards.', icon: 'star' },
]

const domainStyles: { match: string[]; icon: IconName; description: string }[] = [
  { match: ['web', 'front', 'backend'], icon: 'web', description: 'Build modern web applications with the latest technologies.' },
  { match: ['ai', 'machine'], icon: 'ai', description: 'Understand AI concepts and build intelligent systems.' },
  { match: ['python'], icon: 'python', description: 'Master Python from basics to advanced topics.' },
  { match: ['data science', 'data-science'], icon: 'data', description: 'Turn data into insights and make an impact.' },
  { match: ['cyber', 'security'], icon: 'security', description: 'Learn to protect systems, data and users.' },
  { match: ['algorithm', 'data structure', 'dsa'], icon: 'algorithms', description: 'Build problem-solving skills for real-world challenges.' },
]

const domainIconColors = [
  'bg-teal-50 text-teal-600',
  'bg-violet-100 text-violet-600',
  'bg-amber-100 text-amber-600',
  'bg-teal-50 text-teal-600',
  'bg-violet-100 text-violet-600',
  'bg-sky-100 text-sky-600',
]

function getDomainPresentation(domain: Domain): { icon: IconName; description: string } {
  const normalized = `${domain.name} ${domain.slug ?? ''}`.toLowerCase()
  const match = domainStyles.find((style) => style.match.some((term) => normalized.includes(term)))
  return {
    icon: match?.icon ?? 'roadmap',
    description: domain.description || match?.description || `Build practical skills in ${domain.name}.`,
  }
}

export default function Home() {
  const { user } = useAuth()
  const [domains, setDomains] = useState<Domain[]>([])
  const [domainError, setDomainError] = useState('')

  useEffect(() => {
    let active = true
    getDomains()
      .then((items) => {
        if (!Array.isArray(items)) throw new Error('The domains response was not a list.')
        if (active) {
          setDomains(items.filter((domain) => {
            const name = domain.name.trim().toLowerCase()
            const slug = domain.slug?.trim().toLowerCase()
            return domain.is_active !== false && name !== 'not decided yet' && slug !== 'not-decided-yet'
          }))
        }
      })
      .catch((error: unknown) => {
        console.error('Unable to load learning domains.', error)
        if (active) setDomainError(getApiErrorMessage(error, 'Learning domains are temporarily unavailable.'))
      })
    return () => { active = false }
  }, [])

  return (
    <>
      <section className="hero-wash relative overflow-hidden">
        <div className="mx-auto flex min-h-[330px] max-w-5xl flex-col items-center justify-center px-5 py-12 text-center sm:min-h-[370px] sm:px-8 sm:py-12 lg:min-h-[390px]">
          <p className="inline-flex items-center gap-2 rounded-full border border-teal-100 bg-white/80 px-4 py-2 text-xs font-semibold text-teal-700 shadow-sm">
            Learn <span className="text-teal-400">•</span> Build <span className="text-teal-400">•</span> Grow
          </p>
          <h1 className="mt-5 max-w-3xl text-4xl font-extrabold leading-[1.08] tracking-[-0.045em] text-[#12264b] sm:text-5xl lg:text-[3.5rem]">
            Your Learning Journey <span className="text-gradient">Starts Here</span>
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-[#405579] sm:text-base sm:leading-7">
            DevPath provides structured learning roadmaps, detailed lessons, and hands-on practice to help you build real skills and achieve your goals — one step at a time.
          </p>
          <div className="mt-7 flex w-full flex-wrap justify-center gap-3 sm:w-auto">
            <Button to={user ? '/dashboard' : '/signup'} className="min-h-11 rounded-full px-4 text-xs font-bold sm:px-7 sm:text-sm">
              Start Learning <span aria-hidden="true">→</span>
            </Button>
            <Button to="/roadmaps" variant="secondary" className="min-h-11 rounded-full border-slate-400 px-4 text-xs font-semibold text-[#12264b] sm:px-7 sm:text-sm">
              Explore Roadmaps
            </Button>
          </div>
        </div>
      </section>

      <section id="features" aria-label="DevPath features" className="scroll-mt-24 bg-white">
        <div className="mx-auto grid max-w-5xl grid-cols-1 px-5 py-7 sm:grid-cols-2 sm:px-8 lg:grid-cols-4 lg:py-8">
          {features.map((feature, index) => (
            <article key={feature.title} className={`flex items-start gap-4 py-3 sm:px-5 lg:block lg:px-5 lg:py-2 ${index > 0 ? 'lg:border-l lg:border-slate-100' : ''}`}>
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-cyan-50 text-teal-600 ring-1 ring-cyan-100">
                <Icon name={feature.icon} className="h-6 w-6" />
              </span>
              <div className="lg:mt-3">
                <h2 className="text-sm font-bold text-[#172c50]">{feature.title}</h2>
                <p className="mt-1.5 max-w-[210px] text-xs leading-5 text-slate-500">{feature.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="scroll-mt-20 bg-[linear-gradient(115deg,#f0fbf9_0%,#f6fdfb_52%,#f4fbff_100%)] px-5 pb-14 pt-8 sm:px-8 sm:pb-16 sm:pt-10">
        <div className="mx-auto max-w-5xl">
          <header className="mb-7 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-teal-600">Explore Our Domains</p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[#172c50] sm:text-3xl">Learn What You’re Passionate About</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Choose from a variety of domains and start your journey towards a better future.</p>
          </header>
          {domainError ? (
            <p role="status" className="mx-auto max-w-lg rounded-lg border border-amber-200 bg-white px-4 py-3 text-center text-sm text-slate-600">{domainError}</p>
          ) : domains.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
              {domains.map((domain, index) => {
                const presentation = getDomainPresentation(domain)
                return (
                  <Link
                    key={domain.id}
                    to={`/roadmaps?domain_id=${domain.id}`}
                    aria-label={`Explore ${domain.name} roadmaps`}
                    className="group min-h-[150px] rounded-xl border border-cyan-100/90 bg-white p-4 transition duration-200 hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal motion-reduce:transform-none motion-reduce:transition-none"
                  >
                    <span className={`grid h-9 w-9 place-items-center rounded-lg ${domainIconColors[index % domainIconColors.length]}`}>
                      <Icon name={presentation.icon} className="h-5 w-5" />
                    </span>
                    <h3 className="mt-3 text-xs font-bold leading-5 text-[#263b5d] group-hover:text-teal-700">{domain.name}</h3>
                    <p className="mt-1.5 text-[11px] leading-[1.55] text-slate-500">{presentation.description}</p>
                  </Link>
                )
              })}
            </div>
          ) : (
            <p role="status" className="text-center text-sm text-slate-500">Loading learning domains…</p>
          )}
        </div>
      </section>

      <section id="contact" className="scroll-mt-20 bg-white px-5 py-10 sm:px-8 sm:py-12">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 rounded-2xl border border-teal-100 bg-gradient-to-r from-teal-50 via-white to-violet-50 px-6 py-6 text-center sm:flex-row sm:text-left">
          <div>
            <h2 className="text-lg font-bold text-[#172c50]">Ready to take your next step?</h2>
            <p className="mt-1.5 text-sm text-slate-500">Explore a roadmap and start building skills that last.</p>
          </div>
          <Button to={user ? '/dashboard' : '/signup'} className="min-h-11 shrink-0 rounded-full px-6 text-sm">
            Get Started <span aria-hidden="true">→</span>
          </Button>
        </div>
      </section>
    </>
  )
}
