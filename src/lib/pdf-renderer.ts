import { FabricObject } from '@/types/fabric'
import { PDFDimensionTransformer } from '@/utils'
import { fabric } from 'fabric'
import _ from 'lodash'
import { PDFDocument, PDFImage } from 'pdf-lib'
import { PDFDocumentProxy, PDFPageProxy } from '..'

interface PageAnnotations {
  page: fabric.Object
  signatures: fabric.Object[]
  images: fabric.Object[]
}

export class PDFController {
  private static renderPDFPageToCanvas (page: PDFPageProxy): Promise<HTMLCanvasElement> {
    return new Promise((resolve) => {
      // Retina scaling
      const viewport = page.getViewport({ scale: window.devicePixelRatio })

      // Prepare canvas using PDF page dimensions
      const pageCanvas = document.createElement('canvas')
      const context = pageCanvas.getContext('2d')
      pageCanvas.height = viewport.height
      pageCanvas.width = viewport.width

      // Render PDF page into canvas context
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      }

      const renderTask = page.render(renderContext)
      return renderTask.promise.then(() => resolve(pageCanvas))
    })
  }

  static renderPDFPagesAsFabricImages (src: string): Promise<fabric.Image[]> {
    return new Promise((resolve) => {
      const loadingTask = window.pdfjsLib.getDocument(src)

      loadingTask.promise.then(async (pdf: PDFDocumentProxy) => {
        // Get all pages
        let pageProxies = []
        for (let i = 1; i < pdf.numPages + 1; i++) {
          pageProxies.push(pdf.getPage(i))
        }
        pageProxies = await Promise.all(pageProxies)

        // Render to canvas
        let pageCanvases = []
        for (const pageProxy of pageProxies) {
          pageCanvases.push(this.renderPDFPageToCanvas(pageProxy))
        }
        pageCanvases = await Promise.all(pageCanvases)

        // Convert to fabric.Image
        const pageFabicImages = pageCanvases.map(x => new fabric.Image(x))
        resolve(pageFabicImages)
      })
    })
  }

  static async getPDFDocument (url: string): Promise<PDFDocument> {
    const data = await fetch(url).then(res => res.arrayBuffer())
    return PDFDocument.load(data)
  }

  static async getPDFImage (pdfDoc: PDFDocument, url: string): Promise<PDFImage> {
    const data = await fetch(url).then(res => res.arrayBuffer())
    return pdfDoc.embedPng(data)
  }

  static async mergeAnnotations (pdfDoc: PDFDocument, canvas: fabric.Canvas): Promise<PDFDocument> {
    const annotationGroup = this.getAnnotationsGroupByPage(canvas)

    for (let i = 0; i < pdfDoc.getPageCount(); i++) {
      const pdfPage = pdfDoc.getPage(i)
      const fabricPage = annotationGroup[i].page
      const pageSignatures = annotationGroup[i].signatures
      const pageImages = annotationGroup[i].images

      const tr = new PDFDimensionTransformer(fabricPage as fabric.Image, pdfPage)
      for (const sig of pageSignatures) {
        const pdfImage = await this.getPDFImage(pdfDoc, sig.toDataURL({}))
        const coords = tr.getPDFCoords(sig)
        pdfPage.drawImage(
          pdfImage,
          {
            x: coords.x,
            y: coords.y - tr.getPDFLength(pdfImage.height),
            width: tr.getPDFLength(pdfImage.width),
            height: tr.getPDFLength(pdfImage.height)
          }
        )
      }

      for (const img of pageImages) {
        const pdfImage = await this.getPDFImage(pdfDoc, img.toDataURL({}))
        const coords = tr.getPDFCoords(img)
        pdfPage.drawImage(
          pdfImage,
          {
            x: coords.x,
            y: coords.y - tr.getPDFLength(pdfImage.height),
            width: tr.getPDFLength(pdfImage.width),
            height: tr.getPDFLength(pdfImage.height)
          }
        )
      }
    }

    return pdfDoc
  }

  static getAnnotationsGroupByPage (canvas: fabric.Canvas): PageAnnotations[] {
    const objs = canvas.getObjects() as FabricObject[]
    const pages = objs.filter(x => _.get(x, 'attrs.type') === 'pdf-page')
    const signatures = objs.filter(x => _.get(x, 'attrs.type') === 'signature')
    const images = objs.filter(x => _.get(x, 'attrs.type') === 'image')

    const results = []
    for (const i in pages) {
      const page = pages[i]

      results.push({
        page_num: i,
        page: page,
        signatures: signatures.filter(s => s.isContainedWithinObject(page, true)),
        images: images
      })
    }

    return results
  }
}
