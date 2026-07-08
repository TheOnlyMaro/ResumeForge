# RESUMEFORGE - COMPLETE FEATURE & MODULE SPECIFICATION

## SYSTEM OVERVIEW
ResumeForge is a **local-first, single-page web application** for creating multiple tailored resumes from a centralized master CV database. Users maintain one structured "Master CV" repository and generate specialized resumes by selectively including/excluding sections and items. The entire system operates client-side with localStorage persistence—no server required.

---

## CORE FEATURES (IN DETAIL)

### 1. WORKSPACE MANAGEMENT

- **Multi-Resume Architecture**: Support for unlimited resume variants stored in memory/localStorage
- **Multi-Master-CV Support**: Support for multiple master CV repositories (users can maintain different master CVs for different fields)
- **File Switching**: Instant switching between:
  - Active Resume (currently being edited)
  - Active Master CV (library source being drawn from)
- **File Operations**:
  - **Create**: New empty resume, or new resume cloned from active Master CV
  - **Duplicate**: Duplicate any existing resume as a new variant
  - **Rename**: Rename resumes and master CVs with custom names
  - **Delete**: Remove resumes (UI prevents deletion if only one remains)
  - **List Management**: Dropdown selectors for quick file switching
- **Dirty-State Tracking**: Visual indicators (● dot) on unsaved file names in UI
- **Session Recovery**: Browser sessionStorage tracks last-viewed resume/CV per tab—survives refresh but not tab close

### 2. RESUME BUILDER (MAIN WORKSPACE)

#### Title/Header Section (Always locked):
- Edit name (bold, centered, underlined)
- Edit subtitle (italic, centered)
- Manage contact entries (up to 4+):
  - Email with mailto link generation
  - Phone numbers
  - LinkedIn URLs
  - Physical addresses
  - Custom labels and links

#### Section Management:
- Reorder sections via drag-and-drop (dnd-kit library)
- Each section has:
  - Title (editable)
  - Section type/kind (determines rendering format):
    - `custom` – multi-line entries with title, subtitle, location, dates, bullet points
    - `education` – academic entries (school, degree, subtitle, location, dates, bullets)
    - `list` – simple key-value pairs
    - `paragraph` – long-form text with markdown support (bold `*text*`, italic `_text_`)
    - `language` – simple string list
  - Indentation toggle (sections like "Profile" can be visually indented)
  - Add/Edit/Remove controls

#### Item Management within Sections:
- Toggle items on/off for inclusion in current resume (❌ vs ✓ visibility)
- Reorder items within section via drag-and-drop
- Edit individual items (opens modal with type-specific fields)
- Remove items from section
- Support for variable item types based on section kind:
  - Custom items: title, subtitle, location, dates, multi-line details
  - Education items: school, degree, subtitle, location, dates, bullets
  - Paragraph items: long-form text field
  - Language items: simple text
  - List items: key-value pairs

### 3. MASTER CV LIBRARY PANEL

#### Dual-Mode Library:
- **Left Side**: Master CV Library (source of content)
  - All sections from active Master CV
  - All items within each section (whether visible in current resume or not)
  - Full item set available for drag into resume

#### Library Organization:
- Section categories (automatically created)
- Within each section: full list of career/education/project items
- Section kind definitions (determine how items render)
- Section indentation preferences

#### Library Editing:
- Add new sections to Master CV
- Add new items to any section
- Edit section properties (title, kind, indentation)
- Edit item details (all fields for the item type)
- Remove sections and items
- Locked title section (same as resume)

#### Drag-and-Drop Integration:
- Drag sections from library → resume (auto-adds to resume, visible and enabled)
- Drag items from library section → resume section (adds item, visible and enabled)
- Visual feedback during drag operations (highlighting target zones)
- Preview insertion position with placeholder styling

### 4. LIVE PDF PREVIEW & EXPORT

#### Dual PDF Rendering:
- **Created Resume Tab**: Shows only ENABLED items from current resume (ready for export)
- **Master CV Tab**: Shows ALL items from Master CV (for reference, complete content library)
- Real-time preview updating as you edit
- Side-by-side page panning for comparison

#### PDF Features:
- Harvard resume template styling:
  - Centered header with name and underline
  - Subtitle below name
  - Contact row (email, LinkedIn, phone, location)
  - Section-based layout with proper spacing
  - Bullet points for details
  - Support for markdown formatting in content (bold, italic)
  - Multi-page support with automatic page breaks
- **Font Support**: Calibri font family (regular, bold, italic, bold-italic) embedded as TTF files
- **Pagination**: Automatic page breaks when content exceeds page height
- **Zoom Controls**: 55% default zoom, adjustable scale for readability
- **Hand Tool**: Click-and-drag panning within PDF viewer for navigation
- **Print Function**: Direct print-to-PDF from print dialog
- **Download**: Export as PDF file

#### PDF Export Actions:
- Print button (opens print dialog)
- Download as PDF (saves with default filename)
- Page count display for both Created and Master PDFs

### 5. DATA PERSISTENCE & AUTOSAVE

#### LocalStorage Structure:
```json
{
  "resume_forge_workspace_v2": {
    "activeResumeId": "string",
    "activeMasterCvId": "string",
    "autosaveEnabled": "boolean",
    "resumes": [
      {
        "id": "string",
        "name": "string",
        "createdAt": "number",
        "updatedAt": "number",
        "titleData": "object",
        "resumeSections": "array"
      }
    ],
    "masterCvs": [
      {
        "id": "string",
        "name": "string",
        "createdAt": "number",
        "updatedAt": "number",
        "librarySections": "array",
        "libraryItems": "object",
        "librarySectionKinds": "object",
        "librarySectionIndents": "object",
        "titleData": "object"
      }
    ]
  }
}
```

#### SessionStorage (for UI state):
```json
{
  "resume_forge_active_ids": {
    "activeResumeId": "string",
    "activeMasterCvId": "string"
  }
}
```

#### Autosave Feature:
- Toggle on/off in workspace bar
- When enabled: automatically saves after every edit
- Unsaved changes warning when closing/refreshing browser

#### Manual Save:
- Explicit save action in workspace bar
- Saves all current in-memory state to localStorage
- Updates file timestamps (createdAt, updatedAt)

#### Import/Export:
- Export entire workspace as JSON file
- Import JSON file to restore workspace state

### 6. UI/UX FEATURES

#### Dark Theme:
- Default dark mode (slate color palette)
- Light mode toggle in header
- Persisted theme preference

#### Modal System:
- Custom dialog modal (replaces native alert/confirm)
- Type-specific forms for:
  - Adding/editing titles
  - Adding/editing sections
  - Adding/editing items
- Form validation and error handling

#### Visual Feedback:
- Drag-and-drop highlighting
- Insert position previews
- Hover effects on buttons
- Dismiss notices for notifications
- Loading states during PDF generation

#### Responsive Layout:
- Mobile-friendly workspace bar
- Responsive component sizing
- Flexible grid layouts (md breakpoint)

---

## DATA STRUCTURES

### Resume Object:
```javascript
{
  id: "resume-1",
  name: "Software Engineer Resume",
  createdAt: 1234567890,
  updatedAt: 1234567890,
  titleData: {
    name: "John Doe",
    subtitle: "Senior Engineer",
    contacts: [
      {label: "email@domain.com", link: "mailto:email@domain.com"}
    ]
  },
  resumeSections: [
    {
      id: "section-1",
      title: "PROFESSIONAL EXPERIENCE",
      kind: "custom",
      indented: false,
      items: [
        {
          id: "item-1",
          title: "Senior Developer",
          subtitle: "Tech Corp",
          location: "SF, CA",
          dates: "2020-Present",
          details: ["Shipped 10 projects", "Led 5 engineers"]
        }
      ]
    }
  ]
}
```

### Master CV Object:
```javascript
{
  id: "cv-1",
  name: "Master CV - Technology",
  createdAt: 1234567890,
  updatedAt: 1234567890,
  librarySections: ["EXPERIENCE", "EDUCATION", "PROJECTS"],
  libraryItems: {
    "EXPERIENCE": [
      {id, title, subtitle, location, dates, details},
      // ...
    ],
    "EDUCATION": [
      // ...
    ],
    "PROJECTS": [
      // ...
    ]
  },
  librarySectionKinds: {
    "EXPERIENCE": "custom",
    "EDUCATION": "education",
    "PROJECTS": "custom"
  },
  librarySectionIndents: {
    "EXPERIENCE": false,
    "PROFILE": true
  },
  titleData: {
    name: "John Doe",
    subtitle: "Senior Engineer",
    contacts: [
      // ...
    ]
  }
}
```

---

## MODULE ARCHITECTURE

### UI LAYER COMPONENTS (src/components/builder/)

#### 1. WorkspaceBar.jsx - Top toolbar
- Resume file selector & operations menu
- Master CV file selector & operations menu
- Autosave toggle & manual save button
- Import/Export JSON buttons
- Dirty state indicators

#### 2. ResumePanel.jsx - Main editing panel
- Displays enabled resume sections & items
- Add section button
- Drag-and-drop target for library sections
- Section reordering
- Item toggle (enable/disable)
- Item reordering within section
- Edit/remove controls

#### 3. LibraryPanel.jsx - Master CV source library
- Master CV sections list
- Items within each section
- Drag source for sections/items
- Add/edit/remove operations
- Section/item management

#### 4. LivePdfPanel.jsx - PDF preview & export
- Tabbed interface (Created Resume / Master CV)
- PDF rendering via iframe
- Zoom controls
- Hand tool for panning
- Print button
- Download button
- Page count display
- Real-time PDF generation on state changes

#### 5. BuilderModal.jsx - Form modal for add/edit operations
- Title editing form
- Section editing form
- Item editing form (type-specific fields)
- Validation & submission
- Dynamic field rendering based on item type

#### 6. DialogModal.jsx - Custom dialog system
- Replaces native browser alerts/confirms
- Confirmation dialogs for destructive actions
- Styled consistent with app design

#### 7. DragItems.jsx - Drag-and-drop components
- SortableSectionCard - draggable section wrapper
- LibrarySortableSection - draggable library section
- LibrarySortableItem - draggable library item
- Hover effects and visual feedback
- Insert position indicators

#### 8. DismissNotice.jsx - Notification component
- Toast-style notices
- Auto-dismiss functionality
- Message display

### PROCESSING/LOGIC LAYER (src/)

#### 1. Builder.jsx - Main orchestrator state manager
- Centralized state for:
  - Resume list & active resume
  - Master CV list & active Master CV
  - Section and item data
  - Modal state
  - Dirty tracking
  - Autosave state
- Key handlers:
  - `switchActiveResume()` - file switching
  - `switchActiveMasterCv()` - library switching
  - `saveWorkspace()` - persist to localStorage
  - Drag-and-drop coordination
  - Item visibility toggling
  - CRUD operations for sections/items
- LocalStorage integration:
  - Load on mount
  - Save on demand
  - Autosave on interval
  - Dirty state detection

#### 2. App.jsx - Entry point & routing
- Landing page UI
- Route management (`/` vs `/builder`)
- Dark mode toggle
- Header navigation

### PDF GENERATION (src/pdf/buildResumePdf.js)

#### 1. generateResumePdfDoc() - Main PDF generator
- Creates jsPDF document instance
- Loads and embeds Calibri fonts
- Renders header (name, underline, subtitle, contacts)
- Renders sections with proper formatting:
  - Section titles with underlining
  - Type-specific item rendering:
    - Custom: title/subtitle on first line, location/dates on second, details as bullets
    - Education: school/degree, location/dates, bullets
    - Paragraph: full-width text with markdown parsing
    - Language: comma-separated list
    - List: key-value pairs
- Markdown support (bold `*text*`, italic `_text_`)
- Pagination logic with orphan prevention
- Proper spacing and margins
- Returns jsPDF document object

#### 2. Font Management:
- Pre-loads Calibri TTF files from `/public/Fonts/`
- Caches in-memory as base64
- Registers fonts with jsPDF
- Supports: normal, bold, italic, bold-italic

### DATA LAYER (src/data/)

#### 1. mockData.json - Initial template data
- DEFAULT_RESUME_SECTIONS
- DEFAULT_LIBRARY_SECTIONS
- DEFAULT_LIBRARY_SECTION_KINDS
- DEFAULT_LIBRARY_ITEMS
- DEFAULT_TITLE_DATA

#### 2. defaultResume.js - Sample resume template
- Complete example resume structure
- All section types represented
- Demonstrating markdown formatting
- Sample career history, education, projects, skills

---

## DRAG-AND-DROP SYSTEM (dnd-kit integration)

### Architecture:
- DndContext wraps entire builder
- Two separate drag contexts:
  1. Section-level: reorder sections within resume
  2. Item-level: reorder items within section, drag library items to resume

### Drag Sources:
- Section handles (:: icon) in resume sections
- Library section titles
- Library items

### Drop Targets:
- Resume root (for dropping library sections)
- Section containers (for dropping library items)
- Between items (for reordering)

### Visual Feedback:
- Highlight active drag item
- Show insertion placeholder
- Border/shadow highlighting on drop zones
- Opacity changes during drag

---

## ID GENERATION SYSTEM

**Format**: `{prefix}-{timestamp}-{counter}-{randomString}`
- Example: `item-1698765432-1-abc1def2`
- Ensures unique, chronologically sortable IDs
- Used for: sections, items, resumes, master CVs

---

## STATE MANAGEMENT DEPENDENCIES

### External Libraries:
- React 19.2.6 - UI framework
- @dnd-kit/core, @dnd-kit/sortable - drag-and-drop
- jsPDF 4.2.1 - PDF generation
- TailwindCSS 4.3 - styling

### Browser APIs:
- localStorage - persistent data
- sessionStorage - session state
- File API - JSON import
- Blob/URL.createObjectURL - PDF export
- window.print() - printing

---

## ERROR HANDLING & EDGE CASES

1. **Corrupted LocalStorage**: Resets to defaults with user notification
2. **Missing Files/Resumes**: Fallback to defaults
3. **PDF Generation Errors**: Console logging, user-facing message
4. **Font Loading Failures**: Graceful fallback to system fonts
5. **Unsaved Changes**: Browser warning on unload if dirty
6. **Single Resume Protection**: Cannot delete last resume

---

## KEY TECHNICAL DETAILS FOR REIMPLEMENTATION

### If rebuilding PDF module:
- Must handle multi-page layout with orphan prevention
- Font embedding for cross-platform consistency
- Markdown parsing for text formatting
- Dynamic height calculation for overflow detection

### If rebuilding DND system:
- Coordinate section + item drag contexts separately
- Track insertion indices for preview rendering
- Maintain sort order consistency

### If refactoring state management:
- Separate resume/CV data into independent atoms
- Keep title data with resume/CV (not globally)
- Track dirty state per file, not globally
- Use localStorage snapshot format for export/import

### If migrating storage:
- Current format in `resume_forge_workspace_v2` key
- Export/import via JSON for backup/restore
- Future targets: IndexedDB, cloud sync, local file system access

---

## FUTURE PLANNED FEATURES (from README)
- DOCX export format
- LaTeX export format
- Additional resume templates
- AI-assisted content rewriting
- Desktop app build (Tauri)
- Cloud sync & user accounts

---

## IMPLEMENTATION ROADMAP FOR OTHER DEVELOPERS

This specification provides enough detail for another developer to:

1. **Rebuild any module** in a different framework (Vue, Svelte, vanilla HTML/CSS/JS)
2. **Replace storage** (IndexedDB, backend API)
3. **Enhance PDF rendering** (add templates, styling options)
4. **Refactor state management** (Redux, Zustand, MobX)
5. **Build complementary tools** (CLI, API, mobile app)
6. **Create alternative export formats** (DOCX, LaTeX, HTML)
7. **Implement cloud sync** (add backend API integration)
8. **Port to different technologies** (Vue.js, Angular, Svelte, vanilla JavaScript)

---

## TECHNICAL CONTACT POINTS

### For UI/UX Questions:
- See: `src/components/builder/` folder
- Key files: `ResumePanel.jsx`, `LibraryPanel.jsx`, `WorkspaceBar.jsx`

### For State Management Questions:
- See: `src/Builder.jsx`
- Key patterns: dirty tracking, file switching, autosave

### For PDF Generation Questions:
- See: `src/pdf/buildResumePdf.js`
- Key concepts: pagination, font embedding, markdown parsing

### For Persistence Questions:
- See: `Builder.jsx` - `saveWorkspace()` function
- Storage key: `resume_forge_workspace_v2`

---

**Document Generated**: July 6, 2026
**Version**: 1.0 - Complete Feature & Module Specification
**Status**: Ready for development team handoff
