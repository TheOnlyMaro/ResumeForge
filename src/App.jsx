function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center gap-6 px-6 text-center">
        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
          Tailwind Ready
        </span>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          ResumeForge
        </h1>
        <p className="max-w-xl text-base text-slate-600 sm:text-lg">
          Your Vite + React + Tailwind project is set up. Start editing
          <span className="font-semibold text-slate-900"> src/App.jsx</span> and
          build from here.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <a
            className="rounded-full bg-slate-900 px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
            href="https://vite.dev"
            target="_blank"
            rel="noreferrer"
          >
            Vite Docs
          </a>
          <a
            className="rounded-full border border-slate-300 px-5 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400"
            href="https://tailwindcss.com/docs"
            target="_blank"
            rel="noreferrer"
          >
            Tailwind Docs
          </a>
        </div>
      </main>
    </div>
  )
}

export default App
