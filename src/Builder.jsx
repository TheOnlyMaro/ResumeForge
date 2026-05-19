import { useEffect, useState } from 'react'
import { DndContext, DragOverlay, useDroppable } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { defaultResume } from './data/defaultResume'
import { buildResumePdf } from './pdf/buildResumePdf'
import BuilderModal from './components/builder/BuilderModal'
import DismissNotice from './components/builder/DismissNotice'
import LibraryPanel from './components/builder/LibraryPanel'
import LivePdfPanel from './components/builder/LivePdfPanel'
import ResumePanel from './components/builder/ResumePanel'

function Builder({ onNavigate }) {
  const [resumeSections, setResumeSections] = useState([
    {
      id: 'education',
      title: 'Education',
      items: [
        {
          id: 'edu-1',
          type: 'education',
          label: 'School of Design - Harvard University',
          degree: 'School of Design',
          school: 'Harvard University',
          location: 'Cambridge, MA',
          field: 'B.Sc. in Visual Communication',
          dates: '2016 - 2020',
          bullets: ['Honors thesis on accessible product systems'],
          enabled: true,
        },
      ],
    },
    {
      id: 'experience',
      title: 'Experience',
      items: [
        {
          id: 'exp-1',
          type: 'custom',
          label: 'Lead Product Designer',
          name: 'Lead Product Designer',
          location: 'Remote',
          subtitle: 'Forge Studio',
          dates: '2022 - Present',
          details: [
            'Designed 12 resume templates used by 40k+ job seekers.',
            'Reduced editing time by 45% with modular section controls.',
          ],
          enabled: true,
        },
      ],
    },
  ])
  const [titleData, setTitleData] = useState({
    name: defaultResume.name,
    subtitle: defaultResume.subtitle,
    contacts: defaultResume.contacts.map((entry) => ({ ...entry })),
  })
  const [librarySections, setLibrarySections] = useState([
    'Experience',
    'Projects',
    'Skills',
  ])
  const [libraryItems, setLibraryItems] = useState({
    Experience: [
      {
        id: 'lib-exp-1',
        type: 'custom',
        label: 'Portfolio review',
        subtitle: 'Forge Studio',
        location: 'Remote',
        dates: '2022 - Present',
        details: ['Led product review sessions', 'Improved UX clarity'],
      },
      {
        id: 'lib-exp-2',
        type: 'custom',
        label: 'Leadership',
        subtitle: 'Design Guild',
        location: 'Boston, MA',
        dates: '2020 - 2022',
        details: ['Mentored junior designers', 'Ran weekly crits'],
      },
      {
        id: 'lib-exp-3',
        type: 'custom',
        label: 'Optimization',
        subtitle: 'Sprint Ops',
        location: 'Austin, TX',
        dates: '2019 - 2020',
        details: ['Reduced handoff time by 20%'],
      },
    ],
    Projects: [
      {
        id: 'lib-proj-1',
        type: 'custom',
        label: 'Case study',
        subtitle: 'Mobile onboarding',
        location: 'Remote',
        dates: '2023',
        details: ['Boosted conversion by 12%'],
      },
      {
        id: 'lib-proj-2',
        type: 'custom',
        label: 'Product launch',
        subtitle: 'B2B dashboard',
        location: 'Remote',
        dates: '2022',
        details: ['Shipped MVP in 6 weeks'],
      },
    ],
    Skills: [
      {
        id: 'lib-skill-1',
        type: 'custom',
        label: 'Design systems',
        subtitle: '',
        location: '',
        dates: '',
        details: ['Tokens, components, accessibility'],
      },
      {
        id: 'lib-skill-2',
        type: 'custom',
        label: 'User research',
        subtitle: '',
        location: '',
        dates: '',
        details: ['Interviews, surveys, synthesis'],
      },
    ],
  })
  const [libraryActiveSection, setLibraryActiveSection] = useState('Experience')
  const [selectedResumeSectionId, setSelectedResumeSectionId] = useState(
    resumeSections[0]?.id ?? null,
  )
  const [modalState, setModalState] = useState({
    open: false,
    mode: 'add',
    type: 'item',
    target: 'resume',
    itemType: 'custom',
    sectionId: null,
    itemId: null,
  })
  const [activeDragItem, setActiveDragItem] = useState(null)
  const [activeDragSection, setActiveDragSection] = useState(null)
  const { setNodeRef: setResumeDropRef, isOver: isResumeDropOver } = useDroppable(
    {
      id: 'resume-root',
      data: { type: 'resume-root' },
    },
  )
  const [dismissNotice, setDismissNotice] = useState({
    visible: false,
    message: '',
  })
  const [modalForm, setModalForm] = useState({
    title: '',
    itemName: '',
    sectionId: '',
    name: '',
    subtitle: '',
    contacts: [
      { label: '', link: '' },
      { label: '', link: '' },
      { label: '', link: '' },
      { label: '', link: '' },
    ],
    degree: '',
    school: '',
    location: '',
    field: '',
    dates: '',
    bullets: '',
    details: '',
    languages: '',
  })

  const getSectionKind = (sectionTitle = '') => {
    const title = sectionTitle.toLowerCase()
    if (title.includes('education')) {
      return 'education'
    }
    if (title.includes('language')) {
      return 'language'
    }
    return 'custom'
  }

  const splitLines = (value) =>
    value
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)

  const splitList = (value) =>
    value
      .split(/[\n,]/)
      .map((line) => line.trim())
      .filter(Boolean)

  useEffect(() => {
    if (!resumeSections.length) {
      setSelectedResumeSectionId(null)
      return
    }
    const stillExists = resumeSections.some(
      (section) => section.id === selectedResumeSectionId,
    )
    if (!stillExists) {
      setSelectedResumeSectionId(resumeSections[0].id)
    }
  }, [resumeSections, selectedResumeSectionId])

  const getLibraryItemType = (item) => item.type || 'custom'

  const isLibraryItemAllowed = (item, targetSectionTitle) => {
    const targetType = getSectionKind(targetSectionTitle)
    const itemType = getLibraryItemType(item)
    if (targetType === 'education') {
      return itemType === 'education'
    }
    if (targetType === 'language') {
      return itemType === 'language'
    }
    return itemType === 'custom'
  }

  const buildResumeItemFromLibrary = (item, sectionTitle) => {
    const targetType = getSectionKind(sectionTitle)
    if (targetType === 'education') {
      return {
        id: `item-${Date.now()}`,
        type: 'education',
        label: `${item.degree ?? ''} - ${item.school ?? ''}`.trim(),
        degree: item.degree ?? '',
        school: item.school ?? '',
        location: item.location ?? '',
        field: item.field ?? '',
        dates: item.dates ?? '',
        bullets: item.bullets ?? [],
        enabled: true,
      }
    }
    if (targetType === 'language') {
      return {
        id: `item-${Date.now()}`,
        type: 'language',
        label: 'Languages',
        languages: item.languages ?? [],
        enabled: true,
      }
    }
    const labelCandidate =
      item.label ||
      item.name ||
      `${item.degree ?? ''}${item.school ? ` - ${item.school}` : ''}`.trim() ||
      'New item'
    const detailCandidates =
      item.details ??
      item.bullets ??
      (item.languages ? item.languages.map((lang) => lang) : [])
    return {
      id: `item-${Date.now()}`,
      type: 'custom',
      label: labelCandidate,
      name: item.name ?? item.label ?? labelCandidate,
      subtitle: item.subtitle ?? item.field ?? '',
      location: item.location ?? '',
      dates: item.dates ?? '',
      details: detailCandidates,
      enabled: true,
    }
  }

  const buildResumeSectionFromLibrary = (title, items) => {
    const id = `section-${Date.now()}`
    return {
      id,
      title,
      items: items.map((item) => buildResumeItemFromLibrary(item, title)),
    }
  }

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

  const openAddSection = (target = 'resume') => {
    setModalForm({
      title: '',
      itemName: '',
      sectionId: '',
      name: '',
      subtitle: '',
      contacts: [
        { label: '', link: '' },
        { label: '', link: '' },
        { label: '', link: '' },
        { label: '', link: '' },
      ],
      degree: '',
      school: '',
      location: '',
      field: '',
      dates: '',
      bullets: '',
      details: '',
      languages: '',
    })
    setModalState({
      open: true,
      mode: 'add',
      type: 'section',
      target,
      itemType: 'custom',
      sectionId: null,
      itemId: null,
    })
  }

  const openAddItem = (sectionId = '', target = 'resume') => {
    const resolvedTitle =
      target === 'library'
        ? libraryActiveSection
        : resumeSections.find((section) => section.id === sectionId)?.title
    const itemType = getSectionKind(resolvedTitle || '')
    setModalForm({
      title: '',
      itemName: '',
      sectionId,
      name: '',
      subtitle: '',
      contacts: [
        { label: '', link: '' },
        { label: '', link: '' },
        { label: '', link: '' },
        { label: '', link: '' },
      ],
      degree: '',
      school: '',
      location: '',
      field: '',
      dates: '',
      bullets: '',
      details: '',
      languages: '',
    })
    setModalState({
      open: true,
      mode: 'add',
      type: 'item',
      target,
      itemType,
      sectionId,
      itemId: null,
    })
  }

  const openEditItem = (sectionId, itemId) => {
    const section = resumeSections.find((item) => item.id === sectionId)
    const item = section?.items.find((entry) => entry.id === itemId)
    setModalForm({
      title: '',
      itemName: item?.name ?? item?.label ?? '',
      sectionId: sectionId ?? '',
      name: '',
      subtitle: item?.subtitle ?? '',
      contacts: [
        { label: '', link: '' },
        { label: '', link: '' },
        { label: '', link: '' },
        { label: '', link: '' },
      ],
      degree: item?.degree ?? '',
      school: item?.school ?? '',
      location: item?.location ?? '',
      field: item?.field ?? '',
      dates: item?.dates ?? '',
      bullets: (item?.bullets ?? []).join('\n'),
      details: (item?.details ?? []).join('\n'),
      languages: (item?.languages ?? []).join('\n'),
    })
    setModalState({
      open: true,
      mode: 'edit',
      type: 'item',
      target: 'resume',
      itemType: item?.type ?? getSectionKind(section?.title ?? ''),
      sectionId,
      itemId,
    })
  }

  const openEditSection = (sectionId) => {
    const section = resumeSections.find((item) => item.id === sectionId)
    setModalForm({
      title: section?.title ?? '',
      itemName: '',
      sectionId: sectionId ?? '',
      name: '',
      subtitle: '',
      contacts: [
        { label: '', link: '' },
        { label: '', link: '' },
        { label: '', link: '' },
        { label: '', link: '' },
      ],
      degree: '',
      school: '',
      location: '',
      field: '',
      dates: '',
      bullets: '',
      details: '',
      languages: '',
    })
    setModalState({
      open: true,
      mode: 'edit',
      type: 'section',
      target: 'resume',
      itemType: 'custom',
      sectionId,
      itemId: null,
    })
  }

  const openEditTitle = () => {
    setModalForm((prev) => ({
      ...prev,
      name: titleData.name,
      subtitle: titleData.subtitle,
      contacts:
        titleData.contacts?.map((entry) => ({ ...entry })) ?? prev.contacts,
    }))
    setModalState({
      open: true,
      mode: 'edit',
      type: 'title',
      target: 'resume',
      itemType: 'custom',
      sectionId: null,
      itemId: null,
    })
  }

  const closeModal = () => {
    setModalState({
      open: false,
      mode: 'add',
      type: 'item',
      target: 'resume',
      itemType: 'custom',
      sectionId: null,
      itemId: null,
    })
  }

  const showDismissNotice = (message) => {
    setDismissNotice({ visible: true, message })
    setTimeout(() => {
      setDismissNotice((prev) =>
        prev.message === message ? { visible: false, message: '' } : prev,
      )
    }, 2400)
  }

  const handleBackdropClose = () => {
    closeModal()
    showDismissNotice('Changes not saved')
  }

  const handleModalSubmit = (event) => {
    event.preventDefault()
    if (modalState.type === 'title') {
      setTitleData({
        name: modalForm.name.trim() || titleData.name,
        subtitle: modalForm.subtitle.trim() || titleData.subtitle,
        contacts: modalForm.contacts
          .map((entry) => ({
            label: entry.label.trim(),
            link: entry.link.trim(),
          }))
          .filter((entry) => entry.label || entry.link),
      })
      closeModal()
      return
    }
    if (modalState.type === 'section') {
      if (modalState.target === 'library') {
        if (modalState.mode === 'add' && modalForm.title.trim()) {
          setLibrarySections((sections) => [
            ...sections,
            modalForm.title.trim(),
          ])
          setLibraryItems((items) => ({
            ...items,
            [modalForm.title.trim()]: [],
          }))
        }
      } else {
        if (modalState.mode === 'add' && modalForm.title.trim()) {
          const newId = `section-${Date.now()}`
          setResumeSections((sections) => [
            ...sections,
            { id: newId, title: modalForm.title.trim(), items: [] },
          ])
        }
        if (modalState.mode === 'edit' && modalForm.title.trim()) {
          setResumeSections((sections) =>
            sections.map((section) =>
              section.id === modalState.sectionId
                ? { ...section, title: modalForm.title.trim() }
                : section,
            ),
          )
        }
      }
    }

    if (modalState.type === 'item') {
      if (modalState.target === 'library') {
        const hasRequiredField =
          modalState.itemType === 'education'
            ? modalForm.degree.trim() || modalForm.school.trim()
            : modalState.itemType === 'language'
              ? modalForm.languages.trim()
              : modalForm.itemName.trim()
        if (modalState.mode === 'add' && hasRequiredField) {
          const targetSection =
            modalForm.sectionId || libraryActiveSection || librarySections[0]
          if (!targetSection) {
            closeModal()
            return
          }
          const newItemBase = {
            id: `lib-item-${Date.now()}`,
            type: modalState.itemType,
            enabled: true,
          }
          const newItem =
            modalState.itemType === 'education'
              ? {
                  ...newItemBase,
                  label: `${modalForm.degree.trim()} - ${modalForm.school.trim()}`,
                  degree: modalForm.degree.trim(),
                  school: modalForm.school.trim(),
                  location: modalForm.location.trim(),
                  field: modalForm.field.trim(),
                  dates: modalForm.dates.trim(),
                  bullets: splitLines(modalForm.bullets),
                }
              : modalState.itemType === 'language'
                ? {
                    ...newItemBase,
                    label: 'Languages',
                    languages: splitList(modalForm.languages),
                  }
                : {
                    ...newItemBase,
                    label: modalForm.itemName.trim(),
                    name: modalForm.itemName.trim(),
                    subtitle: modalForm.subtitle.trim(),
                    location: modalForm.location.trim(),
                    dates: modalForm.dates.trim(),
                    details: splitLines(modalForm.details),
                  }
          setLibraryItems((items) => ({
            ...items,
            [targetSection]: [...(items[targetSection] ?? []), newItem],
          }))
        }
      } else {
        const targetSectionId =
          modalForm.sectionId || modalState.sectionId || resumeSections[0]?.id
        const hasRequiredField =
          modalState.itemType === 'education'
            ? modalForm.degree.trim() || modalForm.school.trim()
            : modalState.itemType === 'language'
              ? modalForm.languages.trim()
              : modalForm.itemName.trim()
        if (!targetSectionId || !hasRequiredField) {
          closeModal()
          return
        }

        if (modalState.mode === 'add') {
          const newId = `item-${Date.now()}`
          setResumeSections((sections) =>
            sections.map((section) =>
              section.id === targetSectionId
                ? {
                    ...section,
                    items: [
                      ...section.items,
                      modalState.itemType === 'education'
                        ? {
                            id: newId,
                            type: 'education',
                            label: `${modalForm.degree.trim()} - ${modalForm.school.trim()}`,
                            degree: modalForm.degree.trim(),
                            school: modalForm.school.trim(),
                            location: modalForm.location.trim(),
                            field: modalForm.field.trim(),
                            dates: modalForm.dates.trim(),
                            bullets: splitLines(modalForm.bullets),
                            enabled: true,
                          }
                        : modalState.itemType === 'language'
                          ? {
                              id: newId,
                              type: 'language',
                              label: 'Languages',
                              languages: splitList(modalForm.languages),
                              enabled: true,
                            }
                          : {
                              id: newId,
                              type: 'custom',
                              label: modalForm.itemName.trim(),
                              name: modalForm.itemName.trim(),
                              subtitle: modalForm.subtitle.trim(),
                              location: modalForm.location.trim(),
                              dates: modalForm.dates.trim(),
                              details: splitLines(modalForm.details),
                              enabled: true,
                            },
                    ],
                  }
                : section,
            ),
          )
        }

        if (modalState.mode === 'edit') {
          setResumeSections((sections) =>
            sections.map((section) =>
              section.id === targetSectionId
                ? {
                    ...section,
                    items: section.items.map((item) =>
                      item.id === modalState.itemId
                        ? modalState.itemType === 'education'
                          ? {
                              ...item,
                              label: `${modalForm.degree.trim()} - ${modalForm.school.trim()}`,
                              degree: modalForm.degree.trim(),
                              school: modalForm.school.trim(),
                              location: modalForm.location.trim(),
                              field: modalForm.field.trim(),
                              dates: modalForm.dates.trim(),
                              bullets: splitLines(modalForm.bullets),
                            }
                          : modalState.itemType === 'language'
                            ? {
                                ...item,
                                label: 'Languages',
                                languages: splitList(modalForm.languages),
                              }
                            : {
                                ...item,
                                label: modalForm.itemName.trim(),
                                name: modalForm.itemName.trim(),
                                subtitle: modalForm.subtitle.trim(),
                                location: modalForm.location.trim(),
                                dates: modalForm.dates.trim(),
                                details: splitLines(modalForm.details),
                              }
                        : item,
                    ),
                  }
                : section,
            ),
          )
        }
      }
    }

    closeModal()
  }

  const buildResumeFromState = () => {
    const educationSection = resumeSections.find(
      (section) => getSectionKind(section.title) === 'education',
    )
    const languageSection = resumeSections.find(
      (section) => getSectionKind(section.title) === 'language',
    )
    const customSections = resumeSections.filter(
      (section) =>
        !['education', 'language'].includes(getSectionKind(section.title)),
    )

    const educationItems = (educationSection?.items ?? [])
      .filter((item) => item.enabled)
      .map((item) => ({
        degree: item.degree || '',
        school: item.school || '',
        location: item.location || '',
        subtitle: item.field || '',
        dates: item.dates || '',
        bullets: item.bullets || [],
      }))

    const sections = customSections
      .map((section) => ({
        title: section.title.toUpperCase(),
        items: section.items
          .filter((item) => item.enabled)
          .map((item) => ({
            title: item.name || item.label || '',
            location: item.location || '',
            subtitle: item.subtitle || '',
            dates: item.dates || '',
            details: item.details || [],
          })),
      }))
      .filter((section) => section.items.length)

    const languageItem = (languageSection?.items ?? []).find(
      (item) => item.enabled,
    )
    const languages = languageItem?.languages?.length
      ? languageItem.languages
      : defaultResume.languages

    return {
      ...defaultResume,
      name: titleData.name || defaultResume.name,
      subtitle: titleData.subtitle || defaultResume.subtitle,
      contacts: titleData.contacts?.length
        ? titleData.contacts
        : defaultResume.contacts,
      education: educationItems,
      sections,
      languages,
    }
  }

  const handleDragEnd = (event) => {
    const { active, over } = event
    setActiveDragItem(null)
    setActiveDragSection(null)
    if (!over || active.id === over.id) {
      return
    }

    const activeType = active.data.current?.type
    const overType = over.data.current?.type

    if (
      activeType === 'library-section' &&
      (overType === 'section' ||
        overType === 'item' ||
        overType === 'resume-root')
    ) {
      const sectionTitle = active.data.current?.title
      const sectionItems = active.data.current?.items ?? []
      const targetSectionId =
        overType === 'item' ? over.data.current?.sectionId : over.id
      if (!sectionTitle) {
        return
      }

      if (overType === 'resume-root') {
        setResumeSections((sections) => [
          ...sections,
          buildResumeSectionFromLibrary(sectionTitle, sectionItems),
        ])
        return
      }

      if (!targetSectionId) {
        return
      }

      setResumeSections((sections) =>
        sections.map((section) => {
          if (section.id !== targetSectionId) {
            return section
          }
          const nextItems = [...section.items]
          sectionItems.forEach((libraryItem) => {
            nextItems.push(buildResumeItemFromLibrary(libraryItem, section.title))
          })
          return { ...section, items: nextItems }
        }),
      )
      return
    }

    if (activeType === 'library-item' && (overType === 'section' || overType === 'item')) {
      const libraryItem = active.data.current?.item
      const targetSectionId =
        overType === 'item' ? over.data.current?.sectionId : over.id
      if (!libraryItem || !targetSectionId) {
        return
      }

      setResumeSections((sections) =>
        sections.map((section) => {
          if (section.id !== targetSectionId) {
            return section
          }
          if (!isLibraryItemAllowed(libraryItem, section.title)) {
            return section
          }
          const newItem = buildResumeItemFromLibrary(libraryItem, section.title)
          const nextItems = [...section.items]
          if (overType === 'item') {
            const overIndex = nextItems.findIndex((item) => item.id === over.id)
            if (overIndex >= 0) {
              nextItems.splice(overIndex + 1, 0, newItem)
            } else {
              nextItems.push(newItem)
            }
          } else {
            nextItems.push(newItem)
          }
          return { ...section, items: nextItems }
        }),
      )
      return
    }

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

  const handleDragStart = (event) => {
    const activeType = event.active.data.current?.type
    if (activeType === 'library-item') {
      setActiveDragItem(event.active.data.current?.item ?? null)
      setActiveDragSection(null)
    } else if (activeType === 'library-section') {
      setActiveDragSection({
        title: event.active.data.current?.title ?? 'Section',
        count: event.active.data.current?.items?.length ?? 0,
      })
      setActiveDragItem(null)
    } else {
      setActiveDragItem(null)
      setActiveDragSection(null)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex w-full max-w-none flex-col gap-8 px-2 py-6 select-none">
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
                await buildResumePdf(buildResumeFromState())
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

        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr_1fr]">
            <LibraryPanel
              librarySections={librarySections}
              libraryItems={libraryItems}
              libraryActiveSection={libraryActiveSection}
              onSelectSection={setLibraryActiveSection}
              onAddSection={openAddSection}
              onAddItem={openAddItem}
            />
            <LivePdfPanel />
            <ResumePanel
              resumeSections={resumeSections}
              selectedResumeSectionId={selectedResumeSectionId}
              onSelectSection={setSelectedResumeSectionId}
              onToggleItem={toggleItem}
              onAddItem={openAddItem}
              onEditSection={openEditSection}
              onEditItem={openEditItem}
              onEditTitle={openEditTitle}
              resumeDropRef={setResumeDropRef}
              isResumeDropOver={isResumeDropOver}
              activeDragSection={activeDragSection}
            />
          </div>
          <DragOverlay>
            {activeDragItem ? (
              <div className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 shadow-2xl">
                {activeDragItem.label}
              </div>
            ) : activeDragSection ? (
              <div className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 shadow-2xl">
                {activeDragSection.title} ({activeDragSection.count})
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      <BuilderModal
        modalState={modalState}
        modalForm={modalForm}
        setModalForm={setModalForm}
        setModalState={setModalState}
        resumeSections={resumeSections}
        librarySections={librarySections}
        onSubmit={handleModalSubmit}
        onClose={closeModal}
        onBackdropClose={handleBackdropClose}
        getSectionKind={getSectionKind}
      />
      <DismissNotice
        visible={dismissNotice.visible}
        message={dismissNotice.message}
        onClose={() => setDismissNotice({ visible: false, message: '' })}
      />
    </div>
  )
}

export default Builder
