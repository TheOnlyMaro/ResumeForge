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

export function buildPdf(resume = defaultResume) {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 56
  let y = 64

  const centerX = pageWidth / 2
  const leftX = margin
  const rightX = pageWidth - margin

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.text(resume.name, centerX, y, { align: 'center' })

  y += 18
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(11)
  doc.text(resume.subtitle, centerX, y, { align: 'center' })

  y += 16
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  const contactLine = resume.contact.join(' | ')
  doc.text(contactLine, centerX, y, { align: 'center' })

  y += 24

  const drawSectionTitle = (title) => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text(title, leftX, y)
    y += 6
    doc.setDrawColor(148, 163, 184)
    doc.line(leftX, y, rightX, y)
    y += 12
  }

  const drawLinePair = (leftText, rightText, style = 'normal') => {
    doc.setFont('helvetica', style)
    doc.setFontSize(11)
    doc.text(leftText, leftX, y)
    doc.text(rightText, rightX, y, { align: 'right' })
    y += 14
  }

  const drawSubLinePair = (leftText, rightText) => {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(10)
    doc.text(leftText, leftX, y)
    doc.text(rightText, rightX, y, { align: 'right' })
    y += 12
  }

  const drawBullets = (bullets) => {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    bullets.forEach((bullet) => {
      doc.text(`- ${bullet}`, leftX + 12, y)
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
  doc.setFont('helvetica', 'normal')
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
            onClick={() => buildPdf()}
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
