import { getCachedPdfDocument } from './pdfPreviewUtils'

export function createOcrSession() {
  let worker, renderTask, canvas, pending
  let cancelled = false
  const check = () => { if (cancelled) throw new DOMException('Cancelled', 'AbortError') }
  const dispose = () => {
    renderTask?.cancel()
    worker?.terminate()
    worker = null
    if (canvas) { canvas.width = 0; canvas.height = 0; canvas = null }
  }
  const request = (message, transfer = []) => new Promise((resolve, reject) => {
    check(); pending = { resolve, reject }; worker.postMessage(message, transfer)
  })
  return {
    cancel() { cancelled = true; pending?.reject(new DOMException('Cancelled', 'AbortError')); pending = null; dispose() },
    async run(pages, onProgress) {
      try {
        check()
        if (import.meta.env.PROD && import.meta.env.MODE !== 'desktop' && 'serviceWorker' in navigator) {
          let timer
          try {
            await Promise.race([navigator.serviceWorker.ready, new Promise(resolve => { timer = setTimeout(resolve, 15000) })])
          } finally { clearTimeout(timer) }
          check()
        }
        worker = new Worker(new URL('./ocr.worker.js', import.meta.url), { type: 'module' })
        worker.onmessage = ({ data }) => {
          if (cancelled) return
          if (data.progress) { onProgress(data.progress); return }
          const job = pending; pending = null
          if (data.error) job?.reject(new Error(data.error)); else job?.resolve(data.result)
        }
        worker.onerror = () => { pending?.reject(new Error('OCR tools could not load.')); pending = null }
        const base = new URL(`${import.meta.env.BASE_URL}ocr/`, location.href).href
        await request({ type: 'init', base })
        const results = []
        for (let index = 0; index < pages.length; index++) {
          check()
          const source = pages[index]
          onProgress({ index, total: pages.length, phase: 'Preparing page', fraction: 0 })
          const pdf = await getCachedPdfDocument({ fileId: source.fileId, fileUrl: source.fileUrl })
          check()
          const page = await pdf.getPage(source.pageNumber)
          check()
          const rotation = ((page.rotate || 0) + source.rotation) % 360
          const original = page.getViewport({ scale: 1, rotation })
          const scale = Math.min(3, 2400 / Math.max(original.width, original.height))
          const viewport = page.getViewport({ scale, rotation })
          canvas = document.createElement('canvas')
          canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height)
          renderTask = page.render({ canvasContext: canvas.getContext('2d', { alpha: false }), viewport, background: '#fff' })
          await renderTask.promise; renderTask = null; check()
          const image = await new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Page image could not be prepared.')), 'image/png'))
          check()
          const bytes = new Uint8Array(await image.arrayBuffer())
          check()
          canvas.width = 0; canvas.height = 0; canvas = null
          const result = await request({ type: 'recognize', bytes }, [bytes.buffer])
          check()
          results.push({ id: source.id, position: index + 1, pageNumber: source.pageNumber, ...result })
          onProgress({ index: index + 1, total: pages.length, phase: 'Page complete', fraction: 0 })
        }
        return results
      } finally { dispose() }
    },
  }
}
