import { Buffer } from 'node:buffer'
import test from 'node:test'
import assert from 'node:assert/strict'
import { PDFDocument } from 'pdf-lib'
import { imageToPdf, isSupportedImage } from '../src/lib/imagePdf.js'
test('PNG converts to one readable A4 page', async () => {
 const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aV1cAAAAASUVORK5CYII=', 'base64')
 const file = await imageToPdf(new File([png], 'scan.png'))
 const pdf = await PDFDocument.load(await file.arrayBuffer())
 assert.equal(pdf.getPageCount(), 1)
 assert.equal(file.name, 'scan.pdf')
 assert.equal(pdf.getPage(0).getWidth(), 595.28)
})
test('renamed invalid image fails without producing a PDF', async () => {
 await assert.rejects(imageToPdf(new File(['not an image'], 'bad.jpg')), /valid JPG or PNG/)
})
test('supported image names are explicit', () => {
 assert.equal(isSupportedImage({name:'photo.JPEG'}),true)
 assert.equal(isSupportedImage({name:'photo.heic'}),false)
})
