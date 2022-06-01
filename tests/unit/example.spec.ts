import open from 'open'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

describe('pdf-lib.js', () => {
  it('draw a circle bottom-left of a page', async () => {
    const pdfDoc = await PDFDocument.create()
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman)

    const page = pdfDoc.addPage()
    const { width, height } = page.getSize()
    const pdfDim = { width, height }
    const canvasDim = { width: 1197, height: 1684 }
    const fontSize = 12
    const offset = 20

    // Top left
  })
})
