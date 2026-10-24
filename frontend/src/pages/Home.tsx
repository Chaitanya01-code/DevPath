import { Link } from 'react-router-dom'

import Button from '../components/ui/Button'
import Card from '../components/ui/Card'

const highlights = [
  {
    number: '01',
    title: 'Structured roadmaps',
    description: 'Turn a big learning goal into clear, manageable steps and know what to focus on next.',
    tint: 'bg-teal-tint text-teal-hover',
  },
  {
    number: '02',
    title: 'Curated resources',
    description: 'Find useful material alongside each step, then put what you learn into practice.',
    tint: 'bg-violet-tint text-violet',
  },
  {
    number: '03',
    title: 'Progress through projects',
    description: 'Build practical projects that connect your learning to skills you can demonstrate.',
    tint: 'bg-coral-tint text-heading',
  },
]

const roadmapSteps = [
  {
    number: '01',
    title: 'Learn the foundations',
    description: 'Get comfortable with the essentials',
    tint: 'bg-teal-tint text-teal-hover',
  },
  {
    number: '02',
    title: 'Practice with guidance',
    description: 'Strengthen your skills as you go',
    tint: 'bg-violet-tint text-violet',
  },
  {
    number: '03',
    title: 'Create a real project',
    description: 'Bring what you have learned together',
    tint: 'bg-coral-tint text-heading',
  },
]

export default function Home() {
  return (
    <>
      <section className="hero-wash relative isolate overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <span className="absolute -left-16 top-16 h-64 w-64 rounded-full bg-teal/15 blur-3xl" />
          <span className="absolute right-[8%] top-10 h-72 w-72 rounded-full bg-violet/15 blur-3xl" />
          <span className="absolute bottom-0 left-[48%] h-36 w-36 rounded-full bg-coral/10 blur-3xl" />
        </div>
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:gap-12 lg:py-20">
          <div className="min-w-0">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-teal/20 bg-white/80 px-3.5 py-2 text-xs font-bold uppercase tracking-[0.12em] text-teal-hover shadow-sm">
              <span className="h-2 w-2 rounded-full bg-teal" aria-hidden="true" />
              Learn with a plan
            </p>
            <h1 className="max-w-2xl text-4xl font-extrabold leading-[1.12] tracking-tight text-heading sm:text-5xl lg:text-[3.5rem]">
              Turn curiosity into{' '}
              <span className="text-gradient">real-world skills.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-body sm:text-lg sm:leading-8">
              Learn through structured roadmaps, curated resources, and practical projects that help you move from “where do I start?” to “look what I built.”
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button to="/signup" className="w-full sm:w-auto">
                Get started
                <span aria-hidden="true">→</span>
              </Button>
              <Button to="/dashboard" variant="secondary" className="w-full sm:w-auto">
                Explore roadmaps
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted">
              Already learning with DevPath?{' '}
              <Link to="/login" className="font-semibold text-teal-hover underline decoration-teal/30 underline-offset-4 hover:text-violet focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal">
                Log in
              </Link>
            </p>
          </div>
          <Card className="relative mx-auto w-full max-w-lg overflow-hidden border-white/80 p-5 sm:p-7">
            <div aria-hidden="true" className="absolute -right-8 -top-10 h-40 w-40 rounded-full bg-violet/10 blur-3xl" />
            <div className="relative">
              <div className="flex items-start justify-between gap-4 border-b border-line pb-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-teal-hover">A roadmap, at a glance</p>
                  <p className="mt-1 text-xl font-bold text-heading sm:text-2xl">From first step to first project</p>
                </div>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-brand text-lg text-white shadow-md shadow-teal/15" aria-hidden="true">
                  ✦
                </span>
              </div>
              <ol className="mt-5 space-y-3">
                {roadmapSteps.map((step, index) => (
                  <li key={step.number} className="relative flex items-center gap-3 rounded-xl border border-line/80 bg-white/90 p-3 sm:gap-4 sm:p-4">
                    {index < roadmapSteps.length - 1 && (
                      <span aria-hidden="true" className="absolute bottom-0 left-8 top-12 w-px bg-line" />
                    )}
                    <span className={`relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xs font-extrabold ${step.tint}`}>
                      {step.number}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-heading sm:text-base">{step.title}</span>
                      <span className="mt-0.5 block text-xs leading-5 text-muted sm:text-sm">{step.description}</span>
                    </span>
                    <span className="ml-auto text-lg text-teal-hover" aria-hidden="true">›</span>
                  </li>
                ))}
              </ol>
              <p className="mt-4 rounded-xl bg-gradient-to-r from-teal-tint via-white to-violet-tint px-4 py-3 text-xs font-medium leading-5 text-body sm:text-sm">
                A clear path helps you focus on what you’re learning—and what you can make with it.
              </p>
            </div>
          </Card>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
          <div className="mb-7 max-w-2xl sm:mb-9">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-hover sm:text-sm">Learn with intention</p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-heading sm:text-3xl lg:text-4xl">
              Everything you need to keep moving.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-body sm:text-base">
              Build confidence one useful step at a time, with a learning experience designed around doing—not just browsing.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {highlights.map((highlight) => (
              <Card
                key={highlight.number}
                className="h-full p-5 transition duration-200 hover:-translate-y-1 hover:shadow-card-hover sm:p-6 motion-reduce:transform-none motion-reduce:transition-none"
              >
                <span className={`grid h-11 w-11 place-items-center rounded-xl text-xs font-extrabold ${highlight.tint}`}>
                  {highlight.number}
                </span>
                <h3 className="mt-4 text-base font-bold text-heading sm:text-lg">{highlight.title}</h3>
                <p className="mt-2 text-sm leading-6 text-body">{highlight.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-page px-5 py-10 sm:px-8 sm:py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-5 rounded-3xl border border-teal/15 bg-gradient-to-r from-teal-tint via-white to-violet-tint px-5 py-6 shadow-card sm:flex-row sm:items-center sm:px-8 sm:py-7">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-hover sm:text-sm">Your next step starts here</p>
            <h2 className="mt-2 text-xl font-extrabold tracking-tight text-heading sm:text-2xl">
              Ready to learn something you can use?
            </h2>
            <p className="mt-2 text-sm leading-6 text-body">
              Choose a direction, follow a roadmap, and make your progress tangible.
            </p>
          </div>
          <Button
            to="/signup"
            className="w-full shrink-0 sm:w-auto"
          >
            Get started
            <span aria-hidden="true">→</span>
          </Button>
        </div>
      </section>
    </>
  )
}
