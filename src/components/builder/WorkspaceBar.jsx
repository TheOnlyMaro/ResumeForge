import { useState } from 'react'

function WorkspaceBar({
  resumes = [],
  activeResumeId = '',
  onSelectResume,
  onRenameResume,
  onDeleteResume,
  onDuplicateResume,
  onNewEmptyResume,
  onNewFromMasterCv,
  masterCvs = [],
  activeMasterCvId = '',
  onSelectMasterCv,
  onRenameMasterCv,
  onDeleteMasterCv,
  onNewMasterCv,
  autosaveEnabled = false,
  onToggleAutosave,
  onManualSave,
  onImportJson,
  onExportJson,
  dirtyResumeIds = [],
  dirtyCvIds = [],
}) {
  const [showResumeActions, setShowResumeActions] = useState(false)
  const [showCvActions, setShowCvActions] = useState(false)

  const activeResume = resumes.find((r) => r.id === activeResumeId)
  const activeCv = masterCvs.find((c) => c.id === activeMasterCvId)

  return (
    <div className="relative z-20 w-full rounded-3xl border border-slate-800 bg-slate-900/40 p-4 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-6">
        
        {/* Left Side: Workspaces / Files Switchers */}
        <div className="flex flex-wrap items-center gap-6">
          
          {/* Active Resume Workspace */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
              Active Resume File
            </span>
            <div className="flex items-center gap-2">
              <div className="relative">
                <select
                  value={activeResumeId}
                  onChange={(e) => onSelectResume?.(e.target.value)}
                  className="appearance-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 pr-10 text-sm font-semibold text-slate-100 transition hover:border-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  {resumes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {dirtyResumeIds.includes(r.id) ? `● ${r.name}` : r.name}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                  ▾
                </span>
              </div>

              {/* Resume Operations Popover */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowResumeActions(!showResumeActions)}
                  className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
                  title="File actions"
                >
                  ⚙️
                </button>
                
                {showResumeActions && (
                  <div className="absolute left-0 mt-2 z-30 w-56 rounded-2xl border border-slate-800 bg-slate-950 p-2 shadow-2xl">
                    <button
                      type="button"
                      onClick={() => {
                        setShowResumeActions(false)
                        if (activeResume) onRenameResume?.(activeResume.id, activeResume.name)
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs text-slate-300 hover:bg-slate-900 hover:text-white"
                    >
                      ✏️ Rename File
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowResumeActions(false)
                        if (activeResume) onDuplicateResume?.(activeResume.id)
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs text-slate-300 hover:bg-slate-900 hover:text-white"
                    >
                      👯 Duplicate Active
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowResumeActions(false)
                        onNewEmptyResume?.()
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs text-slate-300 hover:bg-slate-900 hover:text-white"
                    >
                      🫙 Start Empty Resume
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowResumeActions(false)
                        onNewFromMasterCv?.()
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs text-slate-300 hover:bg-slate-900 hover:text-white"
                    >
                      🌟 Start from Master CV
                    </button>
                    {resumes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowResumeActions(false)
                          if (activeResume) onDeleteResume?.(activeResume.id)
                        }}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs text-rose-400 hover:bg-rose-950/20"
                      >
                        🗑️ Delete File
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
            {dirtyResumeIds.includes(activeResumeId) && (
              <span className="text-[10px] font-bold text-amber-500">● unsaved</span>
            )}
          </div>

          <span className="hidden h-8 w-px bg-slate-800 md:block" />

          {/* Master CV File */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
              Master CV File
            </span>
            <div className="flex items-center gap-2">
              <div className="relative">
                <select
                  value={activeMasterCvId}
                  onChange={(e) => onSelectMasterCv?.(e.target.value)}
                  className="appearance-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 pr-10 text-sm font-semibold text-slate-100 transition hover:border-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  {masterCvs.map((cv) => (
                    <option key={cv.id} value={cv.id}>
                      {dirtyCvIds.includes(cv.id) ? `● ${cv.name}` : cv.name}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                  ▾
                </span>
              </div>

              {/* CV Operations Popover */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowCvActions(!showCvActions)}
                  className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
                  title="Master CV actions"
                >
                  ⚙️
                </button>
                
                {showCvActions && (
                  <div className="absolute left-0 mt-2 z-30 w-52 rounded-2xl border border-slate-800 bg-slate-950 p-2 shadow-2xl">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCvActions(false)
                        if (activeCv) onRenameMasterCv?.(activeCv.id, activeCv.name)
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs text-slate-300 hover:bg-slate-900 hover:text-white"
                    >
                      ✏️ Rename CV File
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCvActions(false)
                        onNewMasterCv?.()
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs text-slate-300 hover:bg-slate-900 hover:text-white"
                    >
                      ➕ Create Master CV
                    </button>
                    {masterCvs.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowCvActions(false)
                          if (activeCv) onDeleteMasterCv?.(activeCv.id)
                        }}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs text-rose-400 hover:bg-rose-950/20"
                      >
                        🗑️ Delete CV File
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
            {dirtyCvIds.includes(activeMasterCvId) && (
              <span className="text-[10px] font-bold text-amber-500">● unsaved</span>
            )}
          </div>

        </div>

        {/* Right Side: Saving & IO (Autosave, Save, Import, Export) */}
        <div className="flex flex-wrap items-center gap-4">
          
          {/* Autosave Switch */}
          <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/40 px-4 py-2">
            <span className={`text-xs font-semibold tracking-wider transition ${autosaveEnabled ? 'text-emerald-400' : 'text-slate-400'}`}>
              Autosave: {autosaveEnabled ? 'ON' : 'OFF'}
            </span>
            <button
              type="button"
              onClick={onToggleAutosave}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                autosaveEnabled ? 'bg-emerald-500' : 'bg-slate-800'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  autosaveEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Manual Save Button */}
          <button
            type="button"
            onClick={onManualSave}
            className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-300 transition hover:border-slate-500 hover:bg-slate-900 hover:text-white"
          >
            💾 Save Work
          </button>

          {/* Import / Export JSON Options */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onImportJson}
              className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-300 transition hover:border-slate-500 hover:bg-slate-900 hover:text-white"
            >
              📥 Import
            </button>
            <button
              type="button"
              onClick={onExportJson}
              className="flex items-center gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-emerald-300 transition hover:border-emerald-400 hover:bg-emerald-500/20"
            >
              📤 Export <span className="text-[10px] text-emerald-400/90 font-bold lowercase tracking-normal">(recommended)</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  )
}

export default WorkspaceBar
