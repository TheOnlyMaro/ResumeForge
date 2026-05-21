import { useEffect, useRef, useState } from 'react'

/**
 * DialogModal — replaces all native alert / confirm / prompt calls.
 *
 * Controlled by a single `dialog` object (or null to hide):
 *
 *  { type: 'alert',   variant: 'error'|'info', title, message }
 *  { type: 'confirm', title, message, confirmLabel?, cancelLabel?, onConfirm, onCancel? }
 *  { type: 'input',   title, message, defaultValue?, placeholder?, onConfirm, onCancel? }
 *  { type: 'choice',  title, message?, choices: [{ label, description?, value }], onChoice, onCancel? }
 */
function DialogModal({ dialog, onClose }) {
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef(null)
  const firstBtnRef = useRef(null)

  // Reset input and focus when dialog changes
  useEffect(() => {
    if (!dialog) return
    if (dialog.type === 'input') {
      setInputValue(dialog.defaultValue ?? '')
      setTimeout(() => inputRef.current?.focus(), 30)
    } else {
      setTimeout(() => firstBtnRef.current?.focus(), 30)
    }
  }, [dialog])

  if (!dialog) return null

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      dialog.onCancel?.()
      onClose()
    }
  }

  const handleConfirmInput = () => {
    const trimmed = inputValue.trim()
    if (!trimmed) return
    dialog.onConfirm(trimmed)
    onClose()
  }

  const isError = dialog.variant === 'error'
  const accentColor = isError ? 'rose' : 'amber'

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm"
      onKeyDown={handleKeyDown}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          dialog.onCancel?.()
          onClose()
        }
      }}
    >
      <div
        className={`w-[min(92vw,480px)] rounded-2xl border bg-gradient-to-br from-slate-900 via-slate-950 to-slate-950 shadow-[0_32px_80px_rgba(0,0,0,0.7)] animate-in
          ${isError
            ? 'border-rose-500/30 shadow-rose-950/40'
            : 'border-amber-400/25 shadow-slate-950/60'
          }`}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className={`flex items-center gap-3 rounded-t-2xl px-6 py-4 border-b
          ${isError ? 'border-rose-500/20 bg-rose-950/30' : 'border-amber-400/15 bg-amber-950/20'}`}>
          <span className="text-lg">
            {dialog.type === 'confirm' ? '⚠️' : isError ? '❌' : dialog.type === 'input' ? '✏️' : dialog.type === 'choice' ? '📂' : 'ℹ️'}
          </span>
          <h2 className={`text-sm font-bold uppercase tracking-[0.15em]
            ${isError ? 'text-rose-300' : 'text-amber-200'}`}>
            {dialog.title}
          </h2>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {dialog.message && (
            <p className="text-sm text-slate-300 leading-relaxed">{dialog.message}</p>
          )}

          {/* ── ALERT ──────────────────────────────── */}
          {dialog.type === 'alert' && (
            <div className="flex justify-end pt-1">
              <button
                ref={firstBtnRef}
                type="button"
                onClick={onClose}
                className={`rounded-xl px-6 py-2 text-sm font-semibold transition
                  ${isError
                    ? 'bg-rose-600 hover:bg-rose-500 text-white'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                  }`}
              >
                OK
              </button>
            </div>
          )}

          {/* ── CONFIRM ────────────────────────────── */}
          {dialog.type === 'confirm' && (
            <div className="flex justify-end gap-3 pt-1">
              <button
                ref={firstBtnRef}
                type="button"
                onClick={() => { dialog.onCancel?.(); onClose() }}
                className="rounded-xl border border-slate-700 px-5 py-2 text-sm font-semibold text-slate-300 hover:border-slate-500 hover:text-slate-100 transition"
              >
                {dialog.cancelLabel ?? 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => { dialog.onConfirm(); onClose() }}
                className="rounded-xl bg-rose-600 px-5 py-2 text-sm font-semibold text-white hover:bg-rose-500 transition"
              >
                {dialog.confirmLabel ?? 'Delete'}
              </button>
            </div>
          )}

          {/* ── TEXT INPUT ─────────────────────────── */}
          {dialog.type === 'input' && (
            <div className="space-y-3">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleConfirmInput() }}
                placeholder={dialog.placeholder ?? ''}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/40 transition"
              />
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { dialog.onCancel?.(); onClose() }}
                  className="rounded-xl border border-slate-700 px-5 py-2 text-sm font-semibold text-slate-300 hover:border-slate-500 transition"
                >
                  Cancel
                </button>
                <button
                  ref={firstBtnRef}
                  type="button"
                  onClick={handleConfirmInput}
                  disabled={!inputValue.trim()}
                  className="rounded-xl bg-amber-500 px-5 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  {dialog.confirmLabel ?? 'Confirm'}
                </button>
              </div>
            </div>
          )}

          {/* ── CHOICE ─────────────────────────────── */}
          {dialog.type === 'choice' && (
            <div className="space-y-3">
              <div className="space-y-2">
                {dialog.choices.map((choice, i) => (
                  <button
                    key={choice.value}
                    ref={i === 0 ? firstBtnRef : undefined}
                    type="button"
                    onClick={() => { dialog.onChoice(choice.value); onClose() }}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-left transition hover:border-amber-500/50 hover:bg-amber-950/20 group"
                  >
                    <div className="text-sm font-semibold text-slate-100 group-hover:text-amber-200 transition">
                      {choice.label}
                    </div>
                    {choice.description && (
                      <div className="mt-0.5 text-xs text-slate-500 group-hover:text-slate-400 transition">
                        {choice.description}
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => { dialog.onCancel?.(); onClose() }}
                  className="rounded-xl border border-slate-700 px-5 py-2 text-sm font-semibold text-slate-300 hover:border-slate-500 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DialogModal
