import { Link } from 'react-router-dom'

import Button from '../components/ui/Button'
import Card from '../components/ui/Card'

const highlights = [
  {
    number: '01',
    title: 'A clear path forward',
    description: 'Turn big learning goals into structured roadmaps with practical next steps.',
    tint: 'bg-teal-tint text-teal-hover',
  },
  {
    number: '02',
    title: 'Learn by building',
    description: 'Keep your projects and progress connected to the skills you are developing.',
    tint: 'bg-violet-tint text-violet',
  },
  {
    number: '03',
    title: 'Made for your momentum',
    description: 'Build consistent habits and see how every focused session moves you ahead.',
    tint: 'bg-coral-tint text-heading ring-1 ring-coral/35',
  },
]

const learningSteps = [
  'Explore a learning roadmap',
  'Practice with a real project',
  'Celebrate your progress',
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
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:py-28">
          <div>
            <p className="mb-5 inline-flex rounded-full border border-teal/20 bg-teal-tint px-3.5 py-2 text-xs font-bold uppercase tracking-[0.12em] text-teal-hover">
              Your next chapter starts here
            </p>
            <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-heading sm:text-6xl">
              Learn with direction.{' '}
              <span className="text-gradient">Build with confidence.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-body">
              Skillora helps new students and coders turn curiosity into skills with structured learning and hands-on projects.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button to="/signup">Start learning for free</Button>
              <Button to="/login" variant="secondary">Log in</Button>
            </div>
            <p className="mt-5 text-sm text-muted">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-teal-hover hover:text-violet">
                Welcome back
              </Link>
            </p>
          </div>
          <Card className="relative overflow-hidden p-6 sm:p-8">
            <div aria-hidden="true" className="absolute -right-8 -top-10 h-40 w-40 rounded-full bg-violet/10 blur-3xl" />
            <div className="relative">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-muted">Your learning workspace</p>
                  <p className="mt-1 text-xl font-bold text-heading">Ready when you are</p>
                </div>
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-brand text-xl text-white shadow-lg shadow-violet/20" aria-hidden="true">
                  ✦
                </span>
              </div>
              <div className="mt-8 space-y-3">
                {learningSteps.map((step, index) => (
                  <div key={step} className="flex items-center gap-4 rounded-xl border border-line bg-page/80 p-4 transition-colors duration-200 hover:bg-teal-tint">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-brand text-xs font-bold text-white shadow-md shadow-teal/15">
                      {index + 1}
                    </span>
                    <span className="text-sm font-semibold text-body">{step}</span>
                  </div>
                ))}
              </div>
              <div className="mt-7">
                <div className="mb-2 flex items-center justify-between text-xs font-semibold">
                  <span className="text-muted">Your momentum</span>
                  <span className="text-teal-hover">40%</span>
                </div>
                <div
                  className="h-2 overflow-hidden rounded-full bg-violet-tint"
                  role="progressbar"
                  aria-label="Your learning momentum"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={40}
                >
                  <div className="h-full w-2/5 rounded-full bg-gradient-brand" />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <div className="mb-9 max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-hover">A better way to grow</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-heading sm:text-4xl">
              Everything you need to keep moving.
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {highlights.map((highlight) => (
              <Card
                key={highlight.number}
                className="p-6 hover:-translate-y-1 hover:shadow-card-hover sm:p-7"
              >
                <span className={`grid h-12 w-12 place-items-center rounded-2xl text-sm font-extrabold ${highlight.tint}`}>
                  {highlight.number}
                </span>
                <h3 className="mt-5 text-lg font-bold text-heading">{highlight.title}</h3>
                <p className="mt-2 text-sm leading-6 text-body">{highlight.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-page px-5 py-14 sm:px-8 sm:py-16">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-7 rounded-3xl bg-gradient-brand px-7 py-9 shadow-card sm:flex-row sm:items-center sm:px-10 sm:py-11">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-white/80">One step can change your direction</p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Ready to start your journey?
            </h2>
          </div>
          <Button
            to="/signup"
            variant="secondary"
            className="shrink-0 border-white text-teal-hover hover:border-white hover:bg-white/90"
          >
            Sign up
          </Button>
        </div>
      </section>
    </>
  )
}
