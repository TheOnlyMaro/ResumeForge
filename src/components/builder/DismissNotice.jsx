function DismissNotice({ visible, message, onClose }) {
  if (!visible) {
    return null
  }

  return (
    <div className="fixed bottom-6 left-1/2 z-50 w-[min(92vw,420px)] -translate-x-1/2 rounded-2xl border border-amber-400/40 bg-gradient-to-br from-amber-500/20 via-slate-950/95 to-slate-950/90 px-5 py-3 text-sm text-slate-100 shadow-[0_20px_60px_rgba(15,23,42,0.6)]">
      <div className="flex items-center justify-between">
        <span className="uppercase tracking-[0.2em] text-[10px] text-amber-200">
          Notice
        </span>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-amber-200/40 px-2 py-0.5 text-[10px] uppercase text-amber-100"
        >
          Close
        </button>
      </div>
      <p className="mt-2 text-sm text-amber-50">{message}</p>
    </div>
  )
}

export default DismissNotice
