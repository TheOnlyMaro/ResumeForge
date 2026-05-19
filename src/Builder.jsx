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
  contacts: [
    { label: 'jordan.taylor@email.com', link: '' },
    { label: 'linkedin.com/in/jordantaylor', link: '' },
    { label: '555-0134', link: '' },
    { label: 'Austin, TX', link: '' },
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
  doc.setFont('Calibri', 'normal')
  doc.setFontSize(10)
  const rawContacts = resume.contacts ?? resume.contact ?? []
  const contactEntries = rawContacts
    .map((entry) => {
      if (typeof entry === 'string') {
        return { label: entry.trim(), link: '' }
      }
      return {
        label: (entry.label || '').trim(),
        link: (entry.link || '').trim(),
      }
    })
    .filter((entry) => entry.label)

  const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  const normalizeLink = (value, label) => {
    const trimmed = (value || '').trim()
    const fallbackLabel = (label || '').trim()
    if (!trimmed) {
      return isEmail(fallbackLabel) ? `mailto:${fallbackLabel}` : ''
    }
    if (/^[a-z][a-z0-9+.-]*:/.test(trimmed)) {
      return trimmed
    }
    if (isEmail(trimmed)) {
      return `mailto:${trimmed}`
    }
    return `https://${trimmed}`
  }

  const separator = ' | '
  const separatorWidth = doc.getTextWidth(separator)
  const entryWidths = contactEntries.map((entry) =>
    doc.getTextWidth(entry.label),
  )
  const totalWidth =
    entryWidths.reduce((sum, width) => sum + width, 0) +
    separatorWidth * Math.max(0, contactEntries.length - 1)
  let x = centerX - totalWidth / 2

  contactEntries.forEach((entry, index) => {
    const link = normalizeLink(entry.link, entry.label)
    if (link) {
      doc.setTextColor(30, 99, 187)
      doc.textWithLink(entry.label, x, y, { url: link })
      const width = entryWidths[index]
      doc.setDrawColor(30, 99, 187)
      doc.setLineWidth(0.6)
      doc.line(x, y + 2, x + width, y + 2)
      doc.setTextColor(0, 0, 0)
      doc.setDrawColor(0, 0, 0)
    } else {
      doc.text(entry.label, x, y)
    }
    x += entryWidths[index]
    if (index < contactEntries.length - 1) {
      doc.text(separator, x, y)
      x += separatorWidth
    }
  })

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
  const [modalState, setModalState] = useState({
    open: false,
    mode: 'add',
    type: 'item',
    target: 'resume',
    itemType: 'custom',
    sectionId: null,
    itemId: null,
  })
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
        titleData.contacts?.map((entry) => ({ ...entry })) ??
        prev.contacts,
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
                    onClick={(event) => {
                      event.preventDefault()
                      event.stopPropagation()
                      openAddSection('library')
                    }}
                    className="rounded-md border border-slate-700 px-2 py-0.5 text-[10px] uppercase text-slate-400"
                  >
                    Add
                  </button>
                </summary>
                <div className="flex flex-col gap-3">
                  {librarySections.map((item) => (
                    <div
                      key={item}
                      className={`flex items-center justify-between rounded-2xl border px-4 py-3 transition hover:border-slate-700 hover:bg-slate-950/60 ${
                        libraryActiveSection === item
                          ? 'border-slate-600 bg-slate-900/50'
                          : 'border-slate-800 bg-slate-950/40'
                      }`}
                      onClick={() => setLibraryActiveSection(item)}
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
                    onClick={(event) => {
                      event.preventDefault()
                      event.stopPropagation()
                      openAddItem('', 'library')
                    }}
                    className="rounded-md border border-slate-700 px-2 py-0.5 text-[10px] uppercase text-slate-400"
                  >
                    Add
                  </button>
                </summary>
                <div className="flex flex-col gap-3">
                  {(libraryItems[libraryActiveSection] ?? []).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/40 px-4 py-3 transition hover:border-slate-700 hover:bg-slate-950/60"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500">::</span>
                        <span className="text-sm text-slate-200">{item.label}</span>
                      </div>
                      <span className="text-xs text-slate-500">Drag</span>
                    </div>
                  ))}
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
                    onClick={openEditTitle}
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
                      onAddItem={openAddItem}
                      onEditSection={openEditSection}
                      onEditItem={openEditItem}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </div>
          </section>
        </div>
      </div>

      {modalState.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4"
          onClick={handleBackdropClose}
        >
          <div
            className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-100 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                {modalState.mode === 'add' ? 'Add' : 'Edit'}{' '}
                {modalState.type === 'title'
                  ? 'Title'
                  : modalState.type === 'section'
                    ? 'Section'
                    : 'Item'}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full border border-slate-700 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-300"
              >
                Close
              </button>
            </div>
            <form
              className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-2 select-text"
              onSubmit={handleModalSubmit}
            >
              {modalState.type === 'title' ? (
                <div className="flex flex-col gap-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="text-sm text-slate-300">
                      Name (bold)
                      <input
                        type="text"
                        value={modalForm.name}
                        onChange={(event) =>
                          setModalForm((prev) => ({
                            ...prev,
                            name: event.target.value,
                          }))
                        }
                        className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100"
                      />
                    </label>
                    <label className="text-sm text-slate-300">
                      Subtitle (italic)
                      <input
                        type="text"
                        value={modalForm.subtitle}
                        onChange={(event) =>
                          setModalForm((prev) => ({
                            ...prev,
                            subtitle: event.target.value,
                          }))
                        }
                        className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100"
                      />
                    </label>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {modalForm.contacts.map((entry, index) => (
                      <div
                        key={`contact-${index}`}
                        className="rounded-xl border border-slate-800 bg-slate-950/40 p-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
                            Contact
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setModalForm((prev) => ({
                                ...prev,
                                contacts: prev.contacts.filter(
                                  (_, itemIndex) => itemIndex !== index,
                                ),
                              }))
                            }
                            className="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] uppercase text-slate-400"
                          >
                            Remove
                          </button>
                        </div>
                        <input
                          type="text"
                          value={entry.label}
                          onChange={(event) =>
                            setModalForm((prev) => ({
                              ...prev,
                              contacts: prev.contacts.map((item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, label: event.target.value }
                                  : item,
                              ),
                            }))
                          }
                          className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                        />
                        <label className="mt-3 block text-xs uppercase tracking-[0.2em] text-slate-400">
                          Link
                          <input
                            type="text"
                            value={entry.link}
                            onChange={(event) =>
                              setModalForm((prev) => ({
                                ...prev,
                                contacts: prev.contacts.map((item, itemIndex) =>
                                  itemIndex === index
                                    ? { ...item, link: event.target.value }
                                    : item,
                                ),
                              }))
                            }
                            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                          />
                        </label>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setModalForm((prev) => ({
                        ...prev,
                        contacts: [...prev.contacts, { label: '', link: '' }],
                      }))
                    }
                    className="rounded-full border border-slate-700 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-300"
                  >
                    Add contact
                  </button>
                </div>
              ) : modalState.type === 'section' ? (
                <label className="text-sm text-slate-300">
                  Section title
                  <input
                    type="text"
                    value={modalForm.title}
                    onChange={(event) =>
                      setModalForm((prev) => ({
                        ...prev,
                        title: event.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100"
                  />
                </label>
              ) : (
                <>
                  {modalState.itemType === 'education' && (
                    <>
                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="text-sm text-slate-300">
                          Degree / Faculty (bold)
                          <input
                            type="text"
                            value={modalForm.degree}
                            onChange={(event) =>
                              setModalForm((prev) => ({
                                ...prev,
                                degree: event.target.value,
                              }))
                            }
                            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100"
                          />
                        </label>
                        <label className="text-sm text-slate-300">
                          University / School (bold)
                          <input
                            type="text"
                            value={modalForm.school}
                            onChange={(event) =>
                              setModalForm((prev) => ({
                                ...prev,
                                school: event.target.value,
                              }))
                            }
                            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100"
                          />
                        </label>
                        <label className="text-sm text-slate-300">
                          Location
                          <input
                            type="text"
                            value={modalForm.location}
                            onChange={(event) =>
                              setModalForm((prev) => ({
                                ...prev,
                                location: event.target.value,
                              }))
                            }
                            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100"
                          />
                        </label>
                        <label className="text-sm text-slate-300">
                          Program / Field (italic)
                          <input
                            type="text"
                            value={modalForm.field}
                            onChange={(event) =>
                              setModalForm((prev) => ({
                                ...prev,
                                field: event.target.value,
                              }))
                            }
                            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100"
                          />
                        </label>
                        <label className="text-sm text-slate-300">
                          Dates
                          <input
                            type="text"
                            value={modalForm.dates}
                            onChange={(event) =>
                              setModalForm((prev) => ({
                                ...prev,
                                dates: event.target.value,
                              }))
                            }
                            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100"
                          />
                        </label>
                      </div>
                      <label className="text-sm text-slate-300">
                        Bullet points (one per line)
                        <textarea
                          rows={3}
                          value={modalForm.bullets}
                          onChange={(event) =>
                            setModalForm((prev) => ({
                              ...prev,
                              bullets: event.target.value,
                            }))
                          }
                          className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100"
                        />
                      </label>
                    </>
                  )}
                  {modalState.itemType === 'custom' && (
                    <>
                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="text-sm text-slate-300">
                          Item name (bold)
                          <input
                            type="text"
                            value={modalForm.itemName}
                            onChange={(event) =>
                              setModalForm((prev) => ({
                                ...prev,
                                itemName: event.target.value,
                              }))
                            }
                            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100"
                          />
                        </label>
                        <label className="text-sm text-slate-300">
                          Location
                          <input
                            type="text"
                            value={modalForm.location}
                            onChange={(event) =>
                              setModalForm((prev) => ({
                                ...prev,
                                location: event.target.value,
                              }))
                            }
                            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100"
                          />
                        </label>
                        <label className="text-sm text-slate-300">
                          Subtitle (italic)
                          <input
                            type="text"
                            value={modalForm.subtitle}
                            onChange={(event) =>
                              setModalForm((prev) => ({
                                ...prev,
                                subtitle: event.target.value,
                              }))
                            }
                            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100"
                          />
                        </label>
                        <label className="text-sm text-slate-300">
                          Dates
                          <input
                            type="text"
                            value={modalForm.dates}
                            onChange={(event) =>
                              setModalForm((prev) => ({
                                ...prev,
                                dates: event.target.value,
                              }))
                            }
                            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100"
                          />
                        </label>
                      </div>
                      <label className="text-sm text-slate-300">
                        Details (one per line)
                        <textarea
                          rows={3}
                          value={modalForm.details}
                          onChange={(event) =>
                            setModalForm((prev) => ({
                              ...prev,
                              details: event.target.value,
                            }))
                          }
                          className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100"
                        />
                      </label>
                    </>
                  )}
                  {modalState.itemType === 'language' && (
                    <label className="text-sm text-slate-300">
                      Languages (one per line)
                      <textarea
                        rows={4}
                        value={modalForm.languages}
                        onChange={(event) =>
                          setModalForm((prev) => ({
                            ...prev,
                            languages: event.target.value,
                          }))
                        }
                        className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100"
                      />
                    </label>
                  )}
                  {modalState.mode === 'edit' && (
                    <label className="text-sm text-slate-300">
                      Section
                      <select
                        value={modalForm.sectionId}
                        onChange={(event) => {
                          const nextSectionId = event.target.value
                          setModalForm((prev) => ({
                            ...prev,
                            sectionId: nextSectionId,
                          }))
                          const nextTitle =
                            modalState.target === 'library'
                              ? nextSectionId
                              : resumeSections.find(
                                  (section) => section.id === nextSectionId,
                                )?.title
                          if (nextTitle) {
                            setModalState((prev) => ({
                              ...prev,
                              itemType: getSectionKind(nextTitle),
                            }))
                          }
                        }}
                        className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100"
                      >
                        <option value="">Select section</option>
                        {(modalState.target === 'library'
                          ? librarySections
                          : resumeSections.map((section) => section.id)
                        ).map((sectionKey) => {
                          const section = resumeSections.find(
                            (entry) => entry.id === sectionKey,
                          )
                          const label = section ? section.title : sectionKey
                          return (
                            <option key={sectionKey} value={sectionKey}>
                              {label}
                            </option>
                          )
                        })}
                      </select>
                    </label>
                  )}
                </>
              )}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-full border border-slate-700 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-900 transition hover:bg-slate-900 hover:text-white"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {dismissNotice.visible && (
        <div className="fixed bottom-6 left-1/2 z-50 w-[min(92vw,420px)] -translate-x-1/2 rounded-2xl border border-amber-400/40 bg-gradient-to-br from-amber-500/20 via-slate-950/95 to-slate-950/90 px-5 py-3 text-sm text-slate-100 shadow-[0_20px_60px_rgba(15,23,42,0.6)]">
          <div className="flex items-center justify-between">
            <span className="uppercase tracking-[0.2em] text-[10px] text-amber-200">
              Notice
            </span>
            <button
              type="button"
              onClick={() => setDismissNotice({ visible: false, message: '' })}
              className="rounded-full border border-amber-200/40 px-2 py-0.5 text-[10px] uppercase text-amber-100"
            >
              Close
            </button>
          </div>
          <p className="mt-2 text-sm text-amber-50">{dismissNotice.message}</p>
        </div>
      )}
    </div>
  )
}

function SortableSectionCard({
  section,
  onToggleItem,
  onAddItem,
  onEditSection,
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
          onClick={() => onAddItem(section.id)}
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
              onEditItem={onEditItem}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  )
}

function SortableItemRow({ item, sectionId, onToggleItem, onEditItem }) {
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
        <button type="button" onClick={() => onEditItem(sectionId, item.id)}>
          Edit
        </button>
        <button type="button">X</button>
      </div>
    </div>
  )
}

export default Builder
