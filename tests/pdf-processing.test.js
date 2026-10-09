import test from 'node:test'
import assert from 'node:assert/strict'
import { PDFDocument } from 'pdf-lib'
import { parsePdfFile, mergePdfPages } from '../src/lib/pdfUtils.js'

test('renamed and corrupt PDFs produce actionable errors', async () => {
  await assert.rejects(parsePdfFile(new File(['hello'], 'renamed.pdf')), /not a PDF/)
  await assert.rejects(parsePdfFile(new File(['%PDF-1.7\nbroken'], 'damaged.pdf')), /damaged or unsupported/)
})

test('export preserves requested order, extraction count and page rotations', async () => {
  const first = await PDFDocument.create(); first.addPage([300, 500]); first.addPage([400, 600])
  const second = await PDFDocument.create(); second.addPage([700, 800])
  const files = [{ id: 'first', bytes: await first.save() }, { id: 'second', bytes: await second.save() }]
  const progress = []
  const bytes = await mergePdfPages({ files, selectedPages: [
    { fileId: 'second', originalPageIndex: 0, rotation: 90 },
    { fileId: 'first', originalPageIndex: 1, rotation: -90 },
  ], onProgress: value => progress.push(value) })
  const output = await PDFDocument.load(bytes)
  assert.equal(output.getPageCount(), 2)
  assert.deepEqual(output.getPages().map(page => page.getWidth()), [700, 400])
  assert.deepEqual(output.getPages().map(page => page.getRotation().angle), [90, 270])
  assert.equal(progress.at(-1).done, 2)
})

test('missing source pages fail instead of silently dropping content', async () => {
  await assert.rejects(mergePdfPages({ files: [], selectedPages: [{ fileId: 'gone', originalPageIndex: 0 }] }), /missing/)
})

test('verification rejects wrong order even when page sizes match', async () => {
  const { verifyPdfOutput } = await import('../src/lib/pdfUtils.js')
  const expected = await PDFDocument.create()
  expected.addPage([300, 500]).drawText('First source page')
  expected.addPage([300, 500]).drawText('Second source page')
  const correct = await expected.save()
  assert.equal(await verifyPdfOutput(correct, expected), 2)
  const changed = await PDFDocument.create()
  const reversed = await changed.copyPages(expected, [1, 0]); reversed.forEach(page => changed.addPage(page))
  await assert.rejects(verifyPdfOutput(await changed.save(), expected), /verification failed/)
  const truncated = await PDFDocument.create(); truncated.addPage()
  await assert.rejects(verifyPdfOutput(await truncated.save(), expected), /page count/)
})

test('source File exports are verified without mutating originals', async () => {
  const original = await PDFDocument.create(); original.addPage().drawText('Original document')
  const originalBytes = await original.save()
  const source = new File([originalBytes], 'sensitive-client.pdf', { type: 'application/pdf' })
  const output = await mergePdfPages({ files: [{ id: 'source', source }], selectedPages: [{ fileId: 'source', originalPageIndex: 0, rotation: 90 }] })
  assert.equal((await PDFDocument.load(output)).getPage(0).getRotation().angle, 90)
  assert.deepEqual(new Uint8Array(await source.arrayBuffer()), originalBytes)
})

test('public processing errors never echo arbitrary parser data', async () => {
  const { publicPdfError } = await import('../src/lib/pdfUtils.js')
  const privateError = new Error('patient-name.pdf contains patient account 123')
  assert.doesNotMatch(publicPdfError(privateError, 'merge'), /patient|123/)
  assert.doesNotMatch(publicPdfError(privateError, 'parse'), /patient|123/)
})
