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

export async function generateResumePdfDoc(resume = defaultResume) {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' })
  await loadCalibriFonts()
  registerCalibriFonts(doc)

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 40
  const topMargin = 50
  const bottomMargin = 50
  const pageBottom = pageHeight - bottomMargin
  let y = topMargin

  const centerX = pageWidth / 2
  const leftX = margin
  const rightX = pageWidth - margin
  const contentWidth = rightX - leftX

  // ── Pagination helper ──────────────────────────────────────────────────────
  // Call before drawing anything. If y + needed height would exceed the page
  // bottom, a new page is added and y is reset to the top margin.
  const checkPageBreak = (neededHeight) => {
    if (y + neededHeight > pageBottom) {
      doc.addPage()
      y = topMargin
    }
  }

  // ── Header (name, subtitle, contacts) ────────────────────────────────────
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

    // If the user didn't specify a link, but the label looks like an email or a website, use the label
    let targetLink = trimmed
    if (!targetLink) {
      if (isEmail(fallbackLabel)) {
        return `mailto:${fallbackLabel}`
      }
      // If the label contains a dot and no spaces (e.g., github.com/user), treat it as a link
      if (/^[^\s]+\.[^\s]+$/.test(fallbackLabel)) {
        targetLink = fallbackLabel
      } else {
        return ''
      }
    }

    // Check if the link already starts with a protocol
    if (/^[a-z][a-z0-9+.-]*:/i.test(targetLink)) {
      // Only allow secure / safe protocols
      if (/^(https?|mailto):/i.test(targetLink)) {
        return targetLink
      }
      return ''
    }

    // If it's an email address, prepend mailto:
    if (isEmail(targetLink)) {
      return `mailto:${targetLink}`
    }

    // Otherwise, prepend https:// to the user-entered link
    return `https://${targetLink}`
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

  y += 24

  // ── Draw helpers ──────────────────────────────────────────────────────────

  const isAlphanumeric = (char) => /[a-zA-Z0-9]/.test(char)
  
  const isValidFormattingStart = (text, i, markerLength) => {
    // Opening marker must be preceded by start-of-line or space
    if (i > 0 && text[i - 1] !== ' ') {
      return false
    }
    
    // Opening marker must be followed by non-space alphanumeric character
    const nextIdx = i + markerLength
    if (nextIdx >= text.length || text[nextIdx] === ' ') {
      return false
    }
    
    return true
  }
  
  const isValidFormattingEnd = (text, i, markerLength) => {
    // Closing marker must be preceded by non-space alphanumeric character
    if (i === 0 || text[i - 1] === ' ') {
      return false
    }
    
    // Closing marker must be followed by space, non-alphanumeric, or end of string
    const nextIdx = i + markerLength
    if (nextIdx < text.length && text[nextIdx] !== ' ' && isAlphanumeric(text[nextIdx])) {
      return false
    }
    
    return true
  }

  const parseFormatting = (text) => {
    if (typeof text !== 'string') {
      text = String(text || '')
    }
    const segments = []
    let currentBold = false
    let currentItalic = false
    let currentUnderline = false
    
    let i = 0
    let lastIndex = 0
    
    while (i < text.length) {
      if (text.startsWith('__', i)) {
        const isOpening = !currentUnderline
        const isValid = isOpening 
          ? isValidFormattingStart(text, i, 2)
          : isValidFormattingEnd(text, i, 2)
        
        if (isValid) {
          if (i > lastIndex) {
            segments.push({
              text: text.substring(lastIndex, i),
              bold: currentBold,
              italic: currentItalic,
              underline: currentUnderline
            })
          }
          currentUnderline = !currentUnderline
          i += 2
          lastIndex = i
        } else {
          i += 1
        }
      } else if (text[i] === '*') {
        const isOpening = !currentBold
        const isValid = isOpening
          ? isValidFormattingStart(text, i, 1)
          : isValidFormattingEnd(text, i, 1)
        
        if (isValid) {
          if (i > lastIndex) {
            segments.push({
              text: text.substring(lastIndex, i),
              bold: currentBold,
              italic: currentItalic,
              underline: currentUnderline
            })
          }
          currentBold = !currentBold
          i += 1
          lastIndex = i
        } else {
          i += 1
        }
      } else if (text[i] === '_') {
        const isOpening = !currentItalic
        const isValid = isOpening
          ? isValidFormattingStart(text, i, 1)
          : isValidFormattingEnd(text, i, 1)
        
        if (isValid) {
          if (i > lastIndex) {
            segments.push({
              text: text.substring(lastIndex, i),
              bold: currentBold,
              italic: currentItalic,
              underline: currentUnderline
            })
          }
          currentItalic = !currentItalic
          i += 1
          lastIndex = i
        } else {
          i += 1
        }
      } else {
        i += 1
      }
    }
    
    if (lastIndex < text.length) {
      segments.push({
        text: text.substring(lastIndex),
        bold: currentBold,
        italic: currentItalic,
        underline: currentUnderline
      })
    }
    
    return segments
  }

  const wrapSegments = (segments, maxWidth) => {
    const lines = []
    let currentLine = []
    let currentLineWidth = 0
    const safeMaxWidth = Math.max(10, maxWidth || 10)
    
    segments.forEach((seg) => {
      // Split into words and spaces while preserving them
      const words = seg.text.split(/(\s+)/)
      
      words.forEach((word) => {
        if (!word) return
        
        let style = 'normal'
        if (seg.bold && seg.italic) style = 'bolditalic'
        else if (seg.bold) style = 'bold'
        else if (seg.italic) style = 'italic'
        
        doc.setFont('Calibri', style)
        doc.setFontSize(10)
        const wordWidth = doc.getTextWidth(word)
        
        if (currentLineWidth + wordWidth > safeMaxWidth) {
          if (currentLine.length > 0) {
            lines.push(currentLine)
          }
          currentLine = []
          currentLineWidth = 0
          
          if (/^\s+$/.test(word)) {
            return
          }
        }
        
        currentLine.push({
          text: word,
          bold: seg.bold,
          italic: seg.italic,
          underline: seg.underline
        })
        currentLineWidth += wordWidth
      })
    })
    
    if (currentLine.length > 0) {
      lines.push(currentLine)
    }
    
    return lines
  }

  const drawFormattedText = (text, startX, maxWidth) => {
    const safeText = typeof text === 'string' ? text : String(text || '')
    if (!safeText) return
    const lineHeight = 12
    const segments = parseFormatting(safeText)
    const wrappedLines = wrapSegments(segments, maxWidth)
    
    checkPageBreak(lineHeight * wrappedLines.length)
    
    wrappedLines.forEach((line) => {
      let currentX = startX
      
      line.forEach((seg) => {
        let style = 'normal'
        if (seg.bold && seg.italic) style = 'bolditalic'
        else if (seg.bold) style = 'bold'
        else if (seg.italic) style = 'italic'
        
        doc.setFont('Calibri', style)
        doc.setFontSize(10)
        doc.text(seg.text, currentX, y)
        
        const segWidth = doc.getTextWidth(seg.text)
        
        if (seg.underline) {
          doc.setLineWidth(0.6)
          doc.line(currentX, y + 1.5, currentX + segWidth, y + 1.5)
        }
        
        currentX += segWidth
      })
      
      y += lineHeight
      checkPageBreak(lineHeight)
    })
  }

  const formatBulletText = (bullet) => {
    const safeBullet = typeof bullet === 'string' ? bullet : String(bullet || '')
    const [label, rest] = safeBullet.split(/:(.+)/)
    if (rest) {
      const trimmedLabel = label.trim()
      if (!trimmedLabel.startsWith('*') && !trimmedLabel.startsWith('_')) {
        return `*${trimmedLabel}:* ${rest.trim()}`
      }
    }
    return safeBullet
  }

  const drawSectionTitle = (title) => {
    // Keep section title + at least one line of content on the same page.
    checkPageBreak(36)
    doc.setFont('Calibri', 'bold')
    doc.setFontSize(12)
    doc.text(title, leftX, y)
    y += 2
    doc.setDrawColor(0, 0, 0)
    doc.setLineWidth(0.8)
    doc.line(leftX, y, rightX, y)
    y += 13
  }

  const drawLinePair = (leftText, rightText, style = 'normal') => {
    checkPageBreak(12)
    doc.setFont('Calibri', style)
    doc.setFontSize(11)
    doc.text(leftText, leftX, y)
    doc.text(rightText, rightX, y, { align: 'right' })
    y += 12
  }

  const drawSubLinePair = (leftText, rightText) => {
    checkPageBreak(11)
    doc.setFont('Calibri', 'italic')
    doc.setFontSize(10)
    doc.text(leftText, leftX, y)
    doc.text(rightText, rightX, y, { align: 'right' })
    y += 11
  }

  const drawItemHeader = (title = '', subtitle = '', location = '', dates = '') => {
    const t = (title || '').trim()
    const s = (subtitle || '').trim()
    const loc = (location || '').trim()
    const d = (dates || '').trim()

    const shouldSkipTitle = t.startsWith('+') || t === '+'

    if (shouldSkipTitle) {
      if (s || loc || d) {
        let rightText = ''
        if (loc && d) {
          rightText = `${loc}  |  ${d}`
        } else {
          rightText = loc || d
        }
        drawSubLinePair(s, rightText)
      }
      return
    }

    if (!t && !s) {
      return
    }

    if (t && s) {
      drawLinePair(t, loc, 'bold')
      drawSubLinePair(s, d)
    } else if (t) {
      let rightText = ''
      if (loc && d) {
        rightText = `${loc}  |  ${d}`
      } else {
        rightText = loc || d
      }
      drawLinePair(t, rightText, 'bold')
    } else if (s) {
      let rightText = ''
      if (loc && d) {
        rightText = `${loc}  |  ${d}`
      } else {
        rightText = loc || d
      }
      drawLinePair(s, rightText, 'bold')
    }
  }

  const drawBullets = (bullets) => {
    if (!Array.isArray(bullets)) return
    const bulletIndent = 18
    const bulletRadius = 1.6
    const wrapWidth = contentWidth - bulletIndent

    bullets.forEach((bullet) => {
      if (bullet === undefined || bullet === null) return
      const formatted = formatBulletText(bullet)
      checkPageBreak(12)
      doc.setDrawColor(0, 0, 0)
      doc.setFillColor(0, 0, 0)
      
      const startY = y
      doc.circle(leftX + 6, startY - 3, bulletRadius, 'F')
      drawFormattedText(formatted, leftX + bulletIndent, wrapWidth)
    })
  }

  const drawParagraph = (text, indented = false) => {
    const safeText = typeof text === 'string' ? text : String(text || '')
    const lines = safeText.split('\n')
    lines.forEach((pText) => {
      let formattedText = pText.trim()
      if (indented) {
        formattedText = '      ' + formattedText
      }
      drawFormattedText(formattedText, leftX, contentWidth)
      y += 3
    })
  }

  const drawNonBulletedLines = (lines) => {
    if (!Array.isArray(lines)) return
    lines.forEach((line) => {
      if (line !== undefined && line !== null) {
        drawFormattedText(String(line), leftX, contentWidth)
      }
    })
  }

  // ── Content ───────────────────────────────────────────────────────────────

  if (resume.sections?.length) {
    resume.sections.forEach((section) => {
      if (typeof section === 'object' && section.kind) {
        if (section.kind === 'education') {
          drawSectionTitle(section.title || 'EDUCATION')
          section.items.forEach((item) => {
            const title = `${item.degree || ''}${item.school ? ` - ${item.school}` : ''}`.trim()
            drawItemHeader(title, item.subtitle, item.location, item.dates)
            if (item.bullets?.length) {
              drawBullets(item.bullets)
            }
            y += 6
          })
        } else if (section.kind === 'language') {
          drawSectionTitle(section.title || 'LANGUAGES')
          checkPageBreak(12)
          doc.setFont('Calibri', 'normal')
          doc.setFontSize(10)
          doc.text(section.items.join(' | '), leftX, y)
          y += 12
        } else if (section.kind === 'paragraph') {
          drawSectionTitle(section.title)
          section.items.forEach((item) => {
            if (item.paragraph) {
              drawParagraph(item.paragraph, section.indented)
            }
            y += 6
          })
        } else if (section.kind === 'list') {
          drawSectionTitle(section.title)
          section.items.forEach((item) => {
            drawItemHeader(item.title, item.subtitle, item.location, item.dates)
            if (item.details?.length) {
              drawNonBulletedLines(item.details)
            }
            y += 6
          })
        } else {
          // Custom section
          drawSectionTitle(section.title)
          section.items.forEach((item) => {
            drawItemHeader(item.title, item.subtitle, item.location, item.dates)
            if (item.details?.length) {
              drawBullets(item.details)
            }
            y += 6
          })
        }
      } else {
        // Legacy custom section structure
        drawSectionTitle(section.title)
        section.items.forEach((item) => {
          drawItemHeader(item.title, item.subtitle, item.location, item.dates)
          if (item.details?.length) {
            drawBullets(item.details)
          }
          y += 6
        })
      }
    })
  }

  // ── Legacy / Fallback flat rendering ──────────────────────────────────────
  if (resume.education?.length) {
    drawSectionTitle('EDUCATION')
    resume.education.forEach((item) => {
      const title = `${item.degree || ''}${item.school ? ` - ${item.school}` : ''}`.trim()
      drawItemHeader(title, item.subtitle, item.location, item.dates)
      if (item.bullets?.length) {
        drawBullets(item.bullets)
      }
      y += 6
    })
  }

  if (resume.languages?.length) {
    drawSectionTitle('LANGUAGES')
    checkPageBreak(12)
    doc.setFont('Calibri', 'normal')
    doc.setFontSize(10)
    doc.text(resume.languages.join(' | '), leftX, y)
  }

  return doc
}

export async function buildResumePdf(resume = defaultResume) {
  const doc = await generateResumePdfDoc(resume)
  doc.save('Resume-Forge-Sample.pdf')
}
