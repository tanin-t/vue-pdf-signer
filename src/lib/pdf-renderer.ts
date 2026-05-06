import { FabricObject } from '@/types/fabric'
import { fabric } from 'fabric'
import _ from 'lodash'
import { PDFDocument, PDFImage, degrees } from 'pdf-lib'
import { PDFDocumentProxy, PDFPageProxy } from '..'

interface PageAnnotations {
  page: fabric.Object
  signatures: fabric.Object[]
  images: fabric.Object[]
  textboxes: fabric.Object[]
}

export class PDFController {
  private static renderPDFPageToCanvas (page: PDFPageProxy): Promise<HTMLCanvasElement> {
    return new Promise((resolve) => {
      // Retina scaling
      const viewport = page.getViewport({ scale: window.devicePixelRatio * 1.5 })

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
      const fabricPage = annotationGroup[i].page as fabric.Image
      const pageSignatures = annotationGroup[i].signatures
      const pageImages = annotationGroup[i].images
      const pageTextBoxes = annotationGroup[i].textboxes

      // Check the PDF page's rotation metadata
      const pageRotation = ((pdfPage.getRotation().angle % 360) + 360) % 360
      const { width: pdfWidth, height: pdfHeight } = pdfPage.getSize()
      const pageLeft = fabricPage.left
      const pageTop = fabricPage.top

      if (pageLeft === undefined || pageTop === undefined) {
        throw new Error('fabricPage has not top/left')
      }

      const isQuarterTurn = pageRotation === 90 || pageRotation === 270
      const scale = isQuarterTurn
        ? pdfHeight / fabricPage.getScaledWidth()
        : pdfWidth / fabricPage.getScaledWidth()
      const displayHeight = isQuarterTurn ? pdfWidth : pdfHeight

      const getDrawOptions = (obj: fabric.Object) => {
        if (obj.left === undefined || obj.top === undefined) {
          throw new Error('obj has not top/left')
        }

        const xFromLeft = (obj.left - pageLeft) * scale
        const yFromTop = (obj.top - pageTop) * scale
        const width = obj.getScaledWidth() * scale
        const height = obj.getScaledHeight() * scale

        const coordsFromBottomLeft = {
          x: xFromLeft,
          y: displayHeight - (yFromTop + height)
        }

        let x = coordsFromBottomLeft.x
        let y = coordsFromBottomLeft.y

        switch (pageRotation) {
          case 90:
            x = pdfWidth - coordsFromBottomLeft.y
            y = coordsFromBottomLeft.x
            break
          case 180:
            x = pdfWidth - coordsFromBottomLeft.x
            y = pdfHeight - coordsFromBottomLeft.y
            break
          case 270:
            x = coordsFromBottomLeft.y
            y = pdfHeight - coordsFromBottomLeft.x
            break
          default:
            break
        }

        return { x, y, width, height }
      }

      for (const sig of pageSignatures) {
        const pdfImage = await this.getPDFImage(pdfDoc, sig.toDataURL({
          format: 'png',
          enableRetinaScaling: false,
          multiplier: 1
        }))
        const { x, y, width, height } = getDrawOptions(sig)
        const drawOptions: { x: number, y: number, width: number, height: number, rotate?: ReturnType<typeof degrees> } = {
          x,
          y,
          width,
          height
        }
        if (pageRotation !== 0) {
          drawOptions.rotate = degrees(pageRotation)
        }

        pdfPage.drawImage(pdfImage, drawOptions)
      }

      for (const img of pageImages) {
        const pdfImage = await this.getPDFImage(pdfDoc, img.toDataURL({
          format: 'png',
          enableRetinaScaling: false,
          multiplier: 1
        }))
        const { x, y, width, height } = getDrawOptions(img)
        const drawOptions: { x: number, y: number, width: number, height: number, rotate?: ReturnType<typeof degrees> } = {
          x,
          y,
          width,
          height
        }
        if (pageRotation !== 0) {
          drawOptions.rotate = degrees(pageRotation)
        }

        pdfPage.drawImage(pdfImage, drawOptions)
      }

      for (const textbox of pageTextBoxes) {
        const pdfImage = await this.getPDFImage(pdfDoc, textbox.toDataURL({
          format: 'png',
          enableRetinaScaling: false,
          multiplier: 1
        }))
        const { x, y, width, height } = getDrawOptions(textbox)
        const drawOptions: { x: number, y: number, width: number, height: number, rotate?: ReturnType<typeof degrees> } = {
          x,
          y,
          width,
          height
        }
        if (pageRotation !== 0) {
          drawOptions.rotate = degrees(pageRotation)
        }

        pdfPage.drawImage(pdfImage, drawOptions)
      }
    }

    return pdfDoc
  }

  static isPartiallyContain (pageObj: fabric.Object, annotateObj: fabric.Object): boolean {
    if (!annotateObj.aCoords) {
      throw new Error('`anntotateObj` does not have aCoords')
    }

    return Object.values(annotateObj.aCoords).some(point => {
      return pageObj.containsPoint(point, undefined, true)
    })
  }

  static getAnnotationsGroupByPage (canvas: fabric.Canvas): PageAnnotations[] {
    const objs = canvas.getObjects() as FabricObject[]
    const pages = objs.filter(x => _.get(x, 'attrs.type') === 'pdf-page')
    const signatures = objs.filter(x => _.get(x, 'attrs.type') === 'signature')
    const images = objs.filter(x => _.get(x, 'attrs.type') === 'image')
    const textboxes = objs.filter(x => _.get(x, 'attrs.type') === 'textbox')

    const results = []
    for (const i in pages) {
      const page = pages[i]

      results.push({
        page_num: i,
        page: page,
        signatures: signatures.filter(x => this.isPartiallyContain(page, x)),
        images: images.filter(x => this.isPartiallyContain(page, x)),
        textboxes: textboxes.filter(x => this.isPartiallyContain(page, x))
      })
    }

    return results
  }
}
