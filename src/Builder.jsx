import { useState, useMemo, useEffect } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  pointerWithin,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { defaultResume } from './data/defaultResume'
import { buildResumePdf } from './pdf/buildResumePdf'
import BuilderModal from './components/builder/BuilderModal'
import DismissNotice from './components/builder/DismissNotice'
import LibraryPanel from './components/builder/LibraryPanel'
import LivePdfPanel from './components/builder/LivePdfPanel'
import ResumePanel from './components/builder/ResumePanel'
import WorkspaceBar from './components/builder/WorkspaceBar'

let idCounter = 0
const generateId = (prefix) => {
  idCounter++
  const randomPart = Math.random().toString(36).substring(2, 9)
  return `${prefix}-${Date.now()}-${idCounter}-${randomPart}`
}

const DEFAULT_RESUME_SECTIONS = [
  {
    id: 'education',
    title: 'Education',
    kind: 'education',
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
    kind: 'custom',
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
]

const DEFAULT_LIBRARY_SECTIONS = ['Experience', 'Projects', 'Skills']

const DEFAULT_LIBRARY_ITEMS = {
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
}

const DEFAULT_TITLE_DATA = {
  name: defaultResume.name,
  subtitle: defaultResume.subtitle,
  contacts: defaultResume.contacts.map((entry) => ({ ...entry })),
}

function Builder({ onNavigate }) {
  const [resumeSections, setResumeSections] = useState([
    {
      id: 'education',
      title: 'Education',
      kind: 'education',
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
      kind: 'custom',
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
  const [activeDragItem, setActiveDragItem] = useState(null)
  const [activeDragSection, setActiveDragSection] = useState(null)
  const [librarySectionInsertIndex, setLibrarySectionInsertIndex] = useState(-1)
  const [libraryItemInsert, setLibraryItemInsert] = useState({
    sectionId: null,
    index: -1,
  })
  const [dismissNotice, setDismissNotice] = useState({
    visible: false,
    message: '',
  })

  // ── Data Persistence: States & Workspace Engine (Phase 2) ───────
  const [resumes, setResumes] = useState([])
  const [activeResumeId, setActiveResumeId] = useState('')
  const [masterCvs, setMasterCvs] = useState([])
  const [activeMasterCvId, setActiveMasterCvId] = useState('')
  const [autosaveEnabled, setAutosaveEnabled] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  // saveWorkspace always requires explicit snapshots for all mutable data.
  // Never rely on closure-captured state to avoid cross-file seeping.
  const saveWorkspace = ({
    resumesList = resumes,
    activeId = activeResumeId,
    activeSections = resumeSections,
    activeTitleData = titleData,
    masterCvsList = masterCvs,
    activeCvId = activeMasterCvId,
    activeLibrarySections = librarySections,
    activeLibraryItems = libraryItems,
    autosave = autosaveEnabled,
  } = {}) => {
    const updatedResumes = resumesList.map((r) => {
      if (r.id === activeId) {
        return {
          ...r,
          resumeSections: activeSections,
          titleData: activeTitleData,
          updatedAt: Date.now(),
        }
      }
      return r
    })

    const updatedMasterCvs = masterCvsList.map((cv) => {
      if (cv.id === activeCvId) {
        return {
          ...cv,
          librarySections: activeLibrarySections,
          libraryItems: activeLibraryItems,
          updatedAt: Date.now(),
        }
      }
      return cv
    })

    const workspaceState = {
      activeResumeId: activeId,
      activeMasterCvId: activeCvId,
      autosaveEnabled: autosave,
      resumes: updatedResumes,
      masterCvs: updatedMasterCvs,
    }

    localStorage.setItem('resume_forge_workspace_v1', JSON.stringify(workspaceState))
  }

  const initializeDefaults = () => {
    const defaultCv = {
      id: 'cv-1',
      name: "Maro's Master CV",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      librarySections: DEFAULT_LIBRARY_SECTIONS,
      libraryItems: DEFAULT_LIBRARY_ITEMS,
    }
    const defaultRes1 = {
      id: 'resume-1',
      name: 'Harvard Template Resume',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      titleData: DEFAULT_TITLE_DATA,
      resumeSections: DEFAULT_RESUME_SECTIONS,
    }
    const defaultRes2 = {
      id: 'resume-2',
      name: 'Software Engineer Resume',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      titleData: {
        name: 'Maro (Software Engineer)',
        subtitle: 'Lead Software Engineer',
        contacts: defaultResume.contacts.map((entry) => ({ ...entry })),
      },
      resumeSections: DEFAULT_RESUME_SECTIONS,
    }

    const initialWorkspace = {
      activeResumeId: 'resume-1',
      activeMasterCvId: 'cv-1',
      autosaveEnabled: false,
      resumes: [defaultRes1, defaultRes2],
      masterCvs: [defaultCv],
    }

    setResumes([defaultRes1, defaultRes2])
    setActiveResumeId('resume-1')
    setResumeSections(DEFAULT_RESUME_SECTIONS)
    setTitleData(DEFAULT_TITLE_DATA)

    setMasterCvs([defaultCv])
    setActiveMasterCvId('cv-1')
    setLibrarySections(DEFAULT_LIBRARY_SECTIONS)
    setLibraryItems(DEFAULT_LIBRARY_ITEMS)
    setLibraryActiveSection(DEFAULT_LIBRARY_SECTIONS[0])

    setAutosaveEnabled(false)
    localStorage.setItem('resume_forge_workspace_v1', JSON.stringify(initialWorkspace))
  }

  // Load state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('resume_forge_workspace_v1')
    if (saved) {
      try {
        const workspace = JSON.parse(saved)

        if (workspace.autosaveEnabled !== undefined) {
          setAutosaveEnabled(workspace.autosaveEnabled)
        }

        if (workspace.masterCvs && workspace.masterCvs.length > 0) {
          setMasterCvs(workspace.masterCvs)
          const activeCvId = workspace.activeMasterCvId || workspace.masterCvs[0].id
          setActiveMasterCvId(activeCvId)

          const activeCv = workspace.masterCvs.find((c) => c.id === activeCvId)
          if (activeCv) {
            setLibrarySections(activeCv.librarySections || [])
            setLibraryItems(activeCv.libraryItems || {})
            if (activeCv.librarySections && activeCv.librarySections.length > 0) {
              setLibraryActiveSection(activeCv.librarySections[0])
            }
          }
        } else {
          const defaultCv = {
            id: 'cv-1',
            name: "Maro's Master CV",
            createdAt: Date.now(),
            updatedAt: Date.now(),
            librarySections: DEFAULT_LIBRARY_SECTIONS,
            libraryItems: DEFAULT_LIBRARY_ITEMS,
          }
          setMasterCvs([defaultCv])
          setActiveMasterCvId('cv-1')
          setLibrarySections(DEFAULT_LIBRARY_SECTIONS)
          setLibraryItems(DEFAULT_LIBRARY_ITEMS)
          setLibraryActiveSection(DEFAULT_LIBRARY_SECTIONS[0])
        }

        if (workspace.resumes && workspace.resumes.length > 0) {
          setResumes(workspace.resumes)
          const activeId = workspace.activeResumeId || workspace.resumes[0].id
          setActiveResumeId(activeId)

          const activeRes = workspace.resumes.find((r) => r.id === activeId)
          if (activeRes) {
            setResumeSections(activeRes.resumeSections || [])
            setTitleData(activeRes.titleData || { name: '', subtitle: '', contacts: [] })
          }
        } else {
          const defaultRes1 = {
            id: 'resume-1',
            name: 'Harvard Template Resume',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            titleData: DEFAULT_TITLE_DATA,
            resumeSections: DEFAULT_RESUME_SECTIONS,
          }
          setResumes([defaultRes1])
          setActiveResumeId('resume-1')
          setResumeSections(DEFAULT_RESUME_SECTIONS)
          setTitleData(DEFAULT_TITLE_DATA)
        }
      } catch (e) {
        console.error('Failed to load workspace, resetting defaults:', e)
        initializeDefaults()
      }
    } else {
      initializeDefaults()
    }
    setIsLoaded(true)
  }, [])

  // Autosave triggers on state edits (only after isLoaded is set to true).
  // Pass all snapshots explicitly so the save always captures the correct data
  // for the correct file — never stale closure values.
  useEffect(() => {
    if (isLoaded && autosaveEnabled) {
      saveWorkspace({
        resumesList: resumes,
        activeId: activeResumeId,
        activeSections: resumeSections,
        activeTitleData: titleData,
        masterCvsList: masterCvs,
        activeCvId: activeMasterCvId,
        activeLibrarySections: librarySections,
        activeLibraryItems: libraryItems,
        autosave: autosaveEnabled,
      })
    }
  }, [
    isLoaded,
    autosaveEnabled,
    resumeSections,
    titleData,
    librarySections,
    libraryItems,
    resumes,
    masterCvs,
    activeResumeId,
    activeMasterCvId,
  ])

  // ── Workspace Swivel & File Handlers ─────────────────────────────
  const switchActiveResume = (newId) => {
    if (newId === activeResumeId) return

    // Capture current in-flight data before switching
    const outgoingSections = resumeSections
    const outgoingTitle = titleData

    setResumes((prevResumes) => {
      // Flush outgoing file's current edits into the array
      const updated = prevResumes.map((r) => {
        if (r.id === activeResumeId) {
          return {
            ...r,
            resumeSections: outgoingSections,
            titleData: outgoingTitle,
            updatedAt: Date.now(),
          }
        }
        return r
      })

      // Load incoming file's data
      const targetResume = updated.find((r) => r.id === newId)
      const incomingSections = targetResume?.resumeSections ?? []
      const incomingTitle = targetResume?.titleData ?? { name: '', subtitle: '', contacts: [] }

      setResumeSections(incomingSections)
      setTitleData(incomingTitle)

      // Save with explicit snapshots — incoming data for incoming ID, outgoing already flushed
      saveWorkspace({
        resumesList: updated,
        activeId: newId,
        activeSections: incomingSections,
        activeTitleData: incomingTitle,
        masterCvsList: masterCvs,
        activeCvId: activeMasterCvId,
        activeLibrarySections: librarySections,
        activeLibraryItems: libraryItems,
        autosave: autosaveEnabled,
      })

      return updated
    })
    setActiveResumeId(newId)
    const targetName = resumes.find((r) => r.id === newId)?.name || 'selected resume'
    showDismissNotice(`Switched active resume to "${targetName}"!`)
  }

  const switchActiveMasterCv = (newId) => {
    if (newId === activeMasterCvId) return

    // Capture current in-flight data before switching
    const outgoingLibrarySections = librarySections
    const outgoingLibraryItems = libraryItems

    setMasterCvs((prevCvs) => {
      // Flush outgoing CV's current edits
      const updated = prevCvs.map((cv) => {
        if (cv.id === activeMasterCvId) {
          return {
            ...cv,
            librarySections: outgoingLibrarySections,
            libraryItems: outgoingLibraryItems,
            updatedAt: Date.now(),
          }
        }
        return cv
      })

      // Load incoming CV's data
      const targetCv = updated.find((cv) => cv.id === newId)
      const incomingLibSections = targetCv?.librarySections ?? []
      const incomingLibItems = targetCv?.libraryItems ?? {}

      setLibrarySections(incomingLibSections)
      setLibraryItems(incomingLibItems)
      if (incomingLibSections.length > 0) {
        setLibraryActiveSection(incomingLibSections[0])
      }

      // Save with explicit snapshots
      saveWorkspace({
        resumesList: resumes,
        activeId: activeResumeId,
        activeSections: resumeSections,
        activeTitleData: titleData,
        masterCvsList: updated,
        activeCvId: newId,
        activeLibrarySections: incomingLibSections,
        activeLibraryItems: incomingLibItems,
        autosave: autosaveEnabled,
      })

      return updated
    })
    setActiveMasterCvId(newId)
    const targetName = masterCvs.find((cv) => cv.id === newId)?.name || 'selected Master CV'
    showDismissNotice(`Switched active Master CV to "${targetName}"!`)
  }

  const renameResume = (id, currentName) => {
    const newName = prompt('Enter a new filename for this Resume:', currentName)
    if (newName && newName.trim()) {
      setResumes((prev) => {
        const updated = prev.map((r) =>
          r.id === id ? { ...r, name: newName.trim(), updatedAt: Date.now() } : r
        )
        saveWorkspace({
          resumesList: updated,
          activeId: activeResumeId,
          activeSections: resumeSections,
          activeTitleData: titleData,
          masterCvsList: masterCvs,
          activeCvId: activeMasterCvId,
          activeLibrarySections: librarySections,
          activeLibraryItems: libraryItems,
          autosave: autosaveEnabled,
        })
        return updated
      })
      showDismissNotice(`Renamed Resume file to "${newName.trim()}"!`)
    }
  }

  const renameMasterCv = (id, currentName) => {
    const newName = prompt('Enter a new filename for this Master CV:', currentName)
    if (newName && newName.trim()) {
      setMasterCvs((prev) => {
        const updated = prev.map((c) =>
          c.id === id ? { ...c, name: newName.trim(), updatedAt: Date.now() } : c
        )
        saveWorkspace({
          resumesList: resumes,
          activeId: activeResumeId,
          activeSections: resumeSections,
          activeTitleData: titleData,
          masterCvsList: updated,
          activeCvId: activeMasterCvId,
          activeLibrarySections: librarySections,
          activeLibraryItems: libraryItems,
          autosave: autosaveEnabled,
        })
        return updated
      })
      showDismissNotice(`Renamed Master CV file to "${newName.trim()}"!`)
    }
  }

  const deleteResume = (id) => {
    const target = resumes.find((r) => r.id === id)
    if (resumes.length <= 1) {
      alert('You must maintain at least one Resume file.')
      return
    }
    if (confirm(`Are you sure you want to delete "${target?.name}"?`)) {
      setResumes((prev) => {
        const updated = prev.filter((r) => r.id !== id)
        let nextActiveId = activeResumeId
        let nextSections = resumeSections
        let nextTitleData = titleData
        if (id === activeResumeId) {
          nextActiveId = updated[0].id
          const nextResume = updated[0]
          nextSections = nextResume.resumeSections || []
          nextTitleData = nextResume.titleData || { name: '', subtitle: '', contacts: [] }
          setResumeSections(nextSections)
          setTitleData(nextTitleData)
          setActiveResumeId(nextActiveId)
        }
        saveWorkspace({
          resumesList: updated,
          activeId: nextActiveId,
          activeSections: nextSections,
          activeTitleData: nextTitleData,
          masterCvsList: masterCvs,
          activeCvId: activeMasterCvId,
          activeLibrarySections: librarySections,
          activeLibraryItems: libraryItems,
          autosave: autosaveEnabled,
        })
        return updated
      })
      showDismissNotice(`Deleted resume file "${target?.name}".`)
    }
  }

  const deleteMasterCv = (id) => {
    const target = masterCvs.find((c) => c.id === id)
    if (masterCvs.length <= 1) {
      alert('You must maintain at least one Master CV file.')
      return
    }
    if (confirm(`Are you sure you want to delete "${target?.name}"?`)) {
      setMasterCvs((prev) => {
        const updated = prev.filter((c) => c.id !== id)
        let nextActiveCvId = activeMasterCvId
        let nextLibSections = librarySections
        let nextLibItems = libraryItems
        if (id === activeMasterCvId) {
          nextActiveCvId = updated[0].id
          const nextCv = updated[0]
          nextLibSections = nextCv.librarySections || []
          nextLibItems = nextCv.libraryItems || {}
          setLibrarySections(nextLibSections)
          setLibraryItems(nextLibItems)
          if (nextLibSections.length > 0) {
            setLibraryActiveSection(nextLibSections[0])
          }
          setActiveMasterCvId(nextActiveCvId)
        }
        saveWorkspace({
          resumesList: resumes,
          activeId: activeResumeId,
          activeSections: resumeSections,
          activeTitleData: titleData,
          masterCvsList: updated,
          activeCvId: nextActiveCvId,
          activeLibrarySections: nextLibSections,
          activeLibraryItems: nextLibItems,
          autosave: autosaveEnabled,
        })
        return updated
      })
      showDismissNotice(`Deleted Master CV file "${target?.name}".`)
    }
  }

  const duplicateResume = (id) => {
    const target = resumes.find((r) => r.id === id)
    if (!target) return
    const currentSections = id === activeResumeId ? resumeSections : target.resumeSections
    const currentTitle = id === activeResumeId ? titleData : target.titleData

    const newResume = {
      id: generateId('resume'),
      name: `${target.name} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      resumeSections: JSON.parse(JSON.stringify(currentSections)),
      titleData: JSON.parse(JSON.stringify(currentTitle)),
    }
    setResumes((prev) => {
      const updated = [...prev, newResume]
      setResumeSections(newResume.resumeSections)
      setTitleData(newResume.titleData)
      setActiveResumeId(newResume.id)
      saveWorkspace({
        resumesList: updated,
        activeId: newResume.id,
        activeSections: newResume.resumeSections,
        activeTitleData: newResume.titleData,
        masterCvsList: masterCvs,
        activeCvId: activeMasterCvId,
        activeLibrarySections: librarySections,
        activeLibraryItems: libraryItems,
        autosave: autosaveEnabled,
      })
      return updated
    })
    showDismissNotice(`Duplicated and switched to "${newResume.name}"!`)
  }

  const createEmptyResume = () => {
    const newResume = {
      id: generateId('resume'),
      name: `Untitled Resume (${resumes.length + 1})`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      titleData: {
        name: 'Your Name',
        subtitle: 'Your Professional Title',
        contacts: [],
      },
      resumeSections: [],
    }
    setResumes((prev) => {
      const updated = [...prev, newResume]
      setResumeSections([])
      setTitleData(newResume.titleData)
      setActiveResumeId(newResume.id)
      saveWorkspace({
        resumesList: updated,
        activeId: newResume.id,
        activeSections: [],
        activeTitleData: newResume.titleData,
        masterCvsList: masterCvs,
        activeCvId: activeMasterCvId,
        activeLibrarySections: librarySections,
        activeLibraryItems: libraryItems,
        autosave: autosaveEnabled,
      })
      return updated
    })
    showDismissNotice(`Created empty resume "${newResume.name}"!`)
  }

  const createResumeFromMasterCv = () => {
    const activeCv = masterCvs.find((cv) => cv.id === activeMasterCvId)
    if (!activeCv) return

    const newSections = (activeCv.librarySections || []).map((sectionTitle) => {
      const items = activeCv.libraryItems[sectionTitle] || []
      const kind = inferKindFromTitle(sectionTitle)
      return {
        id: generateId('section'),
        title: sectionTitle,
        kind: kind,
        items: items.map((item) => buildResumeItemFromLibrary(item, kind)),
      }
    })

    const newResume = {
      id: generateId('resume'),
      name: `Resume from Master CV (${resumes.length + 1})`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      titleData: {
        name: 'Your Name',
        subtitle: 'Your Professional Title',
        contacts: [],
      },
      resumeSections: newSections,
    }
    setResumes((prev) => {
      const updated = [...prev, newResume]
      setResumeSections(newSections)
      setTitleData(newResume.titleData)
      setActiveResumeId(newResume.id)
      saveWorkspace({
        resumesList: updated,
        activeId: newResume.id,
        activeSections: newSections,
        activeTitleData: newResume.titleData,
        masterCvsList: masterCvs,
        activeCvId: activeMasterCvId,
        activeLibrarySections: librarySections,
        activeLibraryItems: libraryItems,
        autosave: autosaveEnabled,
      })
      return updated
    })
    showDismissNotice(`Created new resume from Master CV: "${newResume.name}"!`)
  }

  const createNewMasterCv = () => {
    const newCv = {
      id: generateId('cv'),
      name: `Untitled Master CV (${masterCvs.length + 1})`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      librarySections: ['Experience', 'Projects', 'Skills'],
      libraryItems: {
        Experience: [],
        Projects: [],
        Skills: [],
      },
    }
    setMasterCvs((prev) => {
      const updated = [...prev, newCv]
      setLibrarySections(newCv.librarySections)
      setLibraryItems(newCv.libraryItems)
      setLibraryActiveSection('Experience')
      setActiveMasterCvId(newCv.id)
      saveWorkspace({
        resumesList: resumes,
        activeId: activeResumeId,
        activeSections: resumeSections,
        activeTitleData: titleData,
        masterCvsList: updated,
        activeCvId: newCv.id,
        activeLibrarySections: newCv.librarySections,
        activeLibraryItems: newCv.libraryItems,
        autosave: autosaveEnabled,
      })
      return updated
    })
    showDismissNotice(`Created and switched to Master CV "${newCv.name}"!`)
  }

  const handleToggleAutosave = () => {
    const nextVal = !autosaveEnabled
    setAutosaveEnabled(nextVal)
    saveWorkspace({
      resumesList: resumes,
      activeId: activeResumeId,
      activeSections: resumeSections,
      activeTitleData: titleData,
      masterCvsList: masterCvs,
      activeCvId: activeMasterCvId,
      activeLibrarySections: librarySections,
      activeLibraryItems: libraryItems,
      autosave: nextVal,
    })
    showDismissNotice(`Autosave is now turned ${nextVal ? 'ON' : 'OFF'}!`)
  }

  const handleManualSave = () => {
    saveWorkspace({
      resumesList: resumes,
      activeId: activeResumeId,
      activeSections: resumeSections,
      activeTitleData: titleData,
      masterCvsList: masterCvs,
      activeCvId: activeMasterCvId,
      activeLibrarySections: librarySections,
      activeLibraryItems: libraryItems,
      autosave: autosaveEnabled,
    })
    showDismissNotice('All changes manually saved to local storage!')
  }

  const triggerJsonImport = () => {
    const fileInput = document.createElement('input')
    fileInput.type = 'file'
    fileInput.accept = '.json'
    fileInput.onchange = (e) => {
      const file = e.target.files[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target.result)
          
          // Structural validation
          if (parsed.fileType === 'resume_forge_resume') {
            if (!parsed.resumeSections || !parsed.titleData) {
              alert('Invalid Resume JSON structure: missing sections or title data.')
              return
            }
            
            const activeResName = resumes.find(r => r.id === activeResumeId)?.name || 'Untitled'
            const importChoice = prompt(
              `Importing Resume: "${parsed.name || 'Untitled'}"\n\nType '1' to Import as a NEW Resume\nType '2' to OVERWRITE your active Resume ("${activeResName}")`,
              "1"
            )
            if (!importChoice) return
            const choice = importChoice.trim()
            
            if (choice === '1') {
              const newResume = {
                id: generateId('resume'),
                name: parsed.name ? `${parsed.name} (Imported)` : `Imported Resume (${resumes.length + 1})`,
                createdAt: parsed.createdAt || Date.now(),
                updatedAt: Date.now(),
                titleData: parsed.titleData,
                resumeSections: parsed.resumeSections,
              }
              setResumes((prev) => {
                const updated = [...prev, newResume]
                setResumeSections(newResume.resumeSections)
                setTitleData(newResume.titleData)
                setActiveResumeId(newResume.id)
                saveWorkspace({
                  resumesList: updated,
                  activeId: newResume.id,
                  activeSections: newResume.resumeSections,
                  activeTitleData: newResume.titleData,
                  masterCvsList: masterCvs,
                  activeCvId: activeMasterCvId,
                  activeLibrarySections: librarySections,
                  activeLibraryItems: libraryItems,
                  autosave: autosaveEnabled,
                })
                return updated
              })
              showDismissNotice(`Imported new Resume "${newResume.name}"!`)
            } else if (choice === '2') {
              setResumeSections(parsed.resumeSections)
              setTitleData(parsed.titleData)
              setResumes((prev) => {
                const updated = prev.map((r) =>
                  r.id === activeResumeId
                    ? {
                        ...r,
                        name: parsed.name || r.name,
                        updatedAt: Date.now(),
                        resumeSections: parsed.resumeSections,
                        titleData: parsed.titleData,
                      }
                    : r
                )
                saveWorkspace({
                  resumesList: updated,
                  activeId: activeResumeId,
                  activeSections: parsed.resumeSections,
                  activeTitleData: parsed.titleData,
                  masterCvsList: masterCvs,
                  activeCvId: activeMasterCvId,
                  activeLibrarySections: librarySections,
                  activeLibraryItems: libraryItems,
                  autosave: autosaveEnabled,
                })
                return updated
              })
              showDismissNotice(`Successfully overwrote active Resume!`)
            } else {
              alert('Invalid choice. Import cancelled.')
            }

          } else if (parsed.fileType === 'resume_forge_master_cv') {
            if (!parsed.librarySections || !parsed.libraryItems) {
              alert('Invalid Master CV JSON structure: missing sections or library items.')
              return
            }

            const activeCvName = masterCvs.find(cv => cv.id === activeMasterCvId)?.name || 'Untitled'
            const importChoice = prompt(
              `Importing Master CV: "${parsed.name || 'Untitled'}"\n\nType '1' to Import as a NEW Master CV\nType '2' to OVERWRITE your active Master CV ("${activeCvName}")`,
              "1"
            )
            if (!importChoice) return
            const choice = importChoice.trim()

            if (choice === '1') {
              const newCv = {
                id: generateId('cv'),
                name: parsed.name ? `${parsed.name} (Imported)` : `Imported Master CV (${masterCvs.length + 1})`,
                createdAt: parsed.createdAt || Date.now(),
                updatedAt: Date.now(),
                librarySections: parsed.librarySections,
                libraryItems: parsed.libraryItems,
              }
              setMasterCvs((prev) => {
                const updated = [...prev, newCv]
                setLibrarySections(newCv.librarySections)
                setLibraryItems(newCv.libraryItems)
                if (newCv.librarySections && newCv.librarySections.length > 0) {
                  setLibraryActiveSection(newCv.librarySections[0])
                }
                setActiveMasterCvId(newCv.id)
                saveWorkspace({
                  resumesList: resumes,
                  activeId: activeResumeId,
                  activeSections: resumeSections,
                  activeTitleData: titleData,
                  masterCvsList: updated,
                  activeCvId: newCv.id,
                  activeLibrarySections: newCv.librarySections,
                  activeLibraryItems: newCv.libraryItems,
                  autosave: autosaveEnabled,
                })
                return updated
              })
              showDismissNotice(`Imported new Master CV "${newCv.name}"!`)
            } else if (choice === '2') {
              setLibrarySections(parsed.librarySections)
              setLibraryItems(parsed.libraryItems)
              if (parsed.librarySections && parsed.librarySections.length > 0) {
                setLibraryActiveSection(parsed.librarySections[0])
              }
              setMasterCvs((prev) => {
                const updated = prev.map((cv) =>
                  cv.id === activeMasterCvId
                    ? {
                        ...cv,
                        name: parsed.name || cv.name,
                        updatedAt: Date.now(),
                        librarySections: parsed.librarySections,
                        libraryItems: parsed.libraryItems,
                      }
                    : cv
                )
                saveWorkspace({
                  resumesList: resumes,
                  activeId: activeResumeId,
                  activeSections: resumeSections,
                  activeTitleData: titleData,
                  masterCvsList: updated,
                  activeCvId: activeMasterCvId,
                  activeLibrarySections: parsed.librarySections,
                  activeLibraryItems: parsed.libraryItems,
                  autosave: autosaveEnabled,
                })
                return updated
              })
              showDismissNotice(`Successfully overwrote active Master CV!`)
            } else {
              alert('Invalid choice. Import cancelled.')
            }

          } else {
            alert('Unrecognized JSON format. Make sure the file was exported from Resume Forge (must contain a fileType property).')
          }
        } catch (e) {
          console.error(e)
          alert('Failed to parse JSON file: ' + e.message)
        }
      }
      reader.readAsText(file)
    }
    fileInput.click()
  }

  const triggerJsonExport = () => {
    const activeRes = resumes.find((r) => r.id === activeResumeId)
    const activeCv = masterCvs.find((c) => c.id === activeMasterCvId)

    const choice = prompt(
      `What would you like to export?\n\nType '1' or 'resume' to export Active Resume ("${activeRes?.name || 'Untitled'}")\nType '2' or 'cv' to export Active Master CV ("${activeCv?.name || 'Untitled'}")`,
      "resume"
    )
    if (!choice) return

    const normalized = choice.toLowerCase().trim()
    let dataToExport = null
    let filename = 'export.json'

    if (normalized === '1' || normalized === 'resume') {
      if (!activeRes) {
        alert('No active resume found to export.')
        return
      }
      dataToExport = {
        fileType: 'resume_forge_resume',
        version: 1,
        name: activeRes.name,
        createdAt: activeRes.createdAt,
        updatedAt: Date.now(),
        titleData: titleData,
        resumeSections: resumeSections,
      }
      filename = `${activeRes.name || 'resume'}.json`
    } else if (normalized === '2' || normalized === 'cv') {
      if (!activeCv) {
        alert('No active Master CV found to export.')
        return
      }
      dataToExport = {
        fileType: 'resume_forge_master_cv',
        version: 1,
        name: activeCv.name,
        createdAt: activeCv.createdAt,
        updatedAt: Date.now(),
        librarySections: librarySections,
        libraryItems: libraryItems,
      }
      filename = `${activeCv.name || 'master_cv'}.json`
    } else {
      alert("Invalid choice. Please enter 'resume' or 'cv'.")
      return
    }

    const dataStr = JSON.stringify(dataToExport, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const downloadAnchor = document.createElement('a')
    downloadAnchor.href = url
    downloadAnchor.download = filename
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    document.body.removeChild(downloadAnchor)
    URL.revokeObjectURL(url)

    showDismissNotice(`Exported "${filename}" successfully!`)
  }
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

  // Only call this when CREATING a new section from a user-typed title.
  // All existing sections carry an explicit `kind` field; read that instead.
  const inferKindFromTitle = (sectionTitle = '') => {
    const title = sectionTitle.toLowerCase().trim()
    if (title === 'education') return 'education'
    if (title === 'languages' || title === 'language') return 'language'
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


  const getLibraryItemType = (item) => item.type || 'custom'

  const isLibraryItemAllowed = (item, targetSection) => {
    const targetKind = targetSection.kind ?? 'custom'
    const itemType = getLibraryItemType(item)
    if (targetKind === 'education') {
      return itemType === 'education'
    }
    if (targetKind === 'language') {
      return itemType === 'language'
    }
    return itemType === 'custom'
  }

  const buildResumeItemFromLibrary = (item, sectionKind) => {
    const common = {
      id: generateId('item'),
      enabled: true,
    }

    if (sectionKind === 'education') {
      return {
        ...common,
        type: 'education',
        label: `${item.degree ?? ''} - ${item.school ?? ''}`.trim() || 'New Education',
        degree: item.degree ?? '',
        school: item.school ?? '',
        location: item.location ?? '',
        field: item.field ?? item.subtitle ?? '',
        dates: item.dates ?? '',
        bullets: item.bullets ? [...item.bullets] : [],
      }
    }

    if (sectionKind === 'language') {
      return {
        ...common,
        type: 'language',
        label: 'Languages',
        languages: item.languages ? [...item.languages] : [],
      }
    }

    // Custom kind
    const labelCandidate =
      item.label ||
      item.name ||
      `${item.degree ?? ''}${item.school ? ` - ${item.school}` : ''}`.trim() ||
      'New Item'

    const detailCandidates =
      item.details ??
      item.bullets ??
      (item.languages ? [...item.languages] : [])

    return {
      ...common,
      type: 'custom',
      label: labelCandidate,
      name: item.name ?? item.label ?? labelCandidate,
      subtitle: item.subtitle ?? item.field ?? '',
      location: item.location ?? '',
      dates: item.dates ?? '',
      details: Array.isArray(detailCandidates) ? [...detailCandidates] : (typeof detailCandidates === 'string' ? [detailCandidates] : []),
    }
  }

  const buildResumeSectionFromLibrary = (title, items) => {
    const id = generateId('section')
    const kind = inferKindFromTitle(title)
    return {
      id,
      title,
      kind,
      items: Array.isArray(items) ? items.map((item) => buildResumeItemFromLibrary(item, kind)) : [],
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

  const removeItem = (sectionId, itemId) => {
    setResumeSections((sections) =>
      sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              items: section.items.filter((item) => item.id !== itemId),
            }
          : section,
      ),
    )
  }

  const removeSection = (sectionId) => {
    setResumeSections((sections) =>
      sections.filter((section) => section.id !== sectionId),
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
    const resolvedSection = resumeSections.find((section) => section.id === sectionId)
    const itemType =
      target === 'library'
        ? inferKindFromTitle(libraryActiveSection)
        : resolvedSection?.kind ?? 'custom'
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
      itemType: item?.type ?? section?.kind ?? 'custom',
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
          const newId = generateId('section')
          const newKind = inferKindFromTitle(modalForm.title.trim())
          setResumeSections((sections) => [
            ...sections,
            { id: newId, title: modalForm.title.trim(), kind: newKind, items: [] },
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
            id: generateId('lib-item'),
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
          const newId = generateId('item')
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

  // ── Created Resume: only enabled items from the active draft ─────────────
  const buildResumeFromState = () => {
    const sections = resumeSections
      .map((section) => {
        const enabledItems = section.items.filter((item) => item.enabled)
        if (section.kind === 'education') {
          return {
            title: section.title.toUpperCase(),
            kind: 'education',
            items: enabledItems.map((item) => ({
              degree: item.degree || '',
              school: item.school || '',
              location: item.location || '',
              subtitle: item.field || '',
              dates: item.dates || '',
              bullets: item.bullets ? [...item.bullets] : [],
            })),
          }
        }
        if (section.kind === 'language') {
          return {
            title: section.title.toUpperCase(),
            kind: 'language',
            items: enabledItems.flatMap((item) => item.languages || []),
          }
        }
        return {
          title: section.title.toUpperCase(),
          kind: 'custom',
          items: enabledItems.map((item) => ({
            title: item.name || item.label || '',
            location: item.location || '',
            subtitle: item.subtitle || '',
            dates: item.dates || '',
            details: item.details ? [...item.details] : [],
          })),
        }
      })
      .filter((s) => s.items.length > 0)

    return {
      name: titleData.name || defaultResume.name,
      subtitle: titleData.subtitle || defaultResume.subtitle,
      contacts: titleData.contacts?.length 
        ? titleData.contacts.map((entry) => ({ ...entry })) 
        : defaultResume.contacts.map((entry) => ({ ...entry })),
      sections,
    }
  }

  // ── Master CV: purely from the library, no merging with active draft ──────
  const buildMasterResume = () => {
    const sections = librarySections
      .map((sectionName) => {
        const libKey = Object.keys(libraryItems).find(
          (k) => k.toLowerCase() === sectionName.toLowerCase(),
        )
        const libList = libKey ? libraryItems[libKey] : []
        const kind = inferKindFromTitle(sectionName)

        if (kind === 'education') {
          return {
            title: sectionName.toUpperCase(),
            kind: 'education',
            items: libList.map((item) => ({
              degree: item.degree || '',
              school: item.school || '',
              location: item.location || '',
              subtitle: item.field || item.subtitle || '',
              dates: item.dates || '',
              bullets: item.bullets ? [...item.bullets] : [],
            })),
          }
        }
        if (kind === 'language') {
          return {
            title: sectionName.toUpperCase(),
            kind: 'language',
            items: libList.flatMap((item) => item.languages || []),
          }
        }
        return {
          title: sectionName.toUpperCase(),
          kind: 'custom',
          items: libList.map((item) => ({
            title: item.title || item.name || item.label || '',
            location: item.location || '',
            subtitle: item.subtitle || '',
            dates: item.dates || '',
            details: item.details ? [...item.details] : [],
          })),
        }
      })
      .filter((s) => s.items.length > 0)

    return {
      name: titleData.name || defaultResume.name,
      subtitle: titleData.subtitle || defaultResume.subtitle,
      contacts: titleData.contacts?.length 
        ? titleData.contacts.map((entry) => ({ ...entry })) 
        : defaultResume.contacts.map((entry) => ({ ...entry })),
      sections,
    }
  }

  const compiledResume = useMemo(() => {
    return buildResumeFromState()
  }, [resumeSections, titleData])

  const masterResume = useMemo(() => {
    return buildMasterResume()
  }, [libraryItems, librarySections, titleData])

  const handleDragEnd = (event) => {
    const { active, over } = event
    
    // Capture drag-over states before resetting them to avoid React's async batching gotchas
    const itemInsert = { ...libraryItemInsert }
    const sectionInsertIndex = librarySectionInsertIndex

    setActiveDragItem(null)
    setActiveDragSection(null)
    setLibrarySectionInsertIndex(-1)
    setLibraryItemInsert({ sectionId: null, index: -1 })

    if (!over || active.id === over.id) {
      return
    }

    const activeType = active.data.current?.type
    const overType = over.data.current?.type

    // ── Library section: reorder within library OR insert into resume ────────
    if (activeType === 'library-section-sort') {
      // Dropped on another library section → reorder within library
      if (overType === 'library-section-sort') {
        const activeTitle = active.data.current?.title
        const overTitle = over.data.current?.title
        setLibrarySections((sections) => {
          const oldIndex = sections.indexOf(activeTitle)
          const newIndex = sections.indexOf(overTitle)
          if (oldIndex === -1 || newIndex === -1) return sections
          return arrayMove(sections, oldIndex, newIndex)
        })
        return
      }

      // Dropped on resume area → insert as a new resume section
      if (
        overType === 'section' ||
        overType === 'item' ||
        overType === 'resume-root'
      ) {
        const sectionTitle = active.data.current?.title
        const sectionItems = active.data.current?.items ?? []
        if (!sectionTitle) return

        const newSection = buildResumeSectionFromLibrary(sectionTitle, sectionItems)

        if (overType === 'resume-root') {
          setResumeSections((sections) => [...sections, newSection])
          return
        }

        const targetSectionId =
          overType === 'item' ? over.data.current?.sectionId : over.id
        if (!targetSectionId) {
          setResumeSections((sections) => [...sections, newSection])
          return
        }

        setResumeSections((sections) => {
          const targetIndex = sections.findIndex((s) => s.id === targetSectionId)
          if (targetIndex === -1) return [...sections, newSection]
          const insertionIndex =
            sectionInsertIndex >= 0
              ? sectionInsertIndex
              : targetIndex + 1
          const next = [...sections]
          if (insertionIndex <= 0) { next.unshift(newSection); return next }
          if (insertionIndex >= next.length) { next.push(newSection); return next }
          next.splice(insertionIndex, 0, newSection)
          return next
        })
        return
      }
    }

    // ── Library item reorder (within its section) ───────────────────────────
    if (activeType === 'library-item' && overType === 'library-item') {
      // Only reorder if both IDs start with lib-sort- (i.e. they are in library)
      if (
        String(active.id).startsWith('lib-sort-') &&
        String(over.id).startsWith('lib-sort-')
      ) {
        const activeItemId = String(active.id).replace('lib-sort-', '')
        const overItemId = String(over.id).replace('lib-sort-', '')
        setLibraryItems((items) => {
          const section = libraryActiveSection
          const list = items[section] ?? []
          const oldIndex = list.findIndex((i) => i.id === activeItemId)
          const newIndex = list.findIndex((i) => i.id === overItemId)
          if (oldIndex === -1 || newIndex === -1) return items
          return { ...items, [section]: arrayMove(list, oldIndex, newIndex) }
        })
        return
      }
    }

    // ── Library section drag → resume ───────────────────────────────────────
    if (
      activeType === 'library-section' &&
      (overType === 'section' ||
        overType === 'item' ||
        overType === 'resume-root')
    ) {
      const sectionTitle = active.data.current?.title
      const sectionItems = active.data.current?.items ?? []
      if (!sectionTitle) {
        return
      }

      const newSection = buildResumeSectionFromLibrary(
        sectionTitle,
        sectionItems,
      )

      if (overType === 'resume-root') {
        setResumeSections((sections) => [...sections, newSection])
        return
      }

      const targetSectionId =
        overType === 'item' ? over.data.current?.sectionId : over.id
      if (!targetSectionId) {
        setResumeSections((sections) => [...sections, newSection])
        return
      }

      setResumeSections((sections) => {
        const targetIndex = sections.findIndex(
          (section) => section.id === targetSectionId,
        )
        if (targetIndex === -1) {
          return [...sections, newSection]
        }
        const insertionIndex =
          sectionInsertIndex >= 0
            ? sectionInsertIndex
            : targetIndex + 1
        const nextSections = [...sections]
        if (insertionIndex <= 0) {
          nextSections.unshift(newSection)
          return nextSections
        }
        if (insertionIndex >= nextSections.length) {
          nextSections.push(newSection)
          return nextSections
        }
        nextSections.splice(insertionIndex, 0, newSection)
        return nextSections
      })
      return
    }

    // ── Library item drag → resume section ─────────────────────────────────
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
          if (!isLibraryItemAllowed(libraryItem, section)) {
            return section
          }
          const newItem = buildResumeItemFromLibrary(libraryItem, section.kind ?? 'custom')
          const nextItems = [...section.items]
          
          // Use the index computed during handleDragOver if available
          const insertIdx = (itemInsert && itemInsert.sectionId === targetSectionId && itemInsert.index >= 0)
            ? itemInsert.index
            : (overType === 'item'
                ? Math.max(0, nextItems.findIndex((item) => item.id === over.id)) + 1
                : nextItems.length)

          nextItems.splice(insertIdx, 0, newItem)
          return { ...section, items: nextItems }
        }),
      )
      return
    }

    // ── Resume section reorder ──────────────────────────────────────────────
    if (activeType === 'section' && overType === 'section') {
      setResumeSections((sections) => {
        const oldIndex = sections.findIndex((section) => section.id === active.id)
        const newIndex = sections.findIndex((section) => section.id === over.id)
        return arrayMove(sections, oldIndex, newIndex)
      })
      return
    }

    // ── Resume item reorder (within its section) ────────────────────────────
    if (activeType === 'item' && overType === 'item') {
      const activeSectionId = active.data.current?.sectionId
      const overSectionId = over.data.current?.sectionId
      if (!activeSectionId || activeSectionId !== overSectionId) {
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
          if (oldIndex === -1 || newIndex === -1) return section
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
      setLibrarySectionInsertIndex(-1)
      setLibraryItemInsert({ sectionId: null, index: -1 })
    } else if (activeType === 'library-section') {
      setActiveDragSection({
        title: event.active.data.current?.title ?? 'Section',
        count: event.active.data.current?.items?.length ?? 0,
      })
      setActiveDragItem(null)
      setLibrarySectionInsertIndex(resumeSections.length)
      setLibraryItemInsert({ sectionId: null, index: -1 })
    } else if (activeType === 'library-section-sort') {
      // Show item-count overlay and prime the resume insert index —
      // this section can be sorted within library OR dropped into resume
      setActiveDragSection({
        title: event.active.data.current?.title ?? 'Section',
        count: event.active.data.current?.items?.length ?? 0,
      })
      setActiveDragItem(null)
      setLibrarySectionInsertIndex(resumeSections.length)
      setLibraryItemInsert({ sectionId: null, index: -1 })
    } else {
      setActiveDragItem(null)
      setActiveDragSection(null)
      setLibrarySectionInsertIndex(-1)
      setLibraryItemInsert({ sectionId: null, index: -1 })
    }
  }

  const handleDragOver = (event) => {
    const activeType = event.active.data.current?.type
    const overType = event.over?.data.current?.type
    if (!event.over || !overType) {
      return
    }

    if (activeType === 'library-item') {
      if (overType !== 'section' && overType !== 'item') {
        return
      }
      const targetSectionId =
        overType === 'item' ? event.over.data.current?.sectionId : event.over.id
      const targetSection = resumeSections.find(
        (section) => section.id === targetSectionId,
      )
      if (!targetSection) {
        setLibraryItemInsert({ sectionId: null, index: -1 })
        return
      }
      
      if (overType === 'item') {
        const overIndex = targetSection.items.findIndex(
          (item) => item.id === event.over.id,
        )
        const overEl = document.getElementById(event.over.id)
        if (overEl && overIndex >= 0) {
          const rect = overEl.getBoundingClientRect()
          const overMidY = rect.top + rect.height / 2
          
          let dragY
          if (event.pointerCoordinates) {
            dragY = event.pointerCoordinates.y
          } else {
            const translated = event.active.rect.current.translated
            dragY = translated ? (translated.top + translated.height / 2) : rect.top
          }
          
          const insertIdx = dragY < overMidY ? overIndex : overIndex + 1
          setLibraryItemInsert({
            sectionId: targetSectionId,
            index: insertIdx,
          })
        } else {
          setLibraryItemInsert({
            sectionId: targetSectionId,
            index: overIndex >= 0 ? overIndex + 1 : targetSection.items.length,
          })
        }
      } else {
        setLibraryItemInsert({
          sectionId: targetSectionId,
          index: targetSection.items.length,
        })
      }
      return
    }

    // Both library-section and library-section-sort can be dropped into the resume
    if (activeType !== 'library-section' && activeType !== 'library-section-sort') {
      return
    }

    if (overType === 'resume-root') {
      // Cursor is in a gap between sections — preserve the last valid insert
      // position instead of snapping to the bottom every time.
      return
    }

    if (overType === 'item' || overType === 'section') {
      const targetSectionId =
        overType === 'item' ? event.over.data.current?.sectionId : event.over.id
      const targetIndex = resumeSections.findIndex(
        (section) => section.id === targetSectionId,
      )
      if (targetIndex >= 0) {
        // Compare the cursor position (or drag midpoint) with the vertical midpoint
        // of the parent SectionCard DOM element (not the individual items)
        const sectionEl = document.getElementById(targetSectionId)
        if (sectionEl) {
          const rect = sectionEl.getBoundingClientRect()
          const overMidY = rect.top + rect.height / 2
          
          let dragY
          if (event.pointerCoordinates) {
            dragY = event.pointerCoordinates.y
          } else {
            const translated = event.active.rect.current.translated
            dragY = translated ? (translated.top + translated.height / 2) : rect.top
          }
          
          setLibrarySectionInsertIndex(
            dragY < overMidY ? targetIndex : targetIndex + 1,
          )
        } else {
          setLibrarySectionInsertIndex(targetIndex + 1)
        }
      }
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
                await buildResumePdf(compiledResume)
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

        <WorkspaceBar
          resumes={resumes}
          activeResumeId={activeResumeId}
          onSelectResume={switchActiveResume}
          onRenameResume={renameResume}
          onDeleteResume={deleteResume}
          onDuplicateResume={duplicateResume}
          onNewEmptyResume={createEmptyResume}
          onNewFromMasterCv={createResumeFromMasterCv}
          masterCvs={masterCvs}
          activeMasterCvId={activeMasterCvId}
          onSelectMasterCv={switchActiveMasterCv}
          onRenameMasterCv={renameMasterCv}
          onDeleteMasterCv={deleteMasterCv}
          onNewMasterCv={createNewMasterCv}
          autosaveEnabled={autosaveEnabled}
          onToggleAutosave={handleToggleAutosave}
          onManualSave={handleManualSave}
          onImportJson={triggerJsonImport}
          onExportJson={triggerJsonExport}
        />

        <DndContext
          collisionDetection={(args) => {
            const activeType = args.active?.data?.current?.type
            
            // Resume section or item sorting: use standard closestCenter
            if (activeType === 'section' || activeType === 'item') {
              return closestCenter(args)
            }
            
            // For all cross-panel drags (library-section-sort, library-section, library-item)
            if (
              activeType === 'library-section' ||
              activeType === 'library-section-sort' ||
              activeType === 'library-item'
            ) {
              const pointerHits = pointerWithin(args)
              const isOverResume = pointerHits.some(
                (hit) =>
                  hit.id === 'resume-root' ||
                  hit.data?.current?.type === 'section' ||
                  hit.data?.current?.type === 'item',
              )
              
              if (isOverResume) {
                const resumeTargets = args.droppableContainers.filter((container) => {
                  const type = container.data.current?.type
                  return type === 'section' || type === 'item'
                })
                
                if (resumeTargets.length > 0) {
                  let dragY
                  if (args.pointerCoordinates) {
                    dragY = args.pointerCoordinates.y
                  } else {
                    const translated = args.active.rect.current.translated
                    dragY = translated ? (translated.top + translated.height / 2) : 0
                  }
                  
                  let closestContainer = null
                  let minDistance = Infinity
                  
                  for (const container of resumeTargets) {
                    const el = document.getElementById(container.id)
                    if (el) {
                      const rect = el.getBoundingClientRect()
                      const midY = rect.top + rect.height / 2
                      const distance = Math.abs(dragY - midY)
                      if (distance < minDistance) {
                        minDistance = distance
                        closestContainer = container
                      }
                    } else if (container.rect.current) {
                      const rect = container.rect.current
                      const midY = rect.top + rect.height / 2
                      const distance = Math.abs(dragY - midY)
                      if (distance < minDistance) {
                        minDistance = distance
                        closestContainer = container
                      }
                    }
                  }
                  
                  if (closestContainer) {
                    return [{ id: closestContainer.id, data: closestContainer.data.current }]
                  }
                }
                
                // Fallback to resume-root if no section or item is close
                const resumeRoot = args.droppableContainers.find((c) => c.id === 'resume-root')
                if (resumeRoot) {
                  return [{ id: 'resume-root', data: resumeRoot.data.current }]
                }
              }
            }
            
            // Standard pointerHits / closestCenter fallback
            const pointerHits = pointerWithin(args)
            if (pointerHits.length > 0) return pointerHits
            return closestCenter(args)
          }}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr_1fr]">
            <LibraryPanel
              librarySections={librarySections}
              libraryItems={libraryItems}
              libraryActiveSection={libraryActiveSection}
              onSelectSection={setLibraryActiveSection}
              onAddSection={openAddSection}
              onAddItem={openAddItem}
            />
            <LivePdfPanel resume={compiledResume} masterResume={masterResume} />
            <ResumePanel
              resumeSections={resumeSections}
              onToggleItem={toggleItem}
              onRemoveItem={removeItem}
              onRemoveSection={removeSection}
              onAddSection={openAddSection}
              onAddItem={openAddItem}
              onEditSection={openEditSection}
              onEditItem={openEditItem}
              onEditTitle={openEditTitle}
              activeDragSection={activeDragSection}
              insertIndex={librarySectionInsertIndex}
              activeDragItem={activeDragItem}
              libraryItemInsert={libraryItemInsert}
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
