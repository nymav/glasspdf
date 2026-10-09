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
    if (!file?.bytes) throw new Error('A source PDF is missing. Add it again before exporting.')
    if (!cache.has(file.id)) cache.set(file.id, await PDFDocument.load(file.bytes))
    const [copy] = await output.copyPages(cache.get(file.id), [page.originalPageIndex])
    copy.setRotation(degrees(((copy.getRotation().angle + (page.rotation || 0)) % 360 + 360) % 360))
    output.addPage(copy)
    onProgress({ done: index + 1, total: selectedPages.length, label: 'Copying pages' })
  }
  output.setCreator('GlassPDF'); output.setProducer('GlassPDF')
  onProgress({ done: selectedPages.length, total: selectedPages.length, label: 'Saving PDF' })
  return output.save()
}
