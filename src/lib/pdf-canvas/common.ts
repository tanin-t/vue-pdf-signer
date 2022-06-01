import { PDFController } from '../pdf-renderer'

const PDF_PAGE_SPACE = 0.05 // 5% of page height

export async function renderPDF (src: string) {
  const fabricImages = await PDFController.renderPDFPagesAsFabricImages(src)
  for (let i = 0; i < fabricImages.length; i++) {
    const img = fabricImages[i]
    img.set('top', (img.getScaledHeight() * (1 + PDF_PAGE_SPACE)) * i)
    img.set('selectable', false)
  }
  return fabricImages
}
