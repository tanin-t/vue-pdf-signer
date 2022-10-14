import { FabricObject } from '@/types/fabric'
import { fabric } from 'fabric'
import { PDFCanvasController } from '.'
import { renderPDF } from './common'
import _, { wrap } from 'lodash'
import { PDFController } from '../pdf-renderer'

interface TouchPoint {
  x: number
  y: number
}
export class MobileCanvasController implements PDFCanvasController {
  canvas: fabric.Canvas
  pdfUrl?: string

  dragging = {
    isDragging: false,
    lastPosX: 0,
    lastPosY: 0
  }

  pinching = {
    isPinching: false,
    lastDistance: 0
  }

  boundary = {
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zoomIn: 2,
    zoomOut: 0.1
  }

  currentPage = 1
  totalPages = 1

  drawing = {
    isDrawing: false,
    tool: 'pen'
  }

  constructor (canvasId: string) {
    this.canvas = new fabric.Canvas(canvasId)
  }

  async setup (pdfUrl: string) {
    const pages = await this.drawPDFPages(pdfUrl)
    this.setupCanvasDimensions(pages)
    this.setupPanAndZoomBoundary(pages)
    this.setupPanAndZoomEventHandler()
    this.setupDrawingEventHandler()

    this.totalPages = pages.length

    // Zoom out - fit width
    this.canvas.setZoom(this.boundary.zoomOut)

    // Center page with viewport
    for (const page of pages) {
      this.canvas.viewportCenterObjectH(page)
    }
    // this.canvas.viewportCenterObject(pages[0])
  }

  setupPanAndZoomEventHandler () {
    if (!this.canvas) {
      throw new Error('`this.canvas` is not initialized')
    }

    this.canvas.on('mouse:move:before', (opt) => {
      // console.log('mouse:move:before', e)
      // if (!opt.pointer) {
      //   throw new Error('`opt` is not TouchEvent')
      // }

      const evt = opt.e as never as TouchEvent
      if (evt.touches.length === 2) {
        const p1 = { x: evt.touches[0].clientX, y: evt.touches[0].clientY }
        const p2 = { x: evt.touches[1].clientX, y: evt.touches[1].clientY }
        this.pinchZoom(p1, p2)
      }
    })

    this.canvas.on('mouse:down', (opt) => {
      if (this.canvas.getActiveObject()) {
        return
      }
      if (!opt.pointer) {
        throw new Error('`opt` is not TouchEvent')
      }

      const evt = opt.e as never as TouchEvent
      if (evt.touches.length === 1) {
        this.canvas.selection = false
        this.dragging.isDragging = true
        this.dragging.lastPosX = opt.pointer.x
        this.dragging.lastPosY = opt.pointer.y
      }

      if (evt.touches.length === 2) {
        this.canvas.selection = false
      }
    })

    this.canvas.on('mouse:move', (opt) => {
      if (!opt.pointer) {
        throw new Error('`opt` is not TouchEvent')
      }
      if (this.drawing.isDrawing) {
        return
      }

      const evt = opt.e as never as TouchEvent

      if (evt.touches.length === 1) {
        if (!this.dragging.isDragging) {
          return
        }
        this.dragPan(opt.pointer)
      }
    })

    this.canvas.on('mouse:up', () => {
      if (!this.canvas) {
        throw new Error('`this.canvas` is not initialized')
      }

      // on mouse up we want to recalculate new interaction
      // for all objects, so we call setViewportTransform
      if (this.dragging.isDragging && this.canvas.viewportTransform) {
        this.canvas.setViewportTransform(this.canvas.viewportTransform)
        this.dragging.isDragging = false
      }

      this.pinching.lastDistance = 0
    })
  }

  dragPan (p: TouchPoint) {
    const { x, y } = p
    const vpt = this.canvas.viewportTransform
    if (vpt) {
      vpt[4] = vpt[4] + (x - this.dragging.lastPosX)
      vpt[5] = vpt[5] + (y - this.dragging.lastPosY)
    }

    const reach = this.moveViewportIntoBoundary()
    this.canvas.requestRenderAll()
    this.updateCurrentPage()
    this.dragging.lastPosX = x
    this.dragging.lastPosY = y

    if (reach.bottom) {
      window.scrollBy(0, 20)
    }

    if (reach.top) {
      window.scrollBy(0, -20)
    }
  }

  pinchZoom (p1: TouchPoint, p2: TouchPoint) {
    const distance = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2)

    if (distance && this.pinching.lastDistance) {
      const delta = distance - this.pinching.lastDistance
      let zoom = this.canvas.getZoom()
      zoom *= 0.999 ** (-4 * delta)
      if (zoom > this.boundary.zoomIn) {
        zoom = this.boundary.zoomIn
      }
      if (zoom < this.boundary.zoomOut) {
        zoom = this.boundary.zoomOut
      }

      this.canvas.zoomToPoint(new fabric.Point((p1.x + p2.x) / 2, (p1.y + p2.y) / 2), zoom)
    }

    this.pinching.lastDistance = distance
  }

  setupCanvasDimensions (pages?: fabric.Object[]) {
    const wrapper = this.canvas.getElement().parentElement?.parentElement
    if (!wrapper) {
      throw new Error("Can't find canvas wrapper")
    }
    const width = Number(wrapper.getAttribute('data-width')) || wrapper.offsetWidth
    this.canvas.setWidth(width - 2)

    const userHeight = wrapper.getAttribute('data-height')
    if (userHeight) {
      this.canvas.setHeight(userHeight)
    } else if (pages && pages[0]) {
      const ratio = pages[0].getScaledHeight() / pages[0].getScaledWidth()
      this.canvas.setHeight(wrapper.offsetWidth * ratio)
    } else {
      this.canvas.setHeight(wrapper.offsetWidth * Math.SQRT2)
    }
    this.canvas.setBackgroundColor('#eeeeee', () => { /**/ })
  }

  setupPanAndZoomBoundary (pages: fabric.Object[]) {
    this.boundary.top = 0
    this.boundary.left = 0
    this.boundary.right = pages[0].getScaledWidth()
    this.boundary.bottom = (pages[0].getScaledHeight() * 1.02) * pages.length + 100
    this.boundary.zoomOut = (this.canvas.getWidth() / pages[0].getScaledWidth())
  }

  async drawPDFPages (pdfUrl: string) {
    this.pdfUrl = pdfUrl
    const pages = await renderPDF(pdfUrl)
    for (const page of pages) {
      (page as never as FabricObject).attrs = { type: 'pdf-page' }
      this.canvas.add(page)
    }

    return pages
  }

  setupDrawingEventHandler () {
    if (!this.canvas) {
      throw new Error('`this.canvas` is not initialized')
    }

    // while in drawing mode, if user touche with 2 or more finger, disable drawing mode temporary
    this.canvas.on('mouse:down:before', (opt) => {
      const evt = opt.e as never as TouchEvent

      if (this.drawing.isDrawing && this.drawing.tool === 'pen') {
        if (evt.touches.length === 1) {
          this.canvas.isDrawingMode = true
        }
        if (evt.touches.length > 1) {
          this.canvas.isDrawingMode = false
        }
      }
    })

    this.canvas.on('path:created', (evt: any) => {
      const p = evt.path as never as FabricObject
      p.attrs = { type: 'signature' }
      p.lockMovementX = true
      p.lockMovementY = true
      p.lockRotation = true
      p.lockScalingX = true
      p.lockScalingY = true
      p.on('mouseover', (evt) => {
        // console.log('mouseover', evt)
        const e = evt.e as MouseEvent | TouchEvent

        if (e instanceof MouseEvent) {
          if (e.buttons === 1 && this.drawing.tool === 'eraser') {
            this.canvas.remove(p)
          }
        }

        if (e instanceof TouchEvent) {
          if (e.touches.length === 1 && this.drawing.tool === 'eraser') {
            this.canvas.remove(p)
          }
        }
      })
      p.on('mousedown', (evt) => {
        // console.log('mousedown', evt)
        const e = evt.e as MouseEvent | TouchEvent
        if (e instanceof MouseEvent) {
          if (e.buttons === 1 && this.drawing.tool === 'eraser') {
            this.canvas.remove(p)
          }
        }
        if (e instanceof TouchEvent) {
          if (e.touches.length === 1 && this.drawing.tool === 'eraser') {
            this.canvas.remove(p)
          }
        }
      })
    })
  }

  zoomIn () {
    if (!this.canvas) {
      throw new Error('`this.canvas` is not initialized')
    }

    let zoom = this.canvas.getZoom() + 0.1
    if (zoom > this.boundary.zoomIn) {
      zoom = this.boundary.zoomIn
    }
    this.canvas.setZoom(zoom)
  }

  zoomOut () {
    if (!this.canvas) {
      throw new Error('`this.canvas` is not initialized')
    }

    let zoom = this.canvas.getZoom() - 0.1
    if (zoom < this.boundary.zoomOut) {
      zoom = this.boundary.zoomOut
    }
    this.canvas.setZoom(zoom)

    this.moveViewportIntoBoundary()
  }

  moveViewportIntoBoundary () {
    const vpt = this.canvas.viewportTransform
    const reach = {
      top: false,
      left: false,
      right: false,
      bottom: false
    }
    if (vpt) {
      const zoom = this.canvas.getZoom()
      const tl = { x: -vpt[4] / zoom, y: -vpt[5] / zoom }
      const br = { x: (this.canvas.getWidth() - vpt[4]) / zoom, y: (this.canvas.getHeight() - vpt[5]) / zoom }

      if (tl.x < this.boundary.left) {
        vpt[4] = -this.boundary.left * zoom
      }
      if (br.x > this.boundary.right) {
        vpt[4] = this.canvas.getWidth() - (this.boundary.right * zoom)
      }

      if (tl.y < this.boundary.top) {
        vpt[5] = -this.boundary.top * zoom
        reach.top = true
      }
      if (br.y > this.boundary.bottom) {
        vpt[5] = this.canvas.getHeight() - (this.boundary.bottom * zoom)
        reach.bottom = true
      }
    }

    return reach
  }

  // getViewportTLBR () {
  //   const vpt = this.canvas.viewportTransform
  //   if (!vpt) {
  //     throw new Error('no viewport')
  //   }

  //   const zoom = this.canvas.getZoom()
  //   const tl = { x: -vpt[4] / zoom, y: -vpt[5] / zoom }
  //   const br = { x: (this.canvas.getWidth() - vpt[4]) / zoom, y: (this.canvas.getHeight() - vpt[5]) / zoom }
  //   return { tl, br }
  // }

  addSignature (signature: fabric.Group) {
    if (!this.canvas) {
      throw new Error('`this.canvas` is not initialized')
    }

    const sig = signature as never as FabricObject
    sig.attrs = { type: 'signature' }
    this.canvas.add(sig)
    this.canvas.viewportCenterObject(sig)
  }

  addDrawing (drawing: fabric.Group): void {
    if (!this.canvas) {
      throw new Error('`this.canvas` is not initialized')
    }

    for (const line of drawing.getObjects()) {
      (line as FabricObject).attrs = { type: 'signature' }
      this.canvas.add(line)
    }
  }

  resizeCanvas () {
    const pages = this.canvas.getObjects().filter((x) => _.get(x, 'attrs.type') === 'pdf-page')
    this.setupCanvasDimensions(pages)
    this.setupPanAndZoomBoundary(pages)
    this.canvas.setZoom(this.boundary.zoomOut)
  }

  goToPage (pageNum: number) {
    const page = this.canvas.getObjects().find(x => _.get(x, 'attrs.type') === 'pdf-page')
    const vpt = this.canvas.viewportTransform

    if (page && vpt) {
      const zoom = this.canvas.getZoom()
      vpt[5] = (pageNum - 1) * page.getScaledHeight() * 1.05 * (-1) * zoom
      this.canvas.requestRenderAll()
      this.currentPage = pageNum
    }
  }

  updateCurrentPage () {
    const page = this.canvas.getObjects().find(x => _.get(x, 'attrs.type') === 'pdf-page')
    const vpt = this.canvas.viewportTransform
    const zoom = this.canvas.getZoom()

    if (page && vpt) {
      const pageHeight = page.getScaledHeight() * 1.05 * (-1) * zoom
      const pageNum = Math.floor(vpt[5] / pageHeight) + 1
      this.currentPage = pageNum
    }
  }

  async exportPDF (): Promise<Uint8Array> {
    if (!this.pdfUrl) {
      throw new Error('Missing this.pdfUrl')
    }
    const pdfDoc = await PDFController.getPDFDocument(this.pdfUrl)
    await PDFController.mergeAnnotations(pdfDoc, this.canvas)
    const pdfBytes = await pdfDoc.save()
    return pdfBytes
  }

  setDrawingMode (enable: boolean): void {
    this.canvas.isDrawingMode = enable

    if (enable) {
      this.drawing.isDrawing = true
      this.drawing.tool = 'pen'
    } else {
      this.drawing.isDrawing = false
    }
  }

  setDrawingTool (tool: 'pen' | 'eraser'): void {
    this.drawing.tool = tool

    if (this.drawing.tool === 'pen') {
      this.canvas.isDrawingMode = true
    }
    if (this.drawing.tool === 'eraser') {
      this.canvas.isDrawingMode = false
    }
  }

  insertImage (file: File, opacity = 1, insertToAllPages = false): void {
    if (insertToAllPages) {
      const objs = this.canvas.getObjects() as FabricObject[]
      const pages = objs.filter(x => _.get(x, 'attrs.type') === 'pdf-page')

      for (const page of pages) {
        fabric.Image.fromURL(URL.createObjectURL(file), (img) => {
          if (page.top === undefined || page.height === undefined || img.height === undefined) {
            throw new Error('This should not happened')
          }

          img.scaleToWidth(page.width || 300)
          img.set({
            top: page.top + (page.height / 2) - (img.height / 2),
            left: page.left,
            opacity: opacity
          });

          //
          (img as never as FabricObject).attrs = { type: 'image' }
          this.canvas.add(img)
        })
      }
    } else {
      fabric.Image.fromURL(URL.createObjectURL(file), (img) => {
        img.set({
          left: 100,
          top: 100,
          opacity: opacity
        })
        img.scaleToWidth(300);
        (img as never as FabricObject).attrs = { type: 'image' }
        this.canvas.viewportCenterObject(img)
        this.canvas.add(img)
      })
    }
  }
}
