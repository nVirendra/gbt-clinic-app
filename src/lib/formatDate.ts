export function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return '-'
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
}

export function formatDateOnly(dateStr?: string | null): string {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

export function formatExpiryDisplay(dateStr?: string | null): string {
  if (!dateStr) return '---'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${month}/${year}`
}

export function formatExpiryToISO(str?: string | null): string {
  if (!str) return ''
  const trimmed = str.trim()

  // Format: YYYY-MM
  if (/^\d{4}-\d{2}$/.test(trimmed)) {
    const [yStr, mStr] = trimmed.split('-')
    const y = parseInt(yStr, 10)
    const m = parseInt(mStr, 10)
    const lastDay = new Date(y, m, 0).getDate()
    const mm = String(m).padStart(2, '0')
    const dd = String(lastDay).padStart(2, '0')
    return `${y}-${mm}-${dd}`
  }

  // Format: MM/YY or MM/YYYY or MM-YY or MM-YYYY
  if (/^\d{1,2}[\/\-]\d{2,4}$/.test(trimmed)) {
    const parts = trimmed.split(/[\/\-]/)
    const m = parseInt(parts[0], 10)
    let yStr = parts[1]
    if (yStr.length === 2) yStr = '20' + yStr
    const y = parseInt(yStr, 10)
    if (m >= 1 && m <= 12 && y > 2000 && y < 2100) {
      const lastDay = new Date(y, m, 0).getDate()
      const mm = String(m).padStart(2, '0')
      const dd = String(lastDay).padStart(2, '0')
      return `${y}-${mm}-${dd}`
    }
  }

  // Format: 4 digits MMYY (e.g. 0828)
  if (/^\d{4}$/.test(trimmed)) {
    const m = parseInt(trimmed.substring(0, 2), 10)
    const y = parseInt('20' + trimmed.substring(2, 4), 10)
    if (m >= 1 && m <= 12 && y > 2000 && y < 2100) {
      const lastDay = new Date(y, m, 0).getDate()
      const mm = String(m).padStart(2, '0')
      const dd = String(lastDay).padStart(2, '0')
      return `${y}-${mm}-${dd}`
    }
  }

  const parsed = new Date(trimmed)
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0]
  }

  return trimmed
}
