import { useState, useEffect, useRef } from 'react'
import { generateResumePdfDoc, buildResumePdf } from '../../pdf/buildResumePdf'

function LivePdfPanel({ resume, masterResume }) {
  const [activeTab, setActiveTab] = useState('pdf') // Default to 'pdf' (Created Resume) for active draft focus
  const [pdfUrl, setPdfUrl] = useState(null)
  const [masterPdfUrl, setMasterPdfUrl] = useState(null)
  const [createdPageCount, setCreatedPageCount] = useState(1)
  const [masterPageCount, setMasterPageCount] = useState(1)
  const [isGenerating, setIsGenerating] = useState(false)
  const [zoomScale, setZoomScale] = useState(55) // Default zoom scaled to 55%

  // Hand Tool Panning State
  const [isHandTool, setIsHandTool] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, scrollTop: 0, scrollLeft: 0 })
  const containerRef = useRef(null)

  // Generate both Created Resume and Master CV PDFs in parallel when states update
  useEffect(() => {
    let active = true
    const updatePreviewData = async () => {
      if (!resume || !masterResume) return
      setIsGenerating(true)
      try {
        // 1. Generate Created Resume PDF (Enabled items only)
        const doc = await generateResumePdfDoc(resume)
        if (!active) return
        const count = doc.getNumberOfPages()
        setCreatedPageCount(count)

        const blob = doc.output('blob')
        const url = URL.createObjectURL(blob)

        setPdfUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev)
          return url
        })

        // 2. Generate Master CV PDF (All items)
        const masterDoc = await generateResumePdfDoc(masterResume)
        if (!active) return
        const masterCount = masterDoc.getNumberOfPages()
        setMasterPageCount(masterCount)

        const masterBlob = masterDoc.output('blob')
        const masterUrl = URL.createObjectURL(masterBlob)

        setMasterPdfUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev)
          return masterUrl
        })
      } catch (err) {
        console.error('Error generating preview states:', err)
      } finally {
        setIsGenerating(false)
      }
    }

    updatePreviewData()

    return () => {
      active = false
    }
  }, [resume, masterResume])

  const handlePrint = () => {
    const currentUrl = activeTab === 'master' ? masterPdfUrl : pdfUrl
    if (!currentUrl) return
    const printWindow = window.open(currentUrl)
    if (printWindow) {
      printWindow.addEventListener('load', () => {
        printWindow.print()
      })
    }
  }

  // Hand Tool Event Handlers for Drag Panning
  const handleMouseDown = (e) => {
    if (!isHandTool) return
    setIsDragging(true)
    const container = containerRef.current
    if (container) {
      setDragStart({
        x: e.clientX,
        y: e.clientY,
        scrollTop: container.scrollTop,
        scrollLeft: container.scrollLeft,
      })
    }
    e.preventDefault()
  }

  const handleMouseMove = (e) => {
    if (!isDragging || !isHandTool) return
    const container = containerRef.current
    if (container) {
      const dx = e.clientX - dragStart.x
      const dy = e.clientY - dragStart.y
      container.scrollTop = dragStart.scrollTop - dy
      container.scrollLeft = dragStart.scrollLeft - dx
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const activePageCount = activeTab === 'master' ? masterPageCount : createdPageCount

  return (
    <section className="w-full min-w-0 flex flex-col rounded-3xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl transition-all duration-300">
      {/* Header controls toolbar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-300">
            Live Preview
          </h2>
          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium tracking-wide text-amber-200">
            {activePageCount} {activePageCount === 1 ? 'Page' : 'Pages'}
          </span>
        </div>

        {/* Tab selection */}
        <div className="flex rounded-full bg-slate-950 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('master')}
            className={`rounded-full px-3.5 py-1 text-[11px] font-semibold uppercase tracking-wider transition ${
              activeTab === 'master'
                ? 'bg-white text-slate-950 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Master CV
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pdf')}
            className={`rounded-full px-3.5 py-1 text-[11px] font-semibold uppercase tracking-wider transition ${
              activeTab === 'pdf'
                ? 'bg-white text-slate-950 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Created Resume
          </button>
        </div>
      </div>

      {/* View controls (zoom / actions) */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Zoom adjustment for preview containers */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 uppercase tracking-widest text-[10px]">Scale:</span>
          <div className="flex items-center rounded-lg bg-slate-950/60 p-0.5 border border-slate-800">
            <button
              type="button"
              disabled={zoomScale <= 50}
              onClick={() => setZoomScale((prev) => Math.max(50, prev - 5))}
              className="px-2 py-1 font-bold text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400"
            >
              -
            </button>
            <span className="min-w-[40px] text-center font-mono text-xs text-slate-300">
              {zoomScale}%
            </span>
            <button
              type="button"
              disabled={zoomScale >= 120}
              onClick={() => setZoomScale((prev) => Math.min(120, prev + 5))}
              className="px-2 py-1 font-bold text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400"
            >
              +
            </button>
          </div>
        </div>

        {/* Hand Tool selection */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 uppercase tracking-widest text-[10px]">Tool:</span>
          <div className="flex items-center rounded-lg bg-slate-950/60 p-0.5 border border-slate-800">
            <button
              type="button"
              onClick={() => setIsHandTool(false)}
              className={`rounded px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider transition ${
                !isHandTool
                  ? 'bg-slate-800 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Select
            </button>
            <button
              type="button"
              onClick={() => setIsHandTool(true)}
              className={`rounded px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider transition ${
                isHandTool
                  ? 'bg-slate-800 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Pan (Hand)
            </button>
          </div>
        </div>

        {/* Diagnostic / utility buttons */}
        <div className="flex items-center gap-2">
          {((activeTab === 'master' && masterPdfUrl) || (activeTab === 'pdf' && pdfUrl)) && (
            <>
              <button
                type="button"
                onClick={handlePrint}
                className="rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-1.5 font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white"
              >
                Print
              </button>
              <button
                type="button"
                onClick={() => buildResumePdf(activeTab === 'master' ? masterResume : resume)}
                className="rounded-lg bg-emerald-500 hover:bg-emerald-600 px-3 py-1.5 font-semibold text-slate-950 transition"
              >
                Download
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Preview Container */}
      <div
        ref={containerRef}
        className="relative block w-full min-w-0 min-h-[580px] max-h-[700px] overflow-auto rounded-2xl border border-slate-800 bg-slate-950/70 p-4 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent"
      >
        {/* Loader backdrop */}
        {isGenerating && !pdfUrl && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/80 gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-300 border-t-transparent" />
            <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Generating Live Layout...
            </span>
          </div>
        )}

        {/* Unified Bounded Wrapper to prevent layout shifts. Sized dynamically based on zoom scale, avoiding low-res CSS transform scale. */}
        <div
          className="transition-all duration-300 flex flex-col items-center gap-6 mx-auto"
          style={{
            width: `${(612 * zoomScale) / 100}pt`,
            minWidth: `${(612 * zoomScale) / 100}pt`,
            maxWidth: `${(612 * zoomScale) / 100}pt`,
          }}
        >
          {activeTab === 'master' ? (
            // ── Tab 1: Master CV Full PDF ──
            <div className="w-full pb-6 relative" style={{ height: `${(792 * masterPageCount * zoomScale) / 100}pt` }}>
              {masterPdfUrl ? (
                <>
                  <iframe
                    key="master-cv-iframe"
                    title="Master CV Render"
                    src={`${masterPdfUrl}#toolbar=0&navpanes=0&view=FitH`}
                    style={{
                      width: `${(612 * zoomScale) / 100}pt`,
                      height: `${(792 * masterPageCount * zoomScale) / 100}pt`,
                    }}
                    className="rounded-xl border border-slate-800 bg-white"
                  />
                  {isHandTool && (
                    <div
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                      className={`absolute inset-0 pb-6 z-20 rounded-xl ${
                        isDragging ? 'cursor-grabbing' : 'cursor-grab'
                      }`}
                      style={{
                        width: `${(612 * zoomScale) / 100}pt`,
                        height: `${(792 * masterPageCount * zoomScale) / 100}pt`,
                      }}
                    />
                  )}
                </>
              ) : (
                <div className="flex h-[550px] w-full items-center justify-center text-xs uppercase tracking-widest text-slate-500">
                  Building Master CV buffer...
                </div>
              )}
            </div>
          ) : (
            // ── Tab 2: Created Resume PDF ──
            <div className="w-full pb-6 relative" style={{ height: `${(792 * createdPageCount * zoomScale) / 100}pt` }}>
              {pdfUrl ? (
                <>
                  <iframe
                    key="created-resume-iframe"
                    title="Live PDF Render"
                    src={`${pdfUrl}#toolbar=0&navpanes=0&view=FitH`}
                    style={{
                      width: `${(612 * zoomScale) / 100}pt`,
                      height: `${(792 * createdPageCount * zoomScale) / 100}pt`,
                    }}
                    className="rounded-xl border border-slate-800 bg-white"
                  />
                  {isHandTool && (
                    <div
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                      className={`absolute inset-0 pb-6 z-20 rounded-xl ${
                        isDragging ? 'cursor-grabbing' : 'cursor-grab'
                      }`}
                      style={{
                        width: `${(612 * zoomScale) / 100}pt`,
                        height: `${(792 * createdPageCount * zoomScale) / 100}pt`,
                      }}
                    />
                  )}
                </>
              ) : (
                <div className="flex h-[550px] w-full items-center justify-center text-xs uppercase tracking-widest text-slate-500">
                  Building PDF engine buffer...
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default LivePdfPanel
