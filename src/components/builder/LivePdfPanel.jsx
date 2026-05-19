function LivePdfPanel() {
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-300">
          Live PDF
        </h2>
        <button
          type="button"
          className="rounded-full border border-slate-700 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-300 transition hover:border-slate-500 hover:bg-slate-900/70"
        >
          Preview
        </button>
      </div>
      <div className="flex h-[546px] items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 text-sm text-slate-500">
        PDF preview will render here
      </div>
    </section>
  )
}

export default LivePdfPanel
