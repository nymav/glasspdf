import { createWorker } from 'tesseract.js'
let engine
self.onmessage = async ({ data }) => {
  try {
    if (data.type === 'init') {
      engine = await createWorker('eng', 1, {
        workerPath: `${data.base}worker.min.js`, corePath: data.base, langPath: data.base,
        workerBlobURL: false, cacheMethod: 'none', gzip: true,
        logger: event => self.postMessage({ progress: { phase: event.status === 'recognizing text' ? 'Reading text' : 'Preparing OCR', fraction: event.progress || 0 } }),
        errorHandler: () => {},
      })
      await engine.setParameters({ tessedit_pageseg_mode: '3', preserve_interword_spaces: '1', user_defined_dpi: '300' })
      self.postMessage({ ready: true })
    } else if (data.type === 'recognize') {
      const { data: output } = await engine.recognize(data.bytes)
      self.postMessage({ result: { text: output.text.trim(), confidence: Math.round(output.confidence || 0) } })
    }
  } catch { self.postMessage({ error: 'OCR processing failed.' }) }
}
