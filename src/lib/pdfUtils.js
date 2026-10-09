import { PDFDocument, degrees } from 'pdf-lib'
export async function parsePdfFile(file, onProgress = () => {}) {
  onProgress({ done: 0, total: 1, label: 'Reading document' })
  const header = new TextDecoder().decode(await file.slice(0, 1024).arrayBuffer())
  if (!header.includes('%PDF-')) throw new Error('This file is not a PDF. Choose a PDF document, not an image or renamed file.')
  const bytes = new Uint8Array(await file.arrayBuffer())
  let document, pageCount
  try { document = await PDFDocument.load(bytes); pageCount = document.getPageCount() }
  catch (error) {
    if (/encrypt|password/i.test(error.message)) throw new Error('Password-protected PDF. Unlock it in a trusted PDF editor before adding it.', { cause: error })
    throw new Error('This PDF is damaged or unsupported. Re-export it from its original application and try again.', { cause: error })
  }
  if (!pageCount) throw new Error('This PDF has no pages.')
  onProgress({ done: 1, total: 1, label: 'Document read' })
  return { bytes, pageCount }
}
export async function mergePdfPages({ selectedPages, files, onProgress = () => {} }) {
  const output = await PDFDocument.create()
  const cache = new Map(), fileMap = new Map(files.map(file => [file.id, file]))
  for (const [index, page] of selectedPages.entries()) {
    const file = fileMap.get(page.fileId)
    if (!file?.bytes && !file?.source) throw new Error('A source PDF is missing. Add it again before exporting.')
    if (!cache.has(file.id)) cache.set(file.id, await PDFDocument.load(file.bytes || new Uint8Array(await file.source.arrayBuffer())))
    const [copy] = await output.copyPages(cache.get(file.id), [page.originalPageIndex])
    copy.setRotation(degrees(((copy.getRotation().angle + (page.rotation || 0)) % 360 + 360) % 360))
    output.addPage(copy)
    onProgress({ done: index + 1, total: selectedPages.length, label: 'Copying pages' })
  }
  output.setCreator('GlassPDF'); output.setProducer('GlassPDF')
  onProgress({ done: selectedPages.length, total: selectedPages.length, label: 'Saving PDF' })
  const bytes = await output.save()
  onProgress({ done: 0, total: selectedPages.length, label: 'Verifying generated PDF' })
  await verifyPdfOutput(bytes, output, onProgress)
  return bytes
}

// Verification reopens the serialized document and compares each output page with
// its expected position in the builder (dimensions, rotation and content streams).
const streamBytes = (page, document) => {
  const contents = page.node.Contents()
  if (!contents) return []
  const streams = typeof contents.size === 'function'
    ? Array.from({ length: contents.size() }, (_, i) => document.context.lookup(contents.get(i)))
    : [contents]
  return streams.map(stream => stream.getContents())
}
export async function verifyPdfOutput(bytes, expected, onProgress = () => {}) {
  const actual = await PDFDocument.load(bytes)
  if (actual.getPageCount() !== expected.getPageCount()) throw new Error('Output verification failed. The generated page count does not match the review.')
  for (let i = 0; i < expected.getPageCount(); i++) {
    const want = expected.getPage(i), got = actual.getPage(i)
    const wantedStreams = streamBytes(want, expected), gotStreams = streamBytes(got, actual)
    const sameStreams = wantedStreams.length === gotStreams.length && wantedStreams.every((wanted, index) => {
      const got = gotStreams[index]
      return wanted.length === got.length && wanted.every((byte, offset) => byte === got[offset])
    })
    if (want.getWidth() !== got.getWidth() || want.getHeight() !== got.getHeight() || want.getRotation().angle !== got.getRotation().angle || !sameStreams) throw new Error('Output verification failed. The generated page order or content does not match the review.')
    onProgress({ done: i + 1, total: expected.getPageCount(), label: 'Verifying generated PDF' })
  }
  return actual.getPageCount()
}

const PUBLIC_ERRORS = new Set([
  'This file is not a PDF. Choose a PDF document, not an image or renamed file.',
  'Password-protected PDF. Unlock it in a trusted PDF editor before adding it.',
  'This PDF is damaged or unsupported. Re-export it from its original application and try again.',
  'This PDF has no pages.',
  'A source PDF is missing. Add it again before exporting.',
  'Output verification failed. The generated page count does not match the review.',
  'Output verification failed. The generated page order or content does not match the review.',
])
export const publicPdfError = (error, operation) => PUBLIC_ERRORS.has(error?.message)
  ? error.message
  : operation === 'parse' ? 'Unable to read this PDF. Re-export it from its original application and try again.' : 'Unable to create or verify the PDF. Try fewer pages and keep your originals.'
