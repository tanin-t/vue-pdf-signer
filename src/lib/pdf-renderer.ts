import { FabricObject } from '@/types/fabric'
import { PDFDimensionTransformer } from '@/utils'
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
      const fabricPage = annotationGroup[i].page
      const pageSignatures = annotationGroup[i].signatures
      const pageImages = annotationGroup[i].images
      const pageTextBoxes = annotationGroup[i].textboxes

      // Check the PDF page's rotation metadata
      const pageRotation = pdfPage.getRotation().angle

      const tr = new PDFDimensionTransformer(fabricPage as fabric.Image, pdfPage)

      for (const sig of pageSignatures) {
        const pdfImage = await this.getPDFImage(pdfDoc, sig.toDataURL({
          format: 'png',
          enableRetinaScaling: false,
          multiplier: 1
        }))
        const coords = tr.getPDFCoords(sig)
        const sigWidth = tr.getPDFLength(sig.getScaledWidth())
        const sigHeight = tr.getPDFLength(sig.getScaledHeight())

        if (pageRotation === 180) {
          // PDF has 180° rotation
          const { width, height } = pdfPage.getSize()

          pdfPage.drawImage(pdfImage, {
            x: width - coords.x,
            y: height - coords.y + sigHeight,
            width: sigWidth,
            height: sigHeight,
            rotate: degrees(180)
          })
        } else if (pageRotation === 90) {
          // PDF has 90° clockwise rotation
          // Best working formula: swap axes
          // Note: Vertical positions are swapped (known limitation)
          pdfPage.drawImage(pdfImage, {
            x: coords.y,
            y: coords.x,
            width: sigWidth,
            height: sigHeight,
            rotate: degrees(90)
          })
        } else if (pageRotation === 270) {
          // PDF has 270° clockwise rotation
          const { width, height } = pdfPage.getSize()

          pdfPage.drawImage(pdfImage, {
            x: width - coords.y,
            y: height - coords.x,
            width: sigWidth,
            height: sigHeight,
            rotate: degrees(270)
          })
        } else {
          // No rotation (0°)
          pdfPage.drawImage(pdfImage, {
            x: coords.x,
            y: coords.y - sigHeight,
            width: sigWidth,
            height: sigHeight
          })
        }
      }

      for (const img of pageImages) {
        const pdfImage = await this.getPDFImage(pdfDoc, img.toDataURL({
          format: 'png',
          enableRetinaScaling: false,
          multiplier: 1
        }))
        const coords = tr.getPDFCoords(img)
        const imgWidth = tr.getPDFLength(img.getScaledWidth())
        const imgHeight = tr.getPDFLength(img.getScaledHeight())

        if (pageRotation === 180) {
          const { width, height } = pdfPage.getSize()

          pdfPage.drawImage(pdfImage, {
            x: width - coords.x,
            y: height - coords.y + imgHeight,
            width: imgWidth,
            height: imgHeight,
            rotate: degrees(180)
          })
        } else if (pageRotation === 90) {
          pdfPage.drawImage(pdfImage, {
            x: coords.y,
            y: coords.x,
            width: imgWidth,
            height: imgHeight,
            rotate: degrees(90)
          })
        } else if (pageRotation === 270) {
          const { width, height } = pdfPage.getSize()

          pdfPage.drawImage(pdfImage, {
            x: width - coords.y,
            y: height - coords.x,
            width: imgWidth,
            height: imgHeight,
            rotate: degrees(270)
          })
        } else {
          pdfPage.drawImage(pdfImage, {
            x: coords.x,
            y: coords.y - imgHeight,
            width: imgWidth,
            height: imgHeight
          })
        }
      }

      for (const textbox of pageTextBoxes) {
        const pdfImage = await this.getPDFImage(pdfDoc, textbox.toDataURL({
          format: 'png',
          enableRetinaScaling: false,
          multiplier: 1
        }))
        const coords = tr.getPDFCoords(textbox)
        const textWidth = tr.getPDFLength(textbox.getScaledWidth())
        const textHeight = tr.getPDFLength(textbox.getScaledHeight())

        if (pageRotation === 180) {
          const { width, height } = pdfPage.getSize()

          pdfPage.drawImage(pdfImage, {
            x: width - coords.x,
            y: height - coords.y + textHeight,
            width: textWidth,
            height: textHeight,
            rotate: degrees(180)
          })
        } else if (pageRotation === 90) {
          pdfPage.drawImage(pdfImage, {
            x: coords.y,
            y: coords.x,
            width: textWidth,
            height: textHeight,
            rotate: degrees(90)
          })
        } else if (pageRotation === 270) {
          const { width, height } = pdfPage.getSize()

          pdfPage.drawImage(pdfImage, {
            x: width - coords.y,
            y: height - coords.x,
            width: textWidth,
            height: textHeight,
            rotate: degrees(270)
          })
        } else {
          pdfPage.drawImage(pdfImage, {
            x: coords.x,
            y: coords.y - textHeight,
            width: textWidth,
            height: textHeight
          })
        }
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
