import jsPDF from 'jspdf'
import { useState } from 'react'
import { DndContext } from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const defaultResume = {
  name: 'Jordan Taylor',
  subtitle: 'Product Designer',
  contact: [
    'jordan.taylor@email.com',
    'linkedin.com/in/jordantaylor',
    '555-0134',
    'Austin, TX',
  ],
  education: [
    {
      degree: 'School of Design',
      school: 'Harvard University',
      location: 'Cambridge, MA',
      subtitle: 'B.Sc. in Visual Communication',
      dates: '2016 - 2020',
      bullets: ['Honors thesis on accessible product systems'],
    },
  ],
  sections: [
    {
      title: 'EXPERIENCE',
      items: [
        {
          title: 'Lead Product Designer',
          location: 'Remote',
          subtitle: 'Forge Studio',
          dates: '2022 - Present',
          details: [
            'Designed 12 resume templates used by 40k+ job seekers.',
            'Reduced editing time by 45% with modular section controls.',
          ],
        },
      ],
    },
  ],
  languages: [
    'English (Native)',
    'Spanish (Professional)',
    'French (Basic)',
  ],
}

const calibriFiles = {
  normal: '/Fonts/calibri-font-family/calibri-regular.ttf',
  bold: '/Fonts/calibri-font-family/calibri-bold.ttf',
  italic: '/Fonts/calibri-font-family/calibri-italic.ttf',
  bolditalic: '/Fonts/calibri-font-family/calibri-bold-italic.ttf',
}

const calibriCache = {
  normal: null,
  bold: null,
  italic: null,
  bolditalic: null,
}

let calibriLoadPromise = null

const arrayBufferToBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  return btoa(binary)
}

const loadCalibriFonts = async () => {
  if (calibriLoadPromise) {
    return calibriLoadPromise
  }

  calibriLoadPromise = Promise.all(
    Object.entries(calibriFiles).map(async ([style, path]) => {
      if (calibriCache[style]) {
        return
      }
      const response = await fetch(path)
      if (!response.ok) {
        throw new Error(`Failed to load font: ${path}`)
      }
      const buffer = await response.arrayBuffer()
      calibriCache[style] = arrayBufferToBase64(buffer)
    }),
  )

  return calibriLoadPromise
}

const registerCalibriFonts = (doc) => {
  doc.addFileToVFS('calibri-regular.ttf', calibriCache.normal)
  doc.addFont('calibri-regular.ttf', 'Calibri', 'normal')
  doc.addFileToVFS('calibri-bold.ttf', calibriCache.bold)
  doc.addFont('calibri-bold.ttf', 'Calibri', 'bold')
  doc.addFileToVFS('calibri-italic.ttf', calibriCache.italic)
  doc.addFont('calibri-italic.ttf', 'Calibri', 'italic')
  doc.addFileToVFS('calibri-bold-italic.ttf', calibriCache.bolditalic)
  doc.addFont('calibri-bold-italic.ttf', 'Calibri', 'bolditalic')
}

export async function buildPdf(resume = defaultResume) {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' })
  await loadCalibriFonts()
  registerCalibriFonts(doc)

  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 40
  let y = 50

  const centerX = pageWidth / 2
  const leftX = margin
  const rightX = pageWidth - margin

  doc.setFont('Calibri', 'bold')
  doc.setFontSize(18)
  doc.text(resume.name, centerX, y, { align: 'center' })

  const nameWidth = doc.getTextWidth(resume.name)
  doc.setLineWidth(1)
  doc.line(centerX - nameWidth / 2, y + 2, centerX + nameWidth / 2, y + 2)

  y += 18
  doc.setFont('Calibri', 'italic')
  doc.setFontSize(12)
  doc.text(resume.subtitle, centerX, y, { align: 'center' })

  y += 14
  doc.setFont('Calibri', 'bold')
  doc.setFontSize(11)
  const contactLine = resume.contact.join(' | ')
  doc.text(contactLine, centerX, y, { align: 'center' })

  y += 16

  const drawSectionTitle = (title) => {
    doc.setFont('Calibri', 'bold')
    doc.setFontSize(12)
    doc.text(title, leftX, y)
    y += 3
    doc.setDrawColor(0, 0, 0)
    doc.setLineWidth(0.8)
    doc.line(leftX, y, rightX, y)
    y += 9
  }

  const drawLinePair = (leftText, rightText, style = 'normal') => {
    doc.setFont('Calibri', style)
    doc.setFontSize(11)
    doc.text(leftText, leftX, y)
    doc.text(rightText, rightX, y, { align: 'right' })
    y += 12
  }

  const drawSubLinePair = (leftText, rightText) => {
    doc.setFont('Calibri', 'italic')
    doc.setFontSize(10)
    doc.text(leftText, leftX, y)
    doc.text(rightText, rightX, y, { align: 'right' })
    y += 11
  }

  const drawBullets = (bullets) => {
    const bulletIndent = 18
    const bulletRadius = 1.6
    bullets.forEach((bullet) => {
      const [label, rest] = bullet.split(/:(.+)/)
      doc.setDrawColor(0, 0, 0)
      doc.setFillColor(0, 0, 0)
      doc.circle(leftX + 6, y - 3, bulletRadius, 'F')
      if (rest) {
        doc.setFont('Calibri', 'bold')
        doc.setFontSize(10)
        const labelText = `${label.trim()}:`
        doc.text(labelText, leftX + bulletIndent, y)
        const labelWidth = doc.getTextWidth(labelText)
        doc.setFont('Calibri', 'normal')
        doc.text(rest.trim(), leftX + bulletIndent + labelWidth + 4, y)
      } else {
        doc.setFont('Calibri', 'normal')
        doc.setFontSize(10)
        doc.text(bullet, leftX + bulletIndent, y)
      }
      y += 12
    })
  }

  drawSectionTitle('EDUCATION')
  resume.education.forEach((item) => {
    drawLinePair(`${item.degree} - ${item.school}`, item.location, 'bold')
    drawSubLinePair(item.subtitle, item.dates)
    if (item.bullets?.length) {
      drawBullets(item.bullets)
    }
    y += 6
  })

  resume.sections.forEach((section) => {
    drawSectionTitle(section.title)
    section.items.forEach((item) => {
      drawLinePair(item.title, item.location, 'bold')
      drawSubLinePair(item.subtitle, item.dates)
      if (item.details?.length) {
        drawBullets(item.details)
      }
      y += 6
    })
  })

  drawSectionTitle('LANGUAGES')
  doc.setFont('Calibri', 'normal')
  doc.setFontSize(10)
  doc.text(resume.languages.join(' | '), leftX, y)

  doc.save('Resume-Forge-Sample.pdf')
}

function Builder({ onNavigate }) {
  const [resumeSections, setResumeSections] = useState([
    {
      id: 'education',
      title: 'Education',
      items: [
        { id: 'edu-1', label: 'B.Sc. Visual Communication', enabled: true },
        { id: 'edu-2', label: 'Honors thesis', enabled: true },
      ],
    },
    {
      id: 'experience',
      title: 'Experience',
      items: [
        { id: 'exp-1', label: 'Lead Product Designer', enabled: true },
        { id: 'exp-2', label: 'Product Designer', enabled: true },
      ],
    },
  ])
  const toggleItem = (sectionId, itemId) => {
    setResumeSections((sections) =>
      sections.map((section) => {
        if (section.id !== sectionId) {
          return section
        }
        return {
          ...section,
          items: section.items.map((item) =>
            item.id === itemId
              ? { ...item, enabled: !item.enabled }
              : item,
          ),
        }
      }),
    )
  }

  const buildResumeFromState = () => {
    const mapItemsToDetails = (items) =>
      items
        .filter((item) => item.enabled)
        .map((item) => item.label)

    const educationSection = resumeSections.find(
      (section) => section.id === 'education',
    )
    const experienceSection = resumeSections.find(
      (section) => section.id === 'experience',
    )

    const educationBullets = mapItemsToDetails(educationSection?.items ?? [])
    const experienceDetails = mapItemsToDetails(experienceSection?.items ?? [])

    return {
      ...defaultResume,
      education: educationBullets.length
        ? [
            {
              ...defaultResume.education[0],
              bullets: educationBullets,
            },
          ]
        : [],
      sections: experienceDetails.length
        ? [
            {
              title: 'EXPERIENCE',
              items: [
                {
                  ...defaultResume.sections[0].items[0],
                  details: experienceDetails,
                },
              ],
            },
          ]
        : [],
    }
  }

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) {
      return
    }

    const activeType = active.data.current?.type
    const overType = over.data.current?.type

    if (activeType === 'section' && overType === 'section') {
      setResumeSections((sections) => {
        const oldIndex = sections.findIndex((section) => section.id === active.id)
        const newIndex = sections.findIndex((section) => section.id === over.id)
        return arrayMove(sections, oldIndex, newIndex)
      })
      return
    }

    if (activeType === 'item' && overType === 'item') {
      const activeSectionId = active.data.current?.sectionId
      const overSectionId = over.data.current?.sectionId
      if (activeSectionId !== overSectionId) {
        return
      }

      setResumeSections((sections) =>
        sections.map((section) => {
          if (section.id !== activeSectionId) {
            return section
          }

          const oldIndex = section.items.findIndex(
            (item) => item.id === active.id,
          )
          const newIndex = section.items.findIndex(
            (item) => item.id === over.id,
          )
          return {
            ...section,
            items: arrayMove(section.items, oldIndex, newIndex),
          }
        }),
      )
    }
  }
  return (
    <div className="min-h-screen select-none bg-slate-950 text-slate-100">
      <div className="mx-auto flex w-full max-w-none flex-col gap-8 px-2 py-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-slate-700 px-3 py-1 text-sm uppercase tracking-[0.3em] text-slate-400">
                Resume Forge
              </span>
              <h1 className="text-3xl font-semibold text-white">
                Resume Builder
              </h1>
              <div className="relative">
                <select
                  className="appearance-none rounded-full border border-slate-700 bg-slate-950/50 px-3 py-1 pr-8 text-xs uppercase tracking-[0.2em] text-slate-300 transition hover:bg-white hover:text-slate-900"
                  defaultValue="harvard-bulleted"
                >
                  <option value="harvard-bulleted">
                    Harvard template (bulleted)
                  </option>
                </select>
                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">
                  ▾
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={async () => {
                await buildPdf(buildResumeFromState())
              }}
              className="rounded-full bg-white px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-900 transition hover:bg-slate-900 hover:text-white"
            >
              Generate PDF
            </button>
            <button
              type="button"
              onClick={() => onNavigate?.('/')}
              className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300 transition hover:border-slate-500"
            >
              Back home
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr_1fr]">
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
                    className="rounded-md border border-slate-700 px-2 py-0.5 text-[10px] uppercase text-slate-400"
                  >
                    Add
                  </button>
                </summary>
                <div className="flex flex-col gap-3">
                  {['Experience', 'Projects', 'Skills'].map((item) => (
                    <div
                      key={item}
                      className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/40 px-4 py-3 transition hover:border-slate-700 hover:bg-slate-950/60"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500">::</span>
                        <span className="text-sm text-slate-200">{item}</span>
                      </div>
                      <span className="text-xs text-slate-500">Drag</span>
                    </div>
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
                    className="rounded-md border border-slate-700 px-2 py-0.5 text-[10px] uppercase text-slate-400"
                  >
                    Add
                  </button>
                </summary>
                <div className="flex flex-col gap-3">
                  {['Portfolio review', 'Leadership', 'Optimization'].map(
                    (item) => (
                      <div
                        key={item}
                        className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/40 px-4 py-3 transition hover:border-slate-700 hover:bg-slate-950/60"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-slate-500">::</span>
                          <span className="text-sm text-slate-200">{item}</span>
                        </div>
                        <span className="text-xs text-slate-500">Drag</span>
                      </div>
                    ),
                  )}
                </div>
              </details>
            </div>
          </section>

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

          <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-300">
                Resume Items
              </h2>
              <span className="text-xs text-slate-500">Toggle or remove</span>
            </div>

            <div className="flex flex-col gap-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500">::</span>
                    <span className="text-sm font-semibold text-slate-100">
                      Title
                    </span>
                    <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] uppercase text-slate-400">
                      Locked
                    </span>
                  </div>
                  <button
                    type="button"
                    className="rounded-full border border-slate-700 px-2 py-1 text-[10px] uppercase text-slate-400"
                  >
                    Edit
                  </button>
                </div>
              </div>

              <DndContext onDragEnd={handleDragEnd}>
                <SortableContext
                  items={resumeSections.map((section) => section.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {resumeSections.map((section) => (
                    <SortableSectionCard
                      key={section.id}
                      section={section}
                      onToggleItem={toggleItem}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

function SortableSectionCard({ section, onToggleItem }) {
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
    transition,
    opacity: isDragging ? 0.6 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-2xl border border-slate-800 bg-slate-950/40 p-3 transition hover:border-slate-700"
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
        <button
          type="button"
          className="rounded-full border border-slate-700 px-2 py-1 text-[10px] uppercase text-slate-400"
        >
          Add
        </button>
      </div>
      <SortableContext
        items={section.items.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-2">
          {section.items.map((item) => (
            <SortableItemRow
              key={item.id}
              item={item}
              sectionId={section.id}
              onToggleItem={onToggleItem}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  )
}

function SortableItemRow({ item, sectionId, onToggleItem }) {
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
    transition,
    opacity: isDragging ? 0.6 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 transition hover:border-slate-700 hover:bg-slate-900/80"
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
        <button type="button">Edit</button>
        <button type="button">X</button>
      </div>
    </div>
  )
}

export default Builder
