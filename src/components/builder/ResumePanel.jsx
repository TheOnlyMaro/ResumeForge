import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { SortableSectionCard } from './DragItems'

function ResumePanel({
  resumeSections,
  selectedResumeSectionId,
  onSelectSection,
  onToggleItem,
  onAddItem,
  onEditSection,
  onEditItem,
  onEditTitle,
  activeDragSection,
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'resume-root',
    data: { type: 'resume-root' },
  })
  const selectedTitle =
    resumeSections.find((section) => section.id === selectedResumeSectionId)
      ?.title || 'No section selected'

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
          <p className="mt-1 text-xs uppercase tracking-[0.3em] text-amber-200/80">
            {selectedTitle}
          </p>
        </div>
        <span className="text-xs text-slate-500">Toggle or remove</span>
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
              className="rounded-full border border-slate-700 px-2 py-1 text-[10px] uppercase text-slate-400"
            >
              Edit
            </button>
          </div>
        </div>

        <SortableContext
          items={resumeSections.map((section) => section.id)}
          strategy={verticalListSortingStrategy}
        >
          {resumeSections.map((section) => (
            <SortableSectionCard
              key={section.id}
              section={section}
              onToggleItem={onToggleItem}
              onAddItem={onAddItem}
              onEditSection={onEditSection}
              onEditItem={onEditItem}
              onSelectSection={onSelectSection}
              selected={section.id === selectedResumeSectionId}
            />
          ))}
        </SortableContext>
      </div>
    </section>
  )
}

export default ResumePanel
