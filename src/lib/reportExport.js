const sanitizeFileName = (value = 'relatorio') =>
  String(value || 'relatorio')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase() || 'relatorio'

const truncateSheetName = (value, fallback = 'Dados') => {
  const normalized = String(value || fallback).trim() || fallback
  return normalized.slice(0, 31)
}

const normalizeCellValue = (value) => {
  if (value === null || value === undefined) return ''
  if (value instanceof Date) return value.toLocaleDateString('pt-BR')
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value)
    } catch {
      return String(value)
    }
  }
  return value
}

const resolveColumnValue = (row, column) => {
  if (typeof column?.value === 'function') {
    return normalizeCellValue(column.value(row))
  }

  if (column?.key) {
    return normalizeCellValue(row?.[column.key])
  }

  return ''
}

const normalizeSections = ({ sections = [], columns = [], rows = [] }) => {
  if (Array.isArray(sections) && sections.length > 0) {
    return sections
      .map((section) => ({
        title: String(section?.title || 'Dados').trim() || 'Dados',
        columns: Array.isArray(section?.columns) ? section.columns : [],
        rows: Array.isArray(section?.rows) ? section.rows : [],
      }))
      .filter((section) => section.columns.length > 0)
  }

  if (Array.isArray(columns) && columns.length > 0) {
    return [{ title: 'Dados', columns, rows: Array.isArray(rows) ? rows : [] }]
  }

  return []
}

const normalizeSummary = (summary = []) =>
  Array.isArray(summary)
    ? summary
        .map((item) => ({
          label: String(item?.label || '').trim(),
          value: normalizeCellValue(item?.value),
        }))
        .filter((item) => item.label !== '')
    : []

export const buildPeriodLabel = (from, to) => {
  if (!from && !to) return ''
  if (from && to && from === to) return `Data: ${from}`
  if (from && to) return `Período: ${from} até ${to}`
  return `Período: ${from || to}`
}

export const exportReportToExcel = async ({
  fileName,
  title,
  periodLabel,
  summary = [],
  sections = [],
  columns = [],
  rows = [],
}) => {
  const { utils, writeFile } = await import('xlsx')

  const safeFileName = sanitizeFileName(fileName)
  const normalizedSections = normalizeSections({ sections, columns, rows })
  const summaryItems = normalizeSummary(summary)

  if (!normalizedSections.length) {
    throw new Error('Nenhum dado disponível para exportação.')
  }

  const workbook = utils.book_new()

  if (normalizedSections.length > 1) {
    const metaRows = []

    if (title) metaRows.push([String(title)])
    if (periodLabel) metaRows.push([String(periodLabel)])
    summaryItems.forEach((item) => {
      metaRows.push([`${item.label}: ${item.value}`])
    })

    if (metaRows.length > 0) metaRows.push([])

    metaRows.push(['Seção', 'Registros'])
    normalizedSections.forEach((section) => {
      metaRows.push([section.title, section.rows.length])
    })

    const metaSheet = utils.aoa_to_sheet(metaRows)
    metaSheet['!cols'] = [{ wch: 44 }, { wch: 18 }]
    utils.book_append_sheet(workbook, metaSheet, truncateSheetName('Resumo'))
  }

  normalizedSections.forEach((section, index) => {
    const sectionRows = []

    if (normalizedSections.length === 1) {
      if (title) sectionRows.push([String(title)])
      if (periodLabel) sectionRows.push([String(periodLabel)])
      summaryItems.forEach((item) => {
        sectionRows.push([`${item.label}: ${item.value}`])
      })
      if (sectionRows.length > 0) sectionRows.push([])
    }

    sectionRows.push(section.columns.map((column) => String(column.label || column.key || 'Campo')))

    if (!section.rows.length) {
      sectionRows.push(['Sem dados no período.'])
    } else {
      section.rows.forEach((row) => {
        sectionRows.push(section.columns.map((column) => resolveColumnValue(row, column)))
      })
    }

    const worksheet = utils.aoa_to_sheet(sectionRows)
    worksheet['!cols'] = section.columns.map((column) => ({ wch: Number(column.width || 22) }))

    const sheetTitle =
      normalizedSections.length === 1
        ? truncateSheetName(section.title || 'Dados')
        : truncateSheetName(`${index + 1}-${section.title}`)

    utils.book_append_sheet(workbook, worksheet, sheetTitle)
  })

  writeFile(workbook, `${safeFileName}.xlsx`)
}

export const exportReportToPdf = async ({
  fileName,
  title,
  periodLabel,
  summary = [],
  sections = [],
  columns = [],
  rows = [],
}) => {
  const [{ default: JsPdf }, autoTableModule] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ])

  const autoTable = autoTableModule.default || autoTableModule
  const safeFileName = sanitizeFileName(fileName)
  const normalizedSections = normalizeSections({ sections, columns, rows })
  const summaryItems = normalizeSummary(summary)

  if (!normalizedSections.length) {
    throw new Error('Nenhum dado disponível para exportação.')
  }

  const hasManyColumns = normalizedSections.some((section) => section.columns.length > 6)
  const doc = new JsPdf({
    orientation: hasManyColumns ? 'landscape' : 'portrait',
    unit: 'pt',
    format: 'a4',
  })

  const pageHeight = doc.internal.pageSize.getHeight()
  let cursorY = 42

  if (title) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text(String(title), 40, cursorY)
    cursorY += 20
  }

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)

  if (periodLabel) {
    doc.text(String(periodLabel), 40, cursorY)
    cursorY += 14
  }

  summaryItems.forEach((item) => {
    doc.text(`${item.label}: ${item.value}`, 40, cursorY)
    cursorY += 14
  })

  if (periodLabel || summaryItems.length) {
    cursorY += 6
  }

  normalizedSections.forEach((section, index) => {
    if (cursorY > pageHeight - 120) {
      doc.addPage()
      cursorY = 42
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text(section.title || `Seção ${index + 1}`, 40, cursorY)
    cursorY += 8

    const bodyRows = section.rows.length
      ? section.rows.map((row) => section.columns.map((column) => resolveColumnValue(row, column)))
      : [[...section.columns.map((_, columnIndex) => (columnIndex === 0 ? 'Sem dados no período.' : ''))]]

    autoTable(doc, {
      startY: cursorY + 8,
      head: [section.columns.map((column) => String(column.label || column.key || 'Campo'))],
      body: bodyRows,
      theme: 'striped',
      margin: { left: 40, right: 40 },
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [44, 69, 82] },
    })

    cursorY = (doc.lastAutoTable?.finalY || cursorY + 40) + 16
  })

  doc.save(`${safeFileName}.pdf`)
}
