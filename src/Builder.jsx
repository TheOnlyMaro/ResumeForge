import jsPDF from 'jspdf'

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
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
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
            </div>
            <p className="mt-2 text-sm text-slate-300">
              Harvard template (bulleted) - builder UI scaffold.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={async () => {
                await buildPdf()
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
            <div className="flex flex-col gap-3">
              {['Experience', 'Projects', 'Skills', 'Certifications'].map(
                (item) => (
                  <div
                    key={item}
                    className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/40 px-4 py-3"
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
          </section>

          <section className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-300">
                Live PDF
              </h2>
              <span className="text-xs text-slate-500">Preview</span>
            </div>
            <div className="flex h-[520px] items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 text-sm text-slate-500">
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

              {[
                {
                  title: 'Education',
                  items: ['B.Sc. Visual Communication', 'Honors thesis'],
                },
                {
                  title: 'Experience',
                  items: ['Lead Product Designer', 'Product Designer'],
                },
              ].map((section) => (
                <div
                  key={section.title}
                  className="rounded-2xl border border-slate-800 bg-slate-950/40 p-3"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500">::</span>
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
                  <div className="flex flex-col gap-2">
                    {section.items.map((item) => (
                      <div
                        key={item}
                        className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2"
                      >
                        <div className="flex items-center gap-3">
                          <input type="checkbox" defaultChecked />
                          <span className="text-xs text-slate-200">{item}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] uppercase text-slate-400">
                          <button type="button">Edit</button>
                          <button type="button">X</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default Builder
