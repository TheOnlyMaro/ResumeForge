import { useState, useMemo, useEffect, useRef } from 'react'
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
import DialogModal from './components/builder/DialogModal'
import DismissNotice from './components/builder/DismissNotice'
import LibraryPanel from './components/builder/LibraryPanel'
import LivePdfPanel from './components/builder/LivePdfPanel'
import ResumePanel from './components/builder/ResumePanel'
import WorkspaceBar from './components/builder/WorkspaceBar'
import mockData from './data/mockData.json'

const DEFAULT_RESUME_SECTIONS = JSON.parse(JSON.stringify(mockData.DEFAULT_RESUME_SECTIONS))
const DEFAULT_LIBRARY_SECTIONS = JSON.parse(JSON.stringify(mockData.DEFAULT_LIBRARY_SECTIONS))
const DEFAULT_LIBRARY_SECTION_KINDS = JSON.parse(JSON.stringify(mockData.DEFAULT_LIBRARY_SECTION_KINDS))
const DEFAULT_LIBRARY_ITEMS = JSON.parse(JSON.stringify(mockData.DEFAULT_LIBRARY_ITEMS))
const DEFAULT_TITLE_DATA = JSON.parse(JSON.stringify(mockData.DEFAULT_TITLE_DATA))

let idCounter = 0
const generateId = (prefix) => {
  idCounter++
  const randomPart = Math.random().toString(36).substring(2, 9)
  return `${prefix}-${Date.now()}-${idCounter}-${randomPart}`
}

function Builder({ onNavigate }) {
  const [resumeSections, setResumeSections] = useState(DEFAULT_RESUME_SECTIONS)
  const [titleData, setTitleData] = useState(DEFAULT_TITLE_DATA)
  const [libraryTitleData, setLibraryTitleData] = useState(DEFAULT_TITLE_DATA)
  const [librarySections, setLibrarySections] = useState(DEFAULT_LIBRARY_SECTIONS)
  const [libraryItems, setLibraryItems] = useState(DEFAULT_LIBRARY_ITEMS)
  const [libraryActiveSection, setLibraryActiveSection] = useState(DEFAULT_LIBRARY_SECTIONS[0])
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
  // Custom dialog state — replaces all native alert / confirm / prompt calls
  const [dialog, setDialog] = useState(null)
  const showDialog = (config) => setDialog(config)
  const closeDialog = () => setDialog(null)

  // ── Data Persistence: States & Workspace Engine (Phase 2) ───────
  const [resumes, setResumes] = useState([])
  const [activeResumeId, setActiveResumeId] = useState('')
  const [masterCvs, setMasterCvs] = useState([])
  const [activeMasterCvId, setActiveMasterCvId] = useState('')
  const [librarySectionKinds, setLibrarySectionKinds] = useState(DEFAULT_LIBRARY_SECTION_KINDS)
  const [librarySectionIndents, setLibrarySectionIndents] = useState({ "Profile": true })
  const [autosaveEnabled, setAutosaveEnabled] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  // Tracks which file IDs have unsaved in-memory edits
  const [dirtyResumeIds, setDirtyResumeIds] = useState([])
  const [dirtyCvIds, setDirtyCvIds] = useState([])
  // Refs to detect active-ID changes vs real content edits in dirty-tracking effects.
  // null = "not yet initialized" — the first run after load is always skipped.
  const prevActiveResumeIdRef = useRef(null)
  const prevActiveMasterCvIdRef = useRef(null)

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
    activeLibrarySectionKinds = librarySectionKinds,
    activeLibrarySectionIndents = librarySectionIndents,
    activeLibraryTitleData = libraryTitleData,
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
          librarySectionKinds: activeLibrarySectionKinds,
          librarySectionIndents: activeLibrarySectionIndents,
          titleData: activeLibraryTitleData,
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

    localStorage.setItem('resume_forge_workspace_v2', JSON.stringify(workspaceState))
    // Commit clears all dirty flags — every file in memory is now persisted
    setDirtyResumeIds([])
    setDirtyCvIds([])
  }

  const initializeDefaults = () => {
    const defaultCv = {
      id: 'cv-1',
      name: "Maro's Master CV",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      librarySections: DEFAULT_LIBRARY_SECTIONS,
      libraryItems: DEFAULT_LIBRARY_ITEMS,
      librarySectionKinds: DEFAULT_LIBRARY_SECTION_KINDS,
      librarySectionIndents: { "Profile": true },
      titleData: DEFAULT_TITLE_DATA,
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
        name: 'Maro Forge (Software Engineer)',
        subtitle: 'Lead Software Engineer',
        contacts: [
          { label: 'maro.software@resumeforge.dev', link: '' },
          { label: 'linkedin.com/in/maroforge', link: '' },
          { label: 'San Francisco, CA', link: '' },
        ],
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
    setLibrarySectionKinds(DEFAULT_LIBRARY_SECTION_KINDS)
    setLibrarySectionIndents({ "Profile": true })
    setLibraryTitleData(DEFAULT_TITLE_DATA)
    setLibraryActiveSection(DEFAULT_LIBRARY_SECTIONS[0])

    setAutosaveEnabled(false)
    localStorage.setItem('resume_forge_workspace_v2', JSON.stringify(initialWorkspace))
  }

  // Load state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('resume_forge_workspace_v2')
    if (saved) {
      try {
        const workspace = JSON.parse(saved)

        if (workspace.autosaveEnabled !== undefined) {
          setAutosaveEnabled(workspace.autosaveEnabled)
        }

        if (workspace.masterCvs && workspace.masterCvs.length > 0) {
          setMasterCvs(workspace.masterCvs)
          // Prefer the file the user was last looking at (sessionStorage)
          // over the last *saved* active file (localStorage workspace object).
          const sessionIds = JSON.parse(sessionStorage.getItem('resume_forge_active_ids') || 'null')
          const sessionCvId = sessionIds?.activeMasterCvId
          const activeCvId =
            (sessionCvId && workspace.masterCvs.find((c) => c.id === sessionCvId))
              ? sessionCvId
              : (workspace.activeMasterCvId || workspace.masterCvs[0].id)
          setActiveMasterCvId(activeCvId)

          const activeCv = workspace.masterCvs.find((c) => c.id === activeCvId)
          if (activeCv) {
            setLibrarySections(activeCv.librarySections || [])
            setLibraryItems(activeCv.libraryItems || {})
            setLibrarySectionKinds(activeCv.librarySectionKinds || DEFAULT_LIBRARY_SECTION_KINDS)
            setLibrarySectionIndents(activeCv.librarySectionIndents || { "Profile": true })
            setLibraryTitleData(activeCv.titleData || DEFAULT_TITLE_DATA)
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
            librarySectionKinds: DEFAULT_LIBRARY_SECTION_KINDS,
            librarySectionIndents: { "Profile": true },
            titleData: DEFAULT_TITLE_DATA,
          }
          setMasterCvs([defaultCv])
          setActiveMasterCvId('cv-1')
          setLibrarySections(DEFAULT_LIBRARY_SECTIONS)
          setLibraryItems(DEFAULT_LIBRARY_ITEMS)
          setLibrarySectionKinds(DEFAULT_LIBRARY_SECTION_KINDS)
          setLibrarySectionIndents({ "Profile": true })
          setLibraryTitleData(DEFAULT_TITLE_DATA)
          setLibraryActiveSection(DEFAULT_LIBRARY_SECTIONS[0])
        }

        if (workspace.resumes && workspace.resumes.length > 0) {
          setResumes(workspace.resumes)
          // Prefer sessionStorage (last-viewed) over localStorage (last-saved)
          const sessionIds = JSON.parse(sessionStorage.getItem('resume_forge_active_ids') || 'null')
          const sessionResumeId = sessionIds?.activeResumeId
          const activeId =
            (sessionResumeId && workspace.resumes.find((r) => r.id === sessionResumeId))
              ? sessionResumeId
              : (workspace.activeResumeId || workspace.resumes[0].id)
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

  // Keep sessionStorage in sync so refresh always returns to the last-viewed file.
  // sessionStorage is per-tab and survives refreshes but not tab closes —
  // perfect scope for "where I was" without polluting the saved workspace.
  useEffect(() => {
    if (isLoaded && activeResumeId && activeMasterCvId) {
      sessionStorage.setItem(
        'resume_forge_active_ids',
        JSON.stringify({ activeResumeId, activeMasterCvId })
      )
    }
  }, [isLoaded, activeResumeId, activeMasterCvId])

  // Mark active resume dirty whenever its content changes (not on file-switch loads)
  useEffect(() => {
    if (!isLoaded) return
    const prevId = prevActiveResumeIdRef.current
    prevActiveResumeIdRef.current = activeResumeId
    // null  = first run after initial load — skip (not a user edit)
    // ID changed = file-switch load — skip
    if (prevId === null || prevId !== activeResumeId || !activeResumeId) return
    setDirtyResumeIds((prev) =>
      prev.includes(activeResumeId) ? prev : [...prev, activeResumeId]
    )
  }, [activeResumeId, resumeSections, titleData]) // eslint-disable-line react-hooks/exhaustive-deps

  // Mark active Master CV dirty when its library content changes
  useEffect(() => {
    if (!isLoaded) return
    const prevId = prevActiveMasterCvIdRef.current
    prevActiveMasterCvIdRef.current = activeMasterCvId
    if (prevId === null || prevId !== activeMasterCvId || !activeMasterCvId) return
    setDirtyCvIds((prev) =>
      prev.includes(activeMasterCvId) ? prev : [...prev, activeMasterCvId]
    )
  }, [activeMasterCvId, librarySections, libraryItems, librarySectionKinds, librarySectionIndents, libraryTitleData]) // eslint-disable-line react-hooks/exhaustive-deps

  // Warn user before closing / refreshing if any file has unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (dirtyResumeIds.length > 0 || dirtyCvIds.length > 0) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [dirtyResumeIds, dirtyCvIds])

  // Autosave — declared AFTER dirty tracking so its setDirtyResumeIds([]) is
  // queued last in React's batch and wins over the dirty-tracking functional update.
  // Net result: edit with autosave ON → content saved → dirty flag cleared. ✅
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
        activeLibrarySectionKinds: librarySectionKinds,
        activeLibrarySectionIndents: librarySectionIndents,
        activeLibraryTitleData: libraryTitleData,
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
    librarySectionKinds,
    librarySectionIndents,
    libraryTitleData,
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
      // Flush outgoing file's edits into the in-memory array only — NOT localStorage.
      // This preserves A* while you work on B, but won't survive a refresh.
      const updated = prevResumes.map((r) => {
        if (r.id === activeResumeId) {
          return { ...r, resumeSections: outgoingSections, titleData: outgoingTitle }
          // Note: no updatedAt — only real saves should move the timestamp
        }
        return r
      })

      // Load the incoming file's data into live state
      const targetResume = updated.find((r) => r.id === newId)
      const incomingSections = targetResume?.resumeSections ?? []
      const incomingTitle = targetResume?.titleData ?? { name: '', subtitle: '', contacts: [] }

      setResumeSections(incomingSections)
      setTitleData(incomingTitle)

      // No saveWorkspace call — switching is purely in-memory
      return updated
    })
    setActiveResumeId(newId)
    const targetName = resumes.find((r) => r.id === newId)?.name || 'selected resume'
    showDismissNotice(`Switched to "${targetName}"`)
  }

  const switchActiveMasterCv = (newId) => {
    if (newId === activeMasterCvId) return

    // Capture current in-flight data before switching
    const outgoingLibrarySections = librarySections
    const outgoingLibraryItems = libraryItems
    const outgoingLibrarySectionKinds = librarySectionKinds
    const outgoingLibrarySectionIndents = librarySectionIndents
    const outgoingLibraryTitleData = libraryTitleData

    setMasterCvs((prevCvs) => {
      // Flush outgoing CV's edits into the in-memory array only — NOT localStorage
      const updated = prevCvs.map((cv) => {
        if (cv.id === activeMasterCvId) {
          return {
            ...cv,
            librarySections: outgoingLibrarySections,
            libraryItems: outgoingLibraryItems,
            librarySectionKinds: outgoingLibrarySectionKinds,
            librarySectionIndents: outgoingLibrarySectionIndents,
            titleData: outgoingLibraryTitleData,
          }
          // Note: no updatedAt — only real saves move the timestamp
        }
        return cv
      })

      // Load the incoming CV's data into live state
      const targetCv = updated.find((cv) => cv.id === newId)
      const incomingLibSections = targetCv?.librarySections ?? []
      const incomingLibItems = targetCv?.libraryItems ?? {}
      const incomingLibSectionKinds = targetCv?.librarySectionKinds ?? {}
      const incomingLibSectionIndents = targetCv?.librarySectionIndents ?? { "Profile": true }
      const incomingLibTitleData = targetCv?.titleData ?? DEFAULT_TITLE_DATA

      setLibrarySections(incomingLibSections)
      setLibraryItems(incomingLibItems)
      setLibrarySectionKinds(incomingLibSectionKinds)
      setLibrarySectionIndents(incomingLibSectionIndents)
      setLibraryTitleData(incomingLibTitleData)
      if (incomingLibSections.length > 0) {
        setLibraryActiveSection(incomingLibSections[0])
      }

      // No saveWorkspace call — switching is purely in-memory
      return updated
    })
    setActiveMasterCvId(newId)
    const targetName = masterCvs.find((cv) => cv.id === newId)?.name || 'selected Master CV'
    showDismissNotice(`Switched to "${targetName}"`)
  }

  const renameResume = (id, currentName) => {
    showDialog({
      type: 'input',
      title: 'Rename Resume',
      message: 'Enter a new name for this resume file:',
      defaultValue: currentName,
      placeholder: 'Resume name…',
      confirmLabel: 'Rename',
      onConfirm: (newName) => {
        setResumes((prev) => {
          const updated = prev.map((r) =>
            r.id === id ? { ...r, name: newName, updatedAt: Date.now() } : r
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
            activeLibrarySectionKinds: librarySectionKinds,
            activeLibraryTitleData: libraryTitleData,
            autosave: autosaveEnabled,
          })
          return updated
        })
        showDismissNotice(`Renamed Resume file to “${newName}”!`)
      },
    })
  }

  const renameMasterCv = (id, currentName) => {
    showDialog({
      type: 'input',
      title: 'Rename Master CV',
      message: 'Enter a new name for this Master CV file:',
      defaultValue: currentName,
      placeholder: 'Master CV name…',
      confirmLabel: 'Rename',
      onConfirm: (newName) => {
        setMasterCvs((prev) => {
          const updated = prev.map((c) =>
            c.id === id ? { ...c, name: newName, updatedAt: Date.now() } : c
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
            activeLibrarySectionKinds: librarySectionKinds,
            activeLibraryTitleData: libraryTitleData,
            autosave: autosaveEnabled,
          })
          return updated
        })
        showDismissNotice(`Renamed Master CV file to “${newName}”!`)
      },
    })
  }

  const deleteResume = (id) => {
    const target = resumes.find((r) => r.id === id)
    if (resumes.length <= 1) {
      showDialog({
        type: 'alert',
        variant: 'error',
        title: 'Cannot Delete',
        message: 'You must maintain at least one Resume file.',
      })
      return
    }
    showDialog({
      type: 'confirm',
      title: 'Delete Resume',
      message: `Are you sure you want to permanently delete “${target?.name}”? This cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      onConfirm: () => {
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
            activeLibrarySectionKinds: librarySectionKinds,
            activeLibraryTitleData: libraryTitleData,
            autosave: autosaveEnabled,
          })
          return updated
        })
        showDismissNotice(`Deleted resume file “${target?.name}”.`)
      },
    })
  }

  const deleteMasterCv = (id) => {
    const target = masterCvs.find((c) => c.id === id)
    if (masterCvs.length <= 1) {
      showDialog({
        type: 'alert',
        variant: 'error',
        title: 'Cannot Delete',
        message: 'You must maintain at least one Master CV file.',
      })
      return
    }
    showDialog({
      type: 'confirm',
      title: 'Delete Master CV',
      message: `Are you sure you want to permanently delete “${target?.name}”? This cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      onConfirm: () => {
        setMasterCvs((prev) => {
          const updated = prev.filter((c) => c.id !== id)
          let nextActiveCvId = activeMasterCvId
          let nextLibSections = librarySections
          let nextLibItems = libraryItems
          let nextLibSectionKinds = librarySectionKinds
          let nextLibTitleData = libraryTitleData
          if (id === activeMasterCvId) {
            nextActiveCvId = updated[0].id
            const nextCv = updated[0]
            nextLibSections = nextCv.librarySections || []
            nextLibItems = nextCv.libraryItems || {}
            nextLibSectionKinds = nextCv.librarySectionKinds || {}
            nextLibTitleData = nextCv.titleData || DEFAULT_TITLE_DATA
            setLibrarySections(nextLibSections)
            setLibraryItems(nextLibItems)
            setLibrarySectionKinds(nextLibSectionKinds)
            setLibraryTitleData(nextLibTitleData)
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
            activeLibrarySectionKinds: nextLibSectionKinds,
            activeLibraryTitleData: nextLibTitleData,
            autosave: autosaveEnabled,
          })
          return updated
        })
        showDismissNotice(`Deleted Master CV file “${target?.name}”.`)
      },
    })
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
        activeLibrarySectionKinds: librarySectionKinds,
        activeLibraryTitleData: libraryTitleData,
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
        activeLibrarySectionKinds: librarySectionKinds,
        activeLibraryTitleData: libraryTitleData,
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
      const kind = activeCv.librarySectionKinds?.[sectionTitle] || inferKindFromTitle(sectionTitle)
      const indented = activeCv.librarySectionIndents?.[sectionTitle] || false
      return {
        id: generateId('section'),
        title: sectionTitle,
        kind: kind,
        indented: indented,
        items: items.map((item) => buildResumeItemFromLibrary(item, kind)),
      }
    })

    const newResume = {
      id: generateId('resume'),
      name: `Resume from Master CV (${resumes.length + 1})`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      titleData: JSON.parse(JSON.stringify(activeCv.titleData || DEFAULT_TITLE_DATA)),
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
        activeLibrarySectionKinds: librarySectionKinds,
        activeLibraryTitleData: libraryTitleData,
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
      librarySections: DEFAULT_LIBRARY_SECTIONS,
      libraryItems: JSON.parse(JSON.stringify(DEFAULT_LIBRARY_ITEMS)),
      librarySectionKinds: DEFAULT_LIBRARY_SECTION_KINDS,
      librarySectionIndents: { "Profile": true },
      titleData: DEFAULT_TITLE_DATA,
    }
    setMasterCvs((prev) => {
      const updated = [...prev, newCv]
      setLibrarySections(newCv.librarySections)
      setLibraryItems(newCv.libraryItems)
      setLibrarySectionKinds(newCv.librarySectionKinds)
      setLibrarySectionIndents(newCv.librarySectionIndents)
      setLibraryTitleData(newCv.titleData)
      setLibraryActiveSection(newCv.librarySections[0])
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
        activeLibrarySectionKinds: newCv.librarySectionKinds,
        activeLibrarySectionIndents: newCv.librarySectionIndents,
        activeLibraryTitleData: newCv.titleData,
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
      activeLibrarySectionKinds: librarySectionKinds,
      activeLibraryTitleData: libraryTitleData,
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
      activeLibrarySectionKinds: librarySectionKinds,
      activeLibraryTitleData: libraryTitleData,
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

          if (parsed.fileType === 'resume_forge_resume') {
            if (!parsed.resumeSections || !parsed.titleData) {
              showDialog({ type: 'alert', variant: 'error', title: 'Invalid Resume File', message: 'This JSON is missing required fields (resumeSections or titleData).' })
              return
            }
            const activeResName = resumes.find((r) => r.id === activeResumeId)?.name || 'Untitled'
            showDialog({
              type: 'choice',
              title: `Import Resume — “${parsed.name || 'Untitled'}”`,
              message: 'How would you like to import this resume?',
              choices: [
                { label: 'Import as a new Resume file', description: 'Adds alongside your existing resumes', value: 'new' },
                { label: `Overwrite “${activeResName}”`, description: 'Replaces your currently active resume', value: 'overwrite' },
              ],
              onChoice: (choice) => {
                if (choice === 'new') {
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
                    saveWorkspace({ resumesList: updated, activeId: newResume.id, activeSections: newResume.resumeSections, activeTitleData: newResume.titleData, masterCvsList: masterCvs, activeCvId: activeMasterCvId, activeLibrarySections: librarySections, activeLibraryItems: libraryItems, activeLibrarySectionKinds: librarySectionKinds, activeLibraryTitleData: libraryTitleData, autosave: autosaveEnabled })
                    return updated
                  })
                  showDismissNotice(`Imported new Resume “${newResume.name}”!`)
                } else {
                  setResumeSections(parsed.resumeSections)
                  setTitleData(parsed.titleData)
                  setResumes((prev) => {
                    const updated = prev.map((r) => r.id === activeResumeId ? { ...r, name: parsed.name || r.name, updatedAt: Date.now(), resumeSections: parsed.resumeSections, titleData: parsed.titleData } : r)
                    saveWorkspace({ resumesList: updated, activeId: activeResumeId, activeSections: parsed.resumeSections, activeTitleData: parsed.titleData, masterCvsList: masterCvs, activeCvId: activeMasterCvId, activeLibrarySections: librarySections, activeLibraryItems: libraryItems, activeLibrarySectionKinds: librarySectionKinds, activeLibraryTitleData: libraryTitleData, autosave: autosaveEnabled })
                    return updated
                  })
                  showDismissNotice('Successfully overwrote active Resume!')
                }
              },
            })

          } else if (parsed.fileType === 'resume_forge_master_cv') {
            if (!parsed.librarySections || !parsed.libraryItems) {
              showDialog({ type: 'alert', variant: 'error', title: 'Invalid Master CV File', message: 'This JSON is missing required fields (librarySections or libraryItems).' })
              return
            }
            const activeCvName = masterCvs.find((cv) => cv.id === activeMasterCvId)?.name || 'Untitled'
            showDialog({
              type: 'choice',
              title: `Import Master CV — “${parsed.name || 'Untitled'}”`,
              message: 'How would you like to import this Master CV?',
              choices: [
                { label: 'Import as a new Master CV file', description: 'Adds alongside your existing CVs', value: 'new' },
                { label: `Overwrite “${activeCvName}”`, description: 'Replaces your currently active Master CV', value: 'overwrite' },
              ],
              onChoice: (choice) => {
                const incomingSectionKinds = parsed.librarySectionKinds || {}
                const incomingSectionIndents = parsed.librarySectionIndents || {}
                parsed.librarySections.forEach((s) => {
                  if (!incomingSectionKinds[s]) {
                    const firstItem = parsed.libraryItems[s]?.[0]
                    incomingSectionKinds[s] = firstItem?.type ?? inferKindFromTitle(s)
                  }
                  if (incomingSectionIndents[s] === undefined) {
                    incomingSectionIndents[s] = false
                  }
                })
                const incomingTitleData = parsed.titleData || parsed.libraryTitleData || DEFAULT_TITLE_DATA

                if (choice === 'new') {
                  const newCv = {
                    id: generateId('cv'),
                    name: parsed.name ? `${parsed.name} (Imported)` : `Imported Master CV (${masterCvs.length + 1})`,
                    createdAt: parsed.createdAt || Date.now(),
                    updatedAt: Date.now(),
                    librarySections: parsed.librarySections,
                    libraryItems: parsed.libraryItems,
                    librarySectionKinds: incomingSectionKinds,
                    librarySectionIndents: incomingSectionIndents,
                    titleData: incomingTitleData,
                  }
                  setMasterCvs((prev) => {
                    const updated = [...prev, newCv]
                    setLibrarySections(newCv.librarySections)
                    setLibraryItems(newCv.libraryItems)
                    setLibrarySectionKinds(newCv.librarySectionKinds)
                    setLibrarySectionIndents(newCv.librarySectionIndents)
                    setLibraryTitleData(newCv.titleData)
                    if (newCv.librarySections?.length > 0) setLibraryActiveSection(newCv.librarySections[0])
                    setActiveMasterCvId(newCv.id)
                    saveWorkspace({ resumesList: resumes, activeId: activeResumeId, activeSections: resumeSections, activeTitleData: titleData, masterCvsList: updated, activeCvId: newCv.id, activeLibrarySections: newCv.librarySections, activeLibraryItems: newCv.libraryItems, activeLibrarySectionKinds: newCv.librarySectionKinds, activeLibrarySectionIndents: newCv.librarySectionIndents, activeLibraryTitleData: newCv.titleData, autosave: autosaveEnabled })
                    return updated
                  })
                  showDismissNotice(`Imported new Master CV “${newCv.name}”!`)
                } else {
                  setLibrarySections(parsed.librarySections)
                  setLibraryItems(parsed.libraryItems)
                  setLibrarySectionKinds(incomingSectionKinds)
                  setLibrarySectionIndents(incomingSectionIndents)
                  setLibraryTitleData(incomingTitleData)
                  if (parsed.librarySections?.length > 0) setLibraryActiveSection(parsed.librarySections[0])
                  setMasterCvs((prev) => {
                    const updated = prev.map((cv) => cv.id === activeMasterCvId ? { ...cv, name: parsed.name || cv.name, updatedAt: Date.now(), librarySections: parsed.librarySections, libraryItems: parsed.libraryItems, librarySectionKinds: incomingSectionKinds, librarySectionIndents: incomingSectionIndents, titleData: incomingTitleData } : cv)
                    saveWorkspace({ resumesList: resumes, activeId: activeResumeId, activeSections: resumeSections, activeTitleData: titleData, masterCvsList: updated, activeCvId: activeMasterCvId, activeLibrarySections: parsed.librarySections, activeLibraryItems: parsed.libraryItems, activeLibrarySectionKinds: incomingSectionKinds, activeLibrarySectionIndents: incomingSectionIndents, activeLibraryTitleData: incomingTitleData, autosave: autosaveEnabled })
                    return updated
                  })
                  showDismissNotice('Successfully overwrote active Master CV!')
                }
              },
            })

          } else {
            showDialog({ type: 'alert', variant: 'error', title: 'Unrecognized File', message: 'This JSON was not exported from Resume Forge. The file must contain a valid "fileType" field.' })
          }
        } catch (e) {
          console.error(e)
          showDialog({ type: 'alert', variant: 'error', title: 'Parse Error', message: `Could not read the JSON file: ${e.message}` })
        }
      }
      reader.readAsText(file)
    }
    fileInput.click()
  }

  const triggerJsonExport = () => {
    const activeRes = resumes.find((r) => r.id === activeResumeId)
    const activeCv = masterCvs.find((c) => c.id === activeMasterCvId)
    showDialog({
      type: 'choice',
      title: 'Export JSON',
      message: 'Select what you would like to export:',
      choices: [
        { label: 'Export Active Resume', description: activeRes?.name || 'Untitled', value: 'resume' },
        { label: 'Export Active Master CV', description: activeCv?.name || 'Untitled', value: 'cv' },
      ],
      onChoice: (choice) => {
        let dataToExport = null
        let filename = 'export.json'
        if (choice === 'resume') {
          if (!activeRes) { showDialog({ type: 'alert', variant: 'error', title: 'Export Error', message: 'No active resume found to export.' }); return }
          dataToExport = { fileType: 'resume_forge_resume', version: 1, name: activeRes.name, createdAt: activeRes.createdAt, updatedAt: Date.now(), titleData, resumeSections }
          filename = `${activeRes.name || 'resume'}.json`
        } else {
          if (!activeCv) { showDialog({ type: 'alert', variant: 'error', title: 'Export Error', message: 'No active Master CV found to export.' }); return }
          dataToExport = { fileType: 'resume_forge_master_cv', version: 1, name: activeCv.name, createdAt: activeCv.createdAt, updatedAt: Date.now(), librarySections, libraryItems, librarySectionKinds, librarySectionIndents, titleData: libraryTitleData }
          filename = `${activeCv.name || 'master_cv'}.json`
        }
        const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = filename
        document.body.appendChild(a); a.click(); document.body.removeChild(a)
        URL.revokeObjectURL(url)
        showDismissNotice(`Exported “${filename}” successfully!`)
      },
    })
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
    sectionType: 'custom',
    paragraph: '',
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
    const allowedKinds = ['custom', 'list', 'paragraph']
    return allowedKinds.includes(targetKind) && allowedKinds.includes(itemType)
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

    if (sectionKind === 'paragraph') {
      let paragraphContent = ''
      if (item.paragraph) {
        paragraphContent = item.paragraph
      } else if (item.details) {
        paragraphContent = item.details.join('\n')
      } else if (item.bullets) {
        paragraphContent = item.bullets.join('\n')
      }
      return {
        ...common,
        type: 'paragraph',
        label: item.label || item.name || 'New Paragraph',
        name: item.name || item.label || '',
        paragraph: paragraphContent,
      }
    }

    // Custom or list kind
    const labelCandidate =
      item.label ||
      item.name ||
      `${item.degree ?? ''}${item.school ? ` - ${item.school}` : ''}`.trim() ||
      'New Item'

    let detailCandidates =
      item.details ??
      item.bullets ??
      (item.languages ? [...item.languages] : [])

    if (item.paragraph) {
      detailCandidates = [item.paragraph]
    }

    return {
      ...common,
      type: sectionKind, // 'custom' or 'list'
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
    const kind = librarySectionKinds[title] || inferKindFromTitle(title)
    const indented = librarySectionIndents[title] || false
    return {
      id,
      title,
      kind,
      indented,
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

  const removeLibrarySection = (sectionTitle) => {
    showDialog({
      type: 'confirm',
      title: 'Delete Master CV Section',
      message: `Are you sure you want to delete the Master CV section "${sectionTitle}" and all its library items? This cannot be undone.`,
      confirmLabel: 'Delete',
      onConfirm: () => {
        setLibrarySections((sections) => {
          const updated = sections.filter((s) => s !== sectionTitle)
          setLibraryActiveSection((current) => {
            if (current === sectionTitle) {
              return updated[0] ?? ''
            }
            return current
          })
          return updated
        })
        setLibraryItems((items) => {
          const copy = { ...items }
          delete copy[sectionTitle]
          return copy
        })
      },
    })
  }

  const removeLibraryItem = (sectionTitle, itemId) => {
    const activeItems = libraryItems[sectionTitle] ?? []
    const item = activeItems.find((i) => i.id === itemId)
    const itemLabel = item?.label || item?.name || 'this item'

    showDialog({
      type: 'confirm',
      title: 'Delete Master CV Item',
      message: `Are you sure you want to delete "${itemLabel}" from the Master CV library? This cannot be undone.`,
      confirmLabel: 'Delete',
      onConfirm: () => {
        setLibraryItems((items) => ({
          ...items,
          [sectionTitle]: (items[sectionTitle] ?? []).filter((i) => i.id !== itemId),
        }))
      },
    })
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
      sectionType: 'custom',
      paragraph: '',
      indented: false,
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
        ? librarySectionKinds[libraryActiveSection] || inferKindFromTitle(libraryActiveSection)
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
      paragraph: '',
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

  const openEditItem = (sectionId, itemId, target = 'resume') => {
    let item
    let itemType
    if (target === 'library') {
      const activeItems = libraryItems[sectionId] ?? []
      item = activeItems.find((entry) => entry.id === itemId)
      itemType = item?.type ?? librarySectionKinds[sectionId] ?? inferKindFromTitle(sectionId)
    } else {
      const section = resumeSections.find((item) => item.id === sectionId)
      item = section?.items.find((entry) => entry.id === itemId)
      itemType = item?.type ?? section?.kind ?? 'custom'
    }

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
      paragraph: item?.paragraph ?? '',
    })
    setModalState({
      open: true,
      mode: 'edit',
      type: 'item',
      target,
      itemType,
      sectionId,
      itemId,
    })
  }

  const openEditSection = (sectionId, target = 'resume') => {
    let title = ''
    let indented = false
    if (target === 'library') {
      title = sectionId
      indented = librarySectionIndents[sectionId] || false
    } else {
      const section = resumeSections.find((item) => item.id === sectionId)
      title = section?.title ?? ''
      indented = section?.indented ?? false
    }

    setModalForm({
      title,
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
      indented,
    })
    setModalState({
      open: true,
      mode: 'edit',
      type: 'section',
      target,
      itemType: 'custom',
      sectionId,
      itemId: null,
    })
  }

  const openEditTitle = (targetArg = 'resume') => {
    const target = targetArg === 'library' ? 'library' : 'resume'
    const activeTitleData = target === 'library' ? libraryTitleData : titleData
    setModalForm((prev) => ({
      ...prev,
      name: activeTitleData.name,
      subtitle: activeTitleData.subtitle,
      contacts:
        activeTitleData.contacts?.map((entry) => ({ ...entry })) ?? prev.contacts,
    }))
    setModalState({
      open: true,
      mode: 'edit',
      type: 'title',
      target,
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
      const isLibrary = modalState.target === 'library'
      const activeTitleData = isLibrary ? libraryTitleData : titleData
      const updatedTitleData = {
        name: modalForm.name.trim() || activeTitleData.name,
        subtitle: modalForm.subtitle.trim() || activeTitleData.subtitle,
        contacts: modalForm.contacts
          .map((entry) => ({
            label: entry.label.trim(),
            link: entry.link.trim(),
          }))
          .filter((entry) => entry.label || entry.link),
      }
      if (isLibrary) {
        setLibraryTitleData(updatedTitleData)
      } else {
        setTitleData(updatedTitleData)
      }
      closeModal()
      return
    }
    if (modalState.type === 'section') {
      if (modalState.target === 'library') {
        if (modalState.mode === 'add' && modalForm.title.trim()) {
          const sectionTitle = modalForm.title.trim()
          const sectionKind = modalForm.sectionType || 'custom'
          const sectionIndented = modalForm.indented || false
          setLibrarySections((sections) => [
            ...sections,
            sectionTitle,
          ])
          setLibraryItems((items) => ({
            ...items,
            [sectionTitle]: [],
          }))
          setLibrarySectionKinds((kinds) => ({
            ...kinds,
            [sectionTitle]: sectionKind,
          }))
          setLibrarySectionIndents((indents) => ({
            ...indents,
            [sectionTitle]: sectionIndented,
          }))
        }
        if (modalState.mode === 'edit' && modalForm.title.trim()) {
          const oldTitle = modalState.sectionId
          const newTitle = modalForm.title.trim()
          const sectionIndented = modalForm.indented || false
          if (oldTitle !== newTitle) {
            setLibrarySections((sections) =>
              sections.map((s) => (s === oldTitle ? newTitle : s))
            )
            setLibraryItems((items) => {
              const copy = { ...items }
              copy[newTitle] = copy[oldTitle] ?? []
              delete copy[oldTitle]
              return copy
            })
            setLibrarySectionKinds((kinds) => {
              const copy = { ...kinds }
              copy[newTitle] = copy[oldTitle] ?? 'custom'
              delete copy[oldTitle]
              return copy
            })
            setLibrarySectionIndents((indents) => {
              const copy = { ...indents }
              copy[newTitle] = sectionIndented
              delete copy[oldTitle]
              return copy
            })
            if (libraryActiveSection === oldTitle) {
              setLibraryActiveSection(newTitle)
            }
          } else {
            setLibrarySectionIndents((indents) => ({
              ...indents,
              [oldTitle]: sectionIndented,
            }))
          }
        }
      } else {
        if (modalState.mode === 'add' && modalForm.title.trim()) {
          const newId = generateId('section')
          const newKind = modalForm.sectionType || 'custom'
          const indented = modalForm.indented || false
          setResumeSections((sections) => [
            ...sections,
            { id: newId, title: modalForm.title.trim(), kind: newKind, items: [], indented },
          ])
        }
        if (modalState.mode === 'edit' && modalForm.title.trim()) {
          const indented = modalForm.indented || false
          setResumeSections((sections) =>
            sections.map((section) =>
              section.id === modalState.sectionId
                ? { ...section, title: modalForm.title.trim(), indented }
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
              : modalState.itemType === 'paragraph'
                ? modalForm.paragraph.trim()
                : modalForm.itemName.trim()
        if (!hasRequiredField) {
          closeModal()
          return
        }

        const targetSection =
          modalForm.sectionId || modalState.sectionId || libraryActiveSection || librarySections[0]
        if (!targetSection) {
          closeModal()
          return
        }

        if (modalState.mode === 'add') {
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
                : modalState.itemType === 'paragraph'
                  ? {
                      ...newItemBase,
                      label: modalForm.itemName.trim() || (modalForm.paragraph.trim().substring(0, 30) + (modalForm.paragraph.trim().length > 30 ? '...' : '')),
                      name: modalForm.itemName.trim(),
                      paragraph: modalForm.paragraph,
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

        if (modalState.mode === 'edit') {
          if (targetSection !== modalState.sectionId) {
            let originalItem = null;
            const originalList = libraryItems[modalState.sectionId] ?? [];
            originalItem = originalList.find((i) => i.id === modalState.itemId);
            const enabled = originalItem ? originalItem.enabled : true;

            const destKind = modalState.itemType;

            let updatedItem;
            if (destKind === 'education') {
              updatedItem = {
                id: modalState.itemId,
                type: 'education',
                label: `${modalForm.degree.trim()} - ${modalForm.school.trim()}`,
                degree: modalForm.degree.trim(),
                school: modalForm.school.trim(),
                location: modalForm.location.trim(),
                field: modalForm.field.trim(),
                dates: modalForm.dates.trim(),
                bullets: splitLines(modalForm.bullets),
                enabled,
              };
            } else if (destKind === 'language') {
              updatedItem = {
                id: modalState.itemId,
                type: 'language',
                label: 'Languages',
                languages: splitList(modalForm.languages),
                enabled,
              };
            } else if (destKind === 'paragraph') {
              updatedItem = {
                id: modalState.itemId,
                type: 'paragraph',
                label: modalForm.itemName.trim() || (modalForm.paragraph.trim().substring(0, 30) + (modalForm.paragraph.trim().length > 30 ? '...' : '')),
                name: modalForm.itemName.trim(),
                paragraph: modalForm.paragraph,
                enabled,
              };
            } else {
              updatedItem = {
                id: modalState.itemId,
                type: destKind,
                label: modalForm.itemName.trim(),
                name: modalForm.itemName.trim(),
                subtitle: modalForm.subtitle.trim(),
                location: modalForm.location.trim(),
                dates: modalForm.dates.trim(),
                details: splitLines(modalForm.details),
                enabled,
              };
            }

            setLibraryItems((items) => {
              const copy = { ...items };
              copy[modalState.sectionId] = (copy[modalState.sectionId] ?? []).filter(
                (item) => item.id !== modalState.itemId
              );
              copy[targetSection] = [...(copy[targetSection] ?? []), updatedItem];
              return copy;
            });
          } else {
            setLibraryItems((items) => ({
              ...items,
              [targetSection]: (items[targetSection] ?? []).map((item) =>
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
                      : modalState.itemType === 'paragraph'
                        ? {
                            ...item,
                            label: modalForm.itemName.trim() || (modalForm.paragraph.trim().substring(0, 30) + (modalForm.paragraph.trim().length > 30 ? '...' : '')),
                            name: modalForm.itemName.trim(),
                            paragraph: modalForm.paragraph,
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
                  : item
              ),
            }));
          }
        }
      } else {
        const targetSectionId =
          modalForm.sectionId || modalState.sectionId || resumeSections[0]?.id
        const hasRequiredField =
          modalState.itemType === 'education'
            ? modalForm.degree.trim() || modalForm.school.trim()
            : modalState.itemType === 'language'
              ? modalForm.languages.trim()
              : modalState.itemType === 'paragraph'
                ? modalForm.paragraph.trim()
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
                          : modalState.itemType === 'paragraph'
                            ? {
                                id: newId,
                                type: 'paragraph',
                                label: modalForm.itemName.trim() || (modalForm.paragraph.trim().substring(0, 30) + (modalForm.paragraph.trim().length > 30 ? '...' : '')),
                                name: modalForm.itemName.trim(),
                                paragraph: modalForm.paragraph,
                                enabled: true,
                              }
                            : {
                                id: newId,
                                type: modalState.itemType,
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
          if (targetSectionId !== modalState.sectionId) {
            let originalItem = null;
            const originalSection = resumeSections.find((s) => s.id === modalState.sectionId);
            if (originalSection) {
              originalItem = originalSection.items.find((i) => i.id === modalState.itemId);
            }
            const enabled = originalItem ? originalItem.enabled : true;

            const destSection = resumeSections.find((s) => s.id === targetSectionId);
            const destKind = destSection?.kind || 'custom';

            let updatedItem;
            if (destKind === 'education') {
              updatedItem = {
                id: modalState.itemId,
                type: 'education',
                label: `${modalForm.degree.trim()} - ${modalForm.school.trim()}`,
                degree: modalForm.degree.trim(),
                school: modalForm.school.trim(),
                location: modalForm.location.trim(),
                field: modalForm.field.trim(),
                dates: modalForm.dates.trim(),
                bullets: splitLines(modalForm.bullets),
                enabled,
              };
            } else if (destKind === 'language') {
              updatedItem = {
                id: modalState.itemId,
                type: 'language',
                label: 'Languages',
                languages: splitList(modalForm.languages),
                enabled,
              };
            } else if (destKind === 'paragraph') {
              updatedItem = {
                id: modalState.itemId,
                type: 'paragraph',
                label: modalForm.itemName.trim() || (modalForm.paragraph.trim().substring(0, 30) + (modalForm.paragraph.trim().length > 30 ? '...' : '')),
                name: modalForm.itemName.trim(),
                paragraph: modalForm.paragraph,
                enabled,
              };
            } else {
              updatedItem = {
                id: modalState.itemId,
                type: destKind,
                label: modalForm.itemName.trim(),
                name: modalForm.itemName.trim(),
                subtitle: modalForm.subtitle.trim(),
                location: modalForm.location.trim(),
                dates: modalForm.dates.trim(),
                details: splitLines(modalForm.details),
                enabled,
              };
            }

            setResumeSections((sections) =>
              sections.map((section) => {
                if (section.id === modalState.sectionId) {
                  return {
                    ...section,
                    items: section.items.filter((item) => item.id !== modalState.itemId),
                  };
                } else if (section.id === targetSectionId) {
                  return {
                    ...section,
                    items: [...section.items, updatedItem],
                  };
                }
                return section;
              })
            );
          } else {
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
                              : modalState.itemType === 'paragraph'
                                ? {
                                    ...item,
                                    label: modalForm.itemName.trim() || (modalForm.paragraph.trim().substring(0, 30) + (modalForm.paragraph.trim().length > 30 ? '...' : '')),
                                    name: modalForm.itemName.trim(),
                                    paragraph: modalForm.paragraph,
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
        if (section.kind === 'paragraph') {
          return {
            title: section.title.toUpperCase(),
            kind: 'paragraph',
            indented: section.indented || false,
            items: enabledItems.map((item) => ({
              label: item.label || '',
              paragraph: item.paragraph || '',
            })),
          }
        }
        return {
          title: section.title.toUpperCase(),
          kind: section.kind || 'custom',
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
        const kind = librarySectionKinds[sectionName] || inferKindFromTitle(sectionName)

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
        if (kind === 'paragraph') {
          return {
            title: sectionName.toUpperCase(),
            kind: 'paragraph',
            indented: librarySectionIndents[sectionName] || false,
            items: libList.map((item) => ({
              label: item.label || '',
              paragraph: item.paragraph || '',
            })),
          }
        }
        return {
          title: sectionName.toUpperCase(),
          kind: kind || 'custom',
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
      name: libraryTitleData.name || defaultResume.name,
      subtitle: libraryTitleData.subtitle || defaultResume.subtitle,
      contacts: libraryTitleData.contacts?.length 
        ? libraryTitleData.contacts.map((entry) => ({ ...entry })) 
        : defaultResume.contacts.map((entry) => ({ ...entry })),
      sections,
    }
  }

  const compiledResume = useMemo(() => {
    return buildResumeFromState()
  }, [resumeSections, titleData])

  const masterResume = useMemo(() => {
    return buildMasterResume()
  }, [libraryItems, librarySections, libraryTitleData])

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
          dirtyResumeIds={dirtyResumeIds}
          dirtyCvIds={dirtyCvIds}
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
              onEditSection={(sectionTitle) => openEditSection(sectionTitle, 'library')}
              onRemoveSection={removeLibrarySection}
              onEditItem={(sectionTitle, itemId) => openEditItem(sectionTitle, itemId, 'library')}
              onRemoveItem={removeLibraryItem}
              onEditTitle={openEditTitle}
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
        librarySectionKinds={librarySectionKinds}
        onSubmit={handleModalSubmit}
        onClose={closeModal}
        onBackdropClose={handleBackdropClose}
      />
      <DismissNotice
        visible={dismissNotice.visible}
        message={dismissNotice.message}
        onClose={() => setDismissNotice({ visible: false, message: '' })}
      />
      <DialogModal dialog={dialog} onClose={closeDialog} />
    </div>
  )
}

export default Builder
