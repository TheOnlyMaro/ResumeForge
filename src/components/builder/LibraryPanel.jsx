import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { LibrarySortableSection, LibrarySortableItem } from './DragItems'

function LibraryPanel({
  librarySections,
  libraryItems,
  libraryActiveSection,
  onSelectSection,
  onAddSection,
  onAddItem,
  onEditSection,
  onRemoveSection,
  onEditItem,
  onRemoveItem,
  onEditTitle,
}) {
  // IDs used by the section-level SortableContext (must be strings)
  const sectionSortIds = librarySections.map((s) => `lib-section-sort-${s}`)

  // IDs for the item-level SortableContext (active section items)
  const activeItems = libraryItems[libraryActiveSection] ?? []
  const itemSortIds = activeItems.map((item) => `lib-sort-${item.id}`)

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold uppercase tracking-[0.3em] text-slate-300">
          Master CV Library
        </h2>
        <span className="text-xs text-slate-500">Drag into resume</span>
      </div>
      <div className="flex flex-col gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-slate-500">::</span>
              <span className="text-sm font-semibold text-slate-100">Title</span>
              <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] uppercase text-slate-400">
                Locked
              </span>
            </div>
            <button
              type="button"
              onClick={() => onEditTitle?.('library')}
              className="rounded-full border border-slate-700 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300 transition hover:border-amber-300 hover:bg-amber-300/10 hover:text-amber-100"
            >
              Edit
            </button>
          </div>
        </div>
        <details open className="border-b border-slate-800 pb-4">
          <summary className="flex cursor-pointer items-center justify-between px-1 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-200">
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
          <div className="flex flex-col gap-3 pt-2">
            <SortableContext
              items={sectionSortIds}
              strategy={verticalListSortingStrategy}
            >
              {librarySections.map((item) => (
                <LibrarySortableSection
                  key={item}
                  title={item}
                  items={libraryItems[item] ?? []}
                  active={libraryActiveSection === item}
                  onSelect={() => onSelectSection(item)}
                  onEdit={() => onEditSection?.(item)}
                  onRemove={() => onRemoveSection?.(item)}
                />
              ))}
            </SortableContext>
          </div>
        </details>

        <details open className="pt-4">
          <summary className="flex cursor-pointer items-center justify-between px-1 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-200">
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
          <p className="px-1 pb-2 text-xs uppercase tracking-[0.3em] text-amber-200/80">
            {libraryActiveSection}
          </p>
          <div className="flex flex-col gap-3">
            <SortableContext
              items={itemSortIds}
              strategy={verticalListSortingStrategy}
            >
              {activeItems.map((item) => (
                <LibrarySortableItem
                  key={item.id}
                  item={item}
                  onEdit={() => onEditItem?.(libraryActiveSection, item.id)}
                  onRemove={() => onRemoveItem?.(libraryActiveSection, item.id)}
                />
              ))}
            </SortableContext>
          </div>
        </details>
      </div>
    </section>
  )
}

export default LibraryPanel
