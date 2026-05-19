import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { SortableSectionCard } from './DragItems'

function ResumePanel({
  resumeSections,
  onToggleItem,
  onRemoveItem,
  onRemoveSection,
  onAddSection,
  onAddItem,
  onEditSection,
  onEditItem,
  onEditTitle,
  activeDragSection,
  insertIndex,
  activeDragItem,
  libraryItemInsert,
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'resume-root',
    data: { type: 'resume-root' },
    disabled: !activeDragSection,
  })

  const shouldShowInsert =
    activeDragSection && insertIndex !== undefined && insertIndex >= 0
  const placeholderLabel = activeDragSection
    ? `Add ${activeDragSection.title}`
    : 'Add section'

  const sectionsWithPlaceholder = shouldShowInsert
    ? resumeSections.reduce((acc, section, index) => {
        if (index === insertIndex) {
          acc.push({
            id: 'library-section-placeholder',
            placeholder: true,
          })
        }
        acc.push(section)
        return acc
      }, [])
    : resumeSections
  if (shouldShowInsert && insertIndex >= resumeSections.length) {
    sectionsWithPlaceholder.push({
      id: 'library-section-placeholder',
      placeholder: true,
    })
  }

  return (
    <section
      ref={setNodeRef}
      className={`rounded-3xl border bg-slate-900/60 p-6 transition ${
        isOver && activeDragSection
          ? 'border-amber-400/60 shadow-[0_0_0_1px_rgba(251,191,36,0.4)]'
          : 'border-slate-800'
      }`}
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-300">
            Resume Items
          </h2>
        </div>
        <button
          type="button"
          onClick={() => onAddSection?.('resume')}
          className="rounded-full border border-slate-700 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300 transition hover:border-amber-300 hover:bg-amber-300/10 hover:text-amber-100"
        >
          Add Section
        </button>
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
              onClick={onEditTitle}
              className="rounded-full border border-slate-700 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300 transition hover:border-amber-300 hover:bg-amber-300/10 hover:text-amber-100"
            >
              Edit
            </button>
          </div>
        </div>

        <SortableContext
          items={resumeSections.map((section) => section.id)}
          strategy={verticalListSortingStrategy}
        >
          {sectionsWithPlaceholder.map((section) =>
            section.placeholder ? (
              <div
                key={section.id}
                className="rounded-2xl border border-amber-400/70 bg-amber-500/10 px-4 py-3 text-xs uppercase tracking-[0.2em] text-amber-100"
              >
                {placeholderLabel}
              </div>
            ) : (
              <SortableSectionCard
                key={section.id}
                section={section}
                onToggleItem={onToggleItem}
                onRemoveItem={onRemoveItem}
                onRemoveSection={onRemoveSection}
                onAddItem={onAddItem}
                onEditSection={onEditSection}
                onEditItem={onEditItem}
                activeDragItem={activeDragItem}
                libraryItemInsert={libraryItemInsert}
              />
            ),
          )}
        </SortableContext>
      </div>
    </section>
  )
}

export default ResumePanel
