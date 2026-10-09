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
