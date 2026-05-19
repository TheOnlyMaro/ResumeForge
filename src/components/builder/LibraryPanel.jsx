import { LibraryDraggableItem, LibraryDraggableSection } from './DragItems'

function LibraryPanel({
  librarySections,
  libraryItems,
  libraryActiveSection,
  onSelectSection,
  onAddSection,
  onAddItem,
}) {
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-300">
          Library
        </h2>
        <span className="text-xs text-slate-500">Drag into resume</span>
      </div>
      <div className="flex flex-col gap-4">
        <details open className="border-b border-slate-800 pb-4">
          <summary className="flex cursor-pointer items-center justify-between px-1 py-2 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-200">
            <span className="flex items-center gap-2">
              <span className="text-slate-500">▾</span>
              Resume Sections
            </span>
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                onAddSection('library')
              }}
              className="rounded-full border border-slate-700 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300 transition hover:border-amber-300 hover:bg-amber-300/10 hover:text-amber-100"
            >
              Add
            </button>
          </summary>
          <div className="flex flex-col gap-3">
            {librarySections.map((item) => (
              <LibraryDraggableSection
                key={item}
                title={item}
                items={libraryItems[item] ?? []}
                active={libraryActiveSection === item}
                onSelect={() => onSelectSection(item)}
              />
            ))}
          </div>
        </details>

        <details open className="pt-4">
          <summary className="flex cursor-pointer items-center justify-between px-1 py-2 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-200">
            <span className="flex items-center gap-2">
              <span className="text-slate-500">▾</span>
              Resume Items
            </span>
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                onAddItem('', 'library')
              }}
              className="rounded-full border border-slate-700 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300 transition hover:border-amber-300 hover:bg-amber-300/10 hover:text-amber-100"
            >
              Add
            </button>
          </summary>
          <div className="flex flex-col gap-3">
            {(libraryItems[libraryActiveSection] ?? []).map((item) => (
              <LibraryDraggableItem key={item.id} item={item} />
            ))}
          </div>
        </details>
      </div>
    </section>
  )
}

export default LibraryPanel
