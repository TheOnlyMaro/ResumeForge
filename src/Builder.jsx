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
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
              Resume Forge
            </p>
            <h1 className="text-3xl font-semibold text-white">
              Resume Builder
            </h1>
            <p className="mt-2 text-sm text-slate-300">
              Harvard template (bulleted) - sample output only.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate?.('/')}
            className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300 transition hover:border-slate-500"
          >
            Back home
          </button>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8">
          <p className="text-sm text-slate-300">
            Click below to generate a sample PDF using default data. This is a
            placeholder for the full builder UI (sections, drag-and-drop,
            checkboxes, and JSON persistence).
          </p>
          <button
            type="button"
            onClick={async () => {
              await buildPdf()
            }}
            className="mt-6 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-900 hover:text-white"
          >
            Generate sample PDF
          </button>
        </div>
      </div>
    </div>
  )
}

export default Builder
