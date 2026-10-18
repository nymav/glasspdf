export const FREE_PLAN = { exportsPerDay: 5, maxFileBytes: 25 * 1024 * 1024 }
const KEY = 'glasspdf-free-usage-v1'
export const dayKey = (date = new Date()) => `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
export function readUsage(storage, date = new Date()) {
  try {
    const saved = JSON.parse(storage.getItem(KEY))
    if (saved?.day === dayKey(date) && Number.isInteger(saved.exports) && saved.exports >= 0) return saved
  } catch { /* Corrupt or unavailable storage starts a fresh local allowance. */ }
  return { day: dayKey(date), exports: 0 }
}
export function recordExport(storage, date = new Date()) {
  const usage = readUsage(storage, date)
  const next = { ...usage, exports: usage.exports + 1 }
  storage.setItem(KEY, JSON.stringify(next))
  return next
}
export const remainingExports = usage => Math.max(0, FREE_PLAN.exportsPerDay - usage.exports)
