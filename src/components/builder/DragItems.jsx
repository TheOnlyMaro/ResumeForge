import { Fragment } from 'react'
import { useDraggable } from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export function SortableSectionCard({
  section,
  onToggleItem,
  onRemoveItem,
  onRemoveSection,
  onAddItem,
  onEditSection,
  onEditItem,
  activeDragItem,
  libraryItemInsert,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id, data: { type: 'section' } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
    opacity: isDragging ? 0.6 : 1,
  }

  const showItemInsert =
    activeDragItem && libraryItemInsert?.sectionId === section.id
  const itemInsertIndex = showItemInsert ? libraryItemInsert.index : -1

  return (
    <div
      ref={setNodeRef}
      id={section.id}
      style={style}
      className={`rounded-2xl border bg-slate-950/40 p-3 transition hover:border-slate-700 will-change-transform ${
        isDragging
          ? 'border-amber-400/70 shadow-[0_0_0_1px_rgba(251,191,36,0.5)]'
          : 'border-slate-800'
      }`}
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            className="cursor-grab text-slate-500"
            aria-label="Drag section"
          >
            ::
          </button>
          <span className="text-sm font-semibold text-slate-100">
            {section.title}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onAddItem(section.id)}
            className="rounded-full border border-slate-700 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300 transition hover:border-amber-300 hover:bg-amber-300/10 hover:text-amber-100"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => onEditSection?.(section.id)}
            className="rounded-full border border-slate-700 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300 transition hover:border-amber-300 hover:bg-amber-300/10 hover:text-amber-100"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onRemoveSection?.(section.id)}
            className="rounded-full border border-slate-700 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300 transition hover:border-rose-300 hover:bg-rose-500/10 hover:text-rose-100"
          >
            X
          </button>
        </div>
      </div>
      <SortableContext
        items={section.items.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-2">
          {section.items.map((item, index) => (
            <Fragment key={item.id}>
              {showItemInsert && itemInsertIndex === index && (
                <div
                  className="rounded-xl border border-amber-400/70 bg-amber-500/10 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-amber-100"
                >
                  Drop item here
                </div>
              )}
              <SortableItemRow
                item={item}
                sectionId={section.id}
                onToggleItem={onToggleItem}
                onRemoveItem={onRemoveItem}
                onEditItem={onEditItem}
              />
            </Fragment>
          ))}
          {showItemInsert && itemInsertIndex === section.items.length && (
            <div className="rounded-xl border border-amber-400/70 bg-amber-500/10 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-amber-100">
              Drop item here
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  )
}

export function SortableItemRow({
  item,
  sectionId,
  onToggleItem,
  onRemoveItem,
  onEditItem,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, data: { type: 'item', sectionId } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
    opacity: isDragging ? 0.6 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      id={item.id}
      style={style}
      className={`flex items-center justify-between rounded-xl border bg-slate-900/60 px-3 py-2 transition hover:border-slate-700 hover:bg-slate-900/80 will-change-transform ${
        isDragging
          ? 'border-amber-400/70 shadow-[0_0_0_1px_rgba(251,191,36,0.5)]'
          : 'border-slate-800'
      }`}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          className="cursor-grab text-slate-500"
          aria-label="Drag item"
        >
          ::
        </button>
        <label className="flex cursor-pointer items-center gap-3 text-xs text-slate-200">
          <span className="relative inline-flex h-4 w-4 items-center justify-center">
            <input
              type="checkbox"
              checked={item.enabled}
              onChange={() => onToggleItem(sectionId, item.id)}
              className="peer absolute h-0 w-0 opacity-0"
            />
            <span className="h-4 w-4 rounded border border-slate-600 bg-slate-950 transition peer-checked:border-emerald-400 peer-checked:bg-emerald-400" />
          </span>
          {item.label}
        </label>
      </div>
      <div className="flex items-center gap-2 text-[10px] uppercase text-slate-400">
        <button
          type="button"
          onClick={() => onEditItem(sectionId, item.id)}
          className="rounded-full border border-slate-700 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300 transition hover:border-amber-300 hover:bg-amber-300/10 hover:text-amber-100"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onRemoveItem(sectionId, item.id)}
          className="rounded-full border border-slate-700 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300 transition hover:border-rose-300 hover:bg-rose-500/10 hover:text-rose-100"
        >
          X
        </button>
      </div>
    </div>
  )
}

// ── Library: sortable items (within their section) ─────────────────────────
export function LibrarySortableItem({ item, onEdit, onRemove }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `lib-sort-${item.id}`,
    data: { type: 'library-item', item },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      id={`lib-sort-${item.id}`}
      style={style}
      className={`flex items-center justify-between rounded-2xl border px-4 py-3 transition hover:border-slate-700 hover:bg-slate-950/60 will-change-transform ${
        isDragging
          ? 'border-amber-400/70 bg-slate-950/60 shadow-[0_0_0_1px_rgba(251,191,36,0.4)]'
          : 'border-slate-800 bg-slate-950/40'
      }`}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none text-slate-500"
          aria-label="Drag library item"
        >
          ::
        </button>
        <span className="text-sm text-slate-200">{item.label}</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onEdit?.()
          }}
          className="rounded-full border border-slate-700 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300 transition hover:border-amber-300 hover:bg-amber-300/10 hover:text-amber-100 cursor-pointer"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onRemove?.()
          }}
          className="rounded-full border border-slate-700 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300 transition hover:border-rose-300 hover:bg-rose-500/10 hover:text-rose-100 cursor-pointer"
        >
          X
        </button>
        <span className="text-xs text-slate-500 select-none pointer-events-none">Drag</span>
      </div>
    </div>
  )
}

// ── Library: draggable item (legacy – kept for drag-to-resume) ─────────────
export function LibraryDraggableItem({ item }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useDraggable({ id: `library-${item.id}`, data: { type: 'library-item', item } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/40 px-4 py-3 transition hover:border-slate-700 hover:bg-slate-950/60"
    >
      <div className="flex items-center gap-3">
        <span className="text-slate-500">::</span>
        <span className="text-sm text-slate-200">{item.label}</span>
      </div>
      <span className="text-xs text-slate-500">Drag</span>
    </div>
  )
}

// ── Library: sortable section card (reorder within library) ────────────────
export function LibrarySortableSection({ title, items, active, onSelect, onEdit, onRemove }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `lib-section-sort-${title}`,
    data: { type: 'library-section-sort', title, items },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      id={`lib-section-sort-${title}`}
      style={style}
      className={`flex items-center justify-between rounded-2xl border px-4 py-3 transition hover:border-slate-700 hover:bg-slate-950/60 will-change-transform ${
        active
          ? 'border-amber-400/60 bg-slate-900/50 shadow-[0_0_0_1px_rgba(251,191,36,0.4)]'
          : isDragging
            ? 'border-amber-400/70 bg-slate-950/60'
            : 'border-slate-800 bg-slate-950/40'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none text-slate-500"
          aria-label="Drag library section"
          onClick={(event) => event.stopPropagation()}
        >
          ::
        </button>
        <span className="text-sm text-slate-200">{title}</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onEdit?.()
          }}
          className="rounded-full border border-slate-700 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300 transition hover:border-amber-300 hover:bg-amber-300/10 hover:text-amber-100 cursor-pointer"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onRemove?.()
          }}
          className="rounded-full border border-slate-700 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300 transition hover:border-rose-300 hover:bg-rose-500/10 hover:text-rose-100 cursor-pointer"
        >
          X
        </button>
        <span className="text-xs text-slate-500 select-none pointer-events-none">Drag</span>
      </div>
    </div>
  )
}

// ── Library: draggable section (legacy – kept for drag-to-resume) ──────────
export function LibraryDraggableSection({ title, items, active, onSelect }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useDraggable({
    id: `library-section-${title}`,
    data: { type: 'library-section', title, items },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between rounded-2xl border px-4 py-3 transition hover:border-slate-700 hover:bg-slate-950/60 ${
        active
          ? 'border-amber-400/60 bg-slate-900/50 shadow-[0_0_0_1px_rgba(251,191,36,0.4)]'
          : 'border-slate-800 bg-slate-950/40'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="cursor-grab text-slate-500"
          {...attributes}
          {...listeners}
          aria-label="Drag library section"
          onClick={(event) => event.stopPropagation()}
        >
          ::
        </button>
        <span className="text-sm text-slate-200">{title}</span>
      </div>
      <span className="text-xs text-slate-500">Drag</span>
    </div>
  )
}
