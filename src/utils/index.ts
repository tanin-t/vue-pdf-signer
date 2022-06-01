import { PDFPage } from 'pdf-lib'

interface Coords {
  x: number,
  y: number
}

interface Dimensions {
  width: number,
  height: number
}

export class CoordsTranformer {
  canvasDim: Dimensions
  pdfDim: Dimensions
  alpha: number

  /**
   * @param canvasDim width and height of page in the canvas (not the whole canvas)
   * @param pdfDim width and height of pdf page
   */
  constructor (canvasDim: Dimensions, pdfDim: Dimensions) {
    this.canvasDim = canvasDim
    this.pdfDim = pdfDim

    // Alpha is length factor of pdf and canvas
    this.alpha = this.pdfDim.width / this.canvasDim.width
  }

  translateCoords (point: Coords): Coords {
    return {
      x: this.alpha * point.x,
      y: this.alpha * (this.canvasDim.height - point.y)
    }
  }

  translateLength (l: number): number {
    return l * this.alpha
  }
}

export class PDFDimensionTransformer {
  fabricPage: fabric.Image
  pdfPage: PDFPage
  fabricDim: Dimensions
  pdfDim: Dimensions
  alpha: number

  constructor (fabricPage: fabric.Image, pdfPage: PDFPage) {
    this.fabricPage = fabricPage
    this.pdfPage = pdfPage

    this.pdfDim = { width: pdfPage.getWidth(), height: pdfPage.getHeight() }
    this.fabricDim = { width: fabricPage.getScaledWidth(), height: fabricPage.getScaledHeight() }
    // Alpha is length factor of pdf and canvas
    this.alpha = this.pdfDim.width / this.fabricDim.width
  }

  getPDFCoords (obj: fabric.Object): Coords {
    if (!obj.left || !obj.top || !this.fabricPage.left || !this.fabricPage.top) {
      throw new Error('obj/canvasPage has not top/left')
    }

    const point = {
      x: obj.left - this.fabricPage.left,
      y: obj.top - this.fabricPage.top
    }
    return {
      x: this.alpha * point.x,
      y: this.alpha * (this.fabricDim.height - point.y)
    }
  }

  getPDFLength (l: number): number {
    return l * this.alpha
  }
}
