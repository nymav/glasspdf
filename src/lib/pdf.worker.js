import { parsePdfFile, mergePdfPages, publicPdfError } from './pdfUtils'
self.onmessage = async ({ data: { type, payload } }) => {
  try {
    const onProgress = progress => self.postMessage({ progress })
    const result = type === 'parse'
      ? { pageCount: (await parsePdfFile(payload.file, onProgress)).pageCount }
      : await mergePdfPages({ ...payload, onProgress })
    self.postMessage({ result }, result instanceof Uint8Array ? [result.buffer] : [])
  } catch (error) { self.postMessage({ error: publicPdfError(error, type) }) }
}
