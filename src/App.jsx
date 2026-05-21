import { useEffect, useState } from 'react'
import Builder from './Builder.jsx'

function App() {
  const [isDark, setIsDark] = useState(true)
  const [route, setRoute] = useState(window.location.pathname)

  useEffect(() => {
    const root = document.documentElement
    if (isDark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [isDark])

  useEffect(() => {
    const handlePopState = () => {
      setRoute(window.location.pathname)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const navigate = (path) => {
    if (window.location.pathname === path) {
      return
    }
    window.history.pushState({}, '', path)
    setRoute(path)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (route === '/builder') {
    return <Builder onNavigate={navigate} />
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <div className="pointer-events-none absolute -left-28 top-0 h-72 w-72 rounded-full bg-slate-700/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 top-80 h-80 w-80 rounded-full bg-slate-600/20 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.12),_transparent_60%)]" />

      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-5">
          <div className="flex flex-col items-center gap-2 rounded-3xl border border-slate-800 bg-slate-900/70 p-3 shadow-lg shadow-slate-950/60">
            <img
              src="/noun-document-9529.svg"
              alt=""
              className="h-8 w-8 brightness-125"
            />
            <img
              src="/noun-anvil-9637-cropped.svg"
              alt=""
              className="h-12 w-auto brightness-125"
            />
          </div>
          <div>
            <p className="text-2xl font-semibold uppercase tracking-[0.32em] text-slate-100">
              Resume Forge
            </p>
            <p className="text-sm text-slate-400">Local-first resume builder</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsDark((prev) => !prev)}
            className="rounded-full border border-slate-700/60 bg-slate-900/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300 transition hover:border-slate-500"
          >
            {isDark ? 'Dark' : 'Light'}
          </button>
          <a
            className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-900 hover:text-white"
            href="/builder"
            onClick={(event) => {
              event.preventDefault()
              navigate('/builder')
            }}
          >
            Open Resume Maker
          </a>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-14 px-6 pb-20 pt-8">
        <section className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col gap-6">
            <span className="w-fit rounded-full border border-slate-800/70 bg-slate-900/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
              Local-first resume tailoring
            </span>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              A calmer way to craft targeted resumes.
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
              Resume Forge keeps everything on your device. Shape each resume
              from one master CV, then export a clean PDF with no accounts,
              no logins, and no noise.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <a
                className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-900 hover:text-white"
                href="/builder"
                onClick={(event) => {
                  event.preventDefault()
                  navigate('/builder')
                }}
              >
                Start building
              </a>
              <p className="text-sm text-slate-400">
                Free, local, and private
              </p>
            </div>
            <div className="flex flex-wrap gap-6 text-sm text-slate-400">
              <span>Local storage</span>
              <span>Drag-and-drop sections</span>
              <span>PDF export</span>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8 shadow-2xl shadow-slate-950/60">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white/10 p-3 text-white">
                <img src="/noun-document-9529.svg" alt="" className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  Master CV Library
                </p>
                <p className="text-xs text-slate-400">
                  Keep every role-ready detail
                </p>
              </div>
            </div>
            <div className="mt-6 grid gap-4 text-sm text-slate-300">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3">
                Edit one master CV. Derive targeted versions.
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3">
                Reorder sections to match each job post.
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3">
                Export a crisp PDF instantly.
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-8 rounded-3xl border border-slate-800 bg-slate-900/50 p-8 md:grid-cols-[1fr_1.2fr]">
          <div>
            <h2 className="text-2xl font-semibold text-white">How it works</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              Keep one structured CV, tailor it per opportunity, and export in
              seconds. Resume Forge is intentionally simple so the focus stays
              on your content.
            </p>
            <a
              className="mt-5 inline-flex rounded-full border border-slate-700 px-5 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500"
              href="/builder"
              onClick={(event) => {
                event.preventDefault()
                navigate('/builder')
              }}
            >
              Open the builder
            </a>
          </div>
          <ol className="grid gap-5 text-sm text-slate-300">
            {[
              'Import or create your master CV once.',
              'Toggle, trim, and reorder sections for the role.',
              'Export a polished PDF instantly.',
            ].map((step, index) => (
              <li
                key={step}
                className="rounded-2xl border border-slate-800 bg-slate-950/40 px-4 py-4"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Step {index + 1}
                </p>
                <p className="mt-2 text-sm text-slate-200">{step}</p>
              </li>
            ))}
          </ol>
        </section>
      </main>

      <footer className="border-t border-slate-800 bg-slate-950/80">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-6 py-6 text-xs text-slate-400 md:flex-row">
          <p>Resume Forge - local, fast, and focused.</p>
          <p>Built for rapid tailoring and clean output.</p>
        </div>
      </footer>
    </div>
  )
}


export default App
