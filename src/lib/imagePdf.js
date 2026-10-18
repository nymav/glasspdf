import { PDFDocument } from 'pdf-lib'
export const isSupportedImage = file => /\.(png|jpe?g)$/i.test(file.name)
export async function imageToPdf(file) {
  const bytes = new Uint8Array(await file.arrayBuffer())
  const png = bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71
  const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
  if (!png && !jpeg) throw new Error('Choose a valid JPG or PNG image. Renaming a file does not convert it.')
  const pdf = await PDFDocument.create()
  const image = png ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes)
  const landscape = image.width > image.height
  const [width, height] = landscape ? [841.89, 595.28] : [595.28, 841.89]
  const fit = Math.min((width - 48) / image.width, (height - 48) / image.height)
  const w = image.width * fit, h = image.height * fit
  pdf.addPage([width, height]).drawImage(image, { x: (width - w) / 2, y: (height - h) / 2, width: w, height: h })
  pdf.setCreator('GlassPDF'); pdf.setProducer('GlassPDF')
  return new File([await pdf.save()], file.name.replace(/\.[^.]+$/, '') + '.pdf', { type: 'application/pdf' })
}
