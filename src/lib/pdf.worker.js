import { parsePdfFile, mergePdfPages } from './pdfUtils'
self.onmessage = async ({ data: { type, payload } }) => {
  try {
    const onProgress = progress => self.postMessage({ progress })
    const result = type === 'parse'
      ? await parsePdfFile(payload.file, onProgress)
      : await mergePdfPages({ ...payload, onProgress })
    self.postMessage({ result })
  } catch (error) { self.postMessage({ error: error.message || 'Unable to process this PDF.' }) }
}
