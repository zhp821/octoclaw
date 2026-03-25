export type Timestamp = string

export function formatTimestamp(date?: Date): Timestamp {
  const d = date ?? new Date()
  const yy = String(d.getFullYear()).slice(-2)
  const MM = String(d.getMonth() + 1).padStart(2, '0')
  const DD = String(d.getDate()).padStart(2, '0')
  const HH = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const SS = String(d.getSeconds()).padStart(2, '0')
  const sss = String(d.getMilliseconds()).padStart(3, '0')
  return `${yy}${MM}${DD}${HH}${mm}${SS}${sss}`
}

export function parseTimestamp(ts: Timestamp): Date {
  const str = ts.padEnd(15, '0')
  const yy = parseInt(str.slice(0, 2), 10)
  const MM = parseInt(str.slice(2, 4), 10)
  const DD = parseInt(str.slice(4, 6), 10)
  const HH = parseInt(str.slice(6, 8), 10)
  const mm = parseInt(str.slice(8, 10), 10)
  const SS = parseInt(str.slice(10, 12), 10)
  const sss = parseInt(str.slice(12, 15), 10)
  const year = yy + (yy >= 50 ? 1900 : 2000)
  return new Date(year, MM - 1, DD, HH, mm, SS, sss)
}

export function formatDisplayTime(ts: Timestamp): string {
  const date = parseTimestamp(ts)
  const now = new Date()
  const isToday = date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  if (isToday) {
    return time
  }
  return `${date.getMonth() + 1}/${date.getDate()} ${time}`
}