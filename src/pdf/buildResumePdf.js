import jsPDF from 'jspdf'
import { defaultResume } from '../data/defaultResume'

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

export async function buildResumePdf(resume = defaultResume) {
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
    if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) {
      if (/^(https?|mailto):/i.test(trimmed)) {
        return trimmed
      }
      return ''
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
