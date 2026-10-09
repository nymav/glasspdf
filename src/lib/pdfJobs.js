let current = null
export function cancelPdfJob() {
  if (!current) return
  current.worker.terminate()
  current.reject(new DOMException('Processing cancelled', 'AbortError'))
  current = null
}
export function runPdfJob(type, payload, onProgress = () => {}) {
  if (current) return Promise.reject(new Error('Another PDF operation is already running.'))
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./pdf.worker.js', import.meta.url), { type: 'module' })
    const job = { worker, reject }; current = job
    const finish = () => { worker.terminate(); if (current === job) current = null }
    worker.onmessage = ({ data }) => {
      if (data.progress) { onProgress(data.progress); return }
      finish()
      if (data.error) reject(new Error(data.error)); else resolve(data.result)
    }
    worker.onerror = () => { finish(); reject(new Error('PDF processing failed. Try a smaller file or fewer pages.')) }
    worker.postMessage({ type, payload })
  })
}
