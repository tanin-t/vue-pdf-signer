import { FabricObject } from '@/types/fabric'
import { fabric } from 'fabric'
import { renderPDF } from './common'

export class MobileCanvasController {
  canvas = null as fabric.Canvas | null

  dragging = {
    isDragging: false,
    lastPosX: 0,
    lastPosY: 0
  }

  boundary = {
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zoomIn: 2,
    zoomOut: 0.1
  }

  setup (canvasId: string, pdfUrl: string) {
    const canvas = new fabric.Canvas(canvasId)
    this.canvas = canvas
    this.setupPanAndZoom(canvas)
    this.drawPDFPages(canvas, pdfUrl)

    return canvas
  }

  setupPanAndZoom (canvas: fabric.Canvas) {
    canvas.on('mouse:down', (opt) => {
      if (canvas.getActiveObject()) {
        return
      }

      if (!opt.pointer) {
        return
      }
      const { x, y } = opt.pointer

      canvas.selection = false
      this.dragging.isDragging = true
      this.dragging.lastPosX = x
      this.dragging.lastPosY = y
    })

    canvas.on('mouse:move', (opt) => {
      if (!opt.pointer) {
        return
      }
      if (!this.dragging.isDragging) {
        return
      }

      const { x, y } = opt.pointer
      const vpt = canvas.viewportTransform
      if (vpt) {
        const zoom = canvas.getZoom()
        const vpt4 = vpt[4] + (x - this.dragging.lastPosX)
        const vpt5 = vpt[5] + (y - this.dragging.lastPosY)
        const tl = { x: -vpt4 / zoom, y: -vpt5 / zoom }
        const br = { x: (canvas.getWidth() - vpt4) / zoom, y: (canvas.getHeight() - vpt5) / zoom }

        console.log(this.boundary)

        if (tl.x > this.boundary.left && br.x < this.boundary.right) {
          vpt[4] = vpt4
        }
        if (tl.y > this.boundary.top && br.y < this.boundary.bottom) {
          vpt[5] = vpt5
        }
      }
      canvas.requestRenderAll()
      this.dragging.lastPosX = x
      this.dragging.lastPosY = y
    })

    canvas.on('mouse:up', () => {
      // on mouse up we want to recalculate new interaction
      // for all objects, so we call setViewportTransform
      if (canvas.viewportTransform) {
        canvas.setViewportTransform(canvas.viewportTransform)
        canvas.selection = true
        this.dragging.isDragging = false
      }
    })
  }

  async drawPDFPages (canvas: fabric.Canvas, pdfUrl: string) {
    const wrapper = canvas.getElement().parentElement?.parentElement
    console.log(wrapper)
    if (!wrapper) {
      throw new Error("Can't find canvas wrapper")
    }
    canvas.setWidth(wrapper.offsetWidth)
    canvas.setHeight(wrapper.offsetWidth * Math.SQRT2)
    canvas.setBackgroundColor('#eeeeee', console.log)

    const pages = await renderPDF(pdfUrl)
    for (const page of pages) {
      (page as never as FabricObject).attrs = { type: 'pdf-page' }
      canvas.add(page)
    }

    // Setup panning boundary
    this.boundary.top = 0
    this.boundary.left = 0
    this.boundary.right = pages[0].getScaledWidth()
    this.boundary.bottom = (pages[0].getScaledHeight() * 1.02) * pages.length
    this.boundary.zoomOut = (canvas.getWidth() / pages[0].getScaledWidth()) - 0.01

    // Zoom out - fit width
    canvas.setZoom(this.boundary.zoomOut)

    // Center page with viewport
    for (const page of pages) {
      canvas.viewportCenterObjectH(page)
    }
    canvas.viewportCenterObject(pages[0])
  }

  zoomIn (canvas: fabric.Canvas) {
    let zoom = canvas.getZoom() + 0.1
    if (zoom > this.boundary.zoomIn) {
      zoom = this.boundary.zoomIn
    }
    canvas.setZoom(zoom)
  }

  zoomOut (canvas: fabric.Canvas) {
    let zoom = canvas.getZoom() - 0.1
    if (zoom < this.boundary.zoomOut) {
      zoom = this.boundary.zoomOut
    }
    canvas.setZoom(zoom)
  }

  addSignature (canvas: fabric.Canvas, signature: fabric.Group) {
    (signature as never as FabricObject).attrs = { type: 'signature' }

    canvas.add(signature)
    canvas.viewportCenterObject(signature)
  }
}
