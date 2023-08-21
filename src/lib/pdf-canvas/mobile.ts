import { FabricObject } from '@/types/fabric'
import { fabric } from 'fabric'
import { PDFCanvasController } from '.'
import { PDF_PAGE_SPACE, renderPDF } from './common'
import _ from 'lodash'
import { PDFController } from '../pdf-renderer'
import { getFileExtension } from '@/utils'
import { ITextboxOptions } from 'fabric/fabric-impl'

interface TouchPoint {
  x: number
  y: number
}
export class MobileCanvasController implements PDFCanvasController {
  canvas: fabric.Canvas
  pdfUrl?: string
  imageUrl?: string

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

  hardBoundary = {
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

  orientation = 'landscape' as 'landscape' | 'portrait'

  pages = [] as fabric.Image[]
  debugLines = [] as fabric.Object[]

  constructor (canvasId: string) {
    this.canvas = new fabric.Canvas(canvasId)
  }

  async setup (src: string, srcType?: 'image'|'pdf') {
    if (!srcType) {
      const fileExt = getFileExtension(src)
      if (fileExt === 'pdf') {
        srcType = 'pdf'
      }

      if (['jpg', 'jpeg', 'png'].includes(fileExt)) {
        srcType = 'image'
      }

      throw new Error(`${fileExt} is not a supported file type`)
    }

    let pages = [] as fabric.Image[]
    if (srcType === 'pdf') {
      pages = await this.setupPDF(src)
    }

    if (srcType === 'image') {
      pages = await this.setupImage(src)
    }

    const totalWidth = pages[0].getScaledWidth()
    const totalHeight = _.sum(pages.map(p => p.getScaledHeight()))
    this.pages = pages
    this.orientation = totalWidth > totalHeight ? 'landscape' : 'portrait'
    this.totalPages = pages.length
    this.centerViewport()
  }

  async setupImage (imageUrl: string) {
    const image = await this.drawImage(imageUrl)
    const pages = [image]
    this.setupCanvasDimensions()
    this.setupZoomOutBoundary(pages)
    this.setupPanBoundary(pages)
    this.setupPanAndZoomEventHandler()
    this.setupDrawingEventHandler()
    return pages
  }

  drawDebugLines () {
    const zoom = this.canvas.getZoom()
    const height = this.canvas.getHeight()
    const width = this.canvas.getWidth()

    const scaledWidth = width * (1 / zoom)
    const scaledHeight = height * (1 / zoom)
    console.log('drawDebugLine', { scaledWidth, scaledHeight })
    const topLine = new fabric.Line([0, 0, scaledWidth, 0], { stroke: 'red', strokeWidth: 10 })
    const leftLine = new fabric.Line([0, 0, 0, scaledHeight], { stroke: 'red', strokeWidth: 10 })
    const rightLine = new fabric.Line([scaledWidth - 10, 0, scaledWidth - 10, scaledHeight - 10], { stroke: 'red', strokeWidth: 10 })
    const bottomLine = new fabric.Line([0, scaledHeight - 10, scaledWidth - 10, scaledHeight - 10], { stroke: 'red', strokeWidth: 10 })
    this.canvas.add(topLine)
    this.canvas.add(leftLine)
    this.canvas.add(rightLine)
    this.canvas.add(bottomLine)
  }

  drawDebugPanBoundary () {
    for (const line of this.debugLines) {
      this.canvas.remove(line)
    }

    const b = this.boundary
    const topLine = new fabric.Line([b.left, b.top, b.right, b.top], { stroke: 'blue', strokeWidth: 10 })
    const leftLine = new fabric.Line([b.left, b.top, b.left, b.bottom], { stroke: 'blue', strokeWidth: 10 })
    const rightLine = new fabric.Line([b.right - 10, b.top, b.right - 10, b.bottom], { stroke: 'blue', strokeWidth: 10 })
    const bottomLine = new fabric.Line([b.left, b.bottom - 10, b.right, b.bottom - 10], { stroke: 'blue', strokeWidth: 10 })
    this.debugLines = [
      topLine,
      leftLine,
      rightLine,
      bottomLine
    ]
    this.canvas.add(topLine)
    this.canvas.add(leftLine)
    this.canvas.add(rightLine)
    this.canvas.add(bottomLine)
  }

  async setupPDF (pdfUrl: string) {
    const pages = await this.drawPDFPages(pdfUrl)
    this.setupCanvasDimensions()
    this.setupZoomOutBoundary(pages)
    this.setupPanBoundary(pages)
    this.setupPanAndZoomEventHandler()
    this.setupDrawingEventHandler()
    return pages
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
    const canvasVtp = [...(this.canvas.viewportTransform || [])]
    canvasVtp[4] = canvasVtp[4] + (x - this.dragging.lastPosX)
    canvasVtp[5] = canvasVtp[5] + (y - this.dragging.lastPosY)
    const { reach, vpt } = this.moveViewportIntoBoundary(canvasVtp)
    this.canvas.setViewportTransform(vpt)
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
      if (zoom > this.hardBoundary.zoomIn) {
        zoom = this.boundary.zoomIn
      }
      if (zoom < this.hardBoundary.zoomOut) {
        zoom = this.boundary.zoomOut
      }

      this.canvas.zoomToPoint(new fabric.Point((p1.x + p2.x) / 2, (p1.y + p2.y) / 2), zoom)
      this.centerViewport()
    }

    this.pinching.lastDistance = distance
  }

  setupCanvasDimensions () {
    const wrapper = this.canvas.getElement().parentElement?.parentElement
    if (!wrapper) {
      throw new Error("Can't find canvas wrapper")
    }

    const width = Number(wrapper.getAttribute('data-width')) || wrapper.offsetWidth
    this.canvas.setWidth(width - 2)
    const height = Number(wrapper.getAttribute('data-height'))
    this.canvas.setHeight(height)

    // Setup background color
    this.canvas.setBackgroundColor('#eeeeee', () => { /**/ })
  }

  setupZoomOutBoundary (pages: fabric.Object[]) {
    const scaleX = this.canvas.getWidth() / pages[0].getScaledWidth()
    const scaleY = this.canvas.getHeight() / pages[0].getScaledHeight()
    const zoom = _.min([scaleX, scaleY]) as number
    this.canvas.setZoom(zoom)

    if (this.pages.length > 1) {
      this.boundary.zoomOut = zoom / 2
    } else {
      this.boundary.zoomOut = zoom
    }
  }

  setupPanBoundary (pages: fabric.Object[]) {
    const pageScaledHeight = pages[0].getScaledHeight()
    const pageScaledWidth = pages[0].getScaledWidth()

    this.boundary.top = 0
    this.boundary.left = 0
    this.boundary.right = pageScaledWidth
    this.boundary.bottom = pageScaledHeight * pages.length + (PDF_PAGE_SPACE * pageScaledHeight * (pages.length - 1))
    this.hardBoundary = { ...this.boundary }
  }

  centerViewport () {
    const page = this.pages[0]
    const zoom = this.canvas.getZoom()

    const canvasScaledWidth = this.canvas.getWidth() * (1 / zoom)
    const canvasScaledHeight = this.canvas.getHeight() * (1 / zoom)
    const pageScaledWidth = page.getScaledWidth()
    const pageScaledHeight = page.getScaledHeight()

    if (canvasScaledWidth > pageScaledWidth) {
      const x = ((canvasScaledWidth - pageScaledWidth) / 2)
      const vpt = this.canvas.viewportTransform
      if (vpt) {
        vpt[4] = x * zoom
        this.canvas.setViewportTransform(vpt)
      }
    }

    if (pageScaledWidth > canvasScaledWidth) {
      const vpt = [...this.canvas.viewportTransform || []]
      this.canvas.setViewportTransform(this.moveViewportIntoBoundary(vpt).vpt)
    }

    const totalPageScaledHeight = pageScaledHeight * this.pages.length
    if (canvasScaledHeight > totalPageScaledHeight) {
      const y = ((canvasScaledHeight - totalPageScaledHeight) / 2)
      const vpt = this.canvas.viewportTransform
      if (vpt) {
        vpt[5] = y * zoom
        this.canvas.setViewportTransform(vpt)
      }
    }

    if (pageScaledHeight > canvasScaledHeight) {
      const vpt = [...this.canvas.viewportTransform || []]
      this.canvas.setViewportTransform(this.moveViewportIntoBoundary(vpt).vpt)
    }
  }

  async drawPDFPages (pdfUrl: string): Promise<fabric.Image[]> {
    this.pdfUrl = pdfUrl
    const pages = await renderPDF(pdfUrl)
    for (const page of pages) {
      (page as never as FabricObject).attrs = { type: 'pdf-page' }
      this.canvas.add(page)
    }

    return pages
  }

  drawImage (imageUrl: string): Promise<fabric.Image> {
    this.imageUrl = imageUrl
    return new Promise((resolve) => {
      fabric.Image.fromURL(imageUrl, (img) => {
        const image = img as never as FabricObject
        image.set('selectable', false)
        image.attrs = { type: 'pdf-page' }
        this.canvas.add(image)
        resolve(img)
      }, {
        crossOrigin: 'anonymous'
      })
    })
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

    let zoom = this.canvas.getZoom() * (6 / 5)
    if (zoom > this.hardBoundary.zoomIn) {
      zoom = this.hardBoundary.zoomIn
    }
    this.canvas.setZoom(zoom)
    this.centerViewport()
  }

  zoomOut () {
    if (!this.canvas) {
      throw new Error('`this.canvas` is not initialized')
    }

    let zoom = this.canvas.getZoom() * (5 / 6)
    if (zoom < this.hardBoundary.zoomOut) {
      zoom = this.hardBoundary.zoomOut
    }
    this.canvas.setZoom(zoom)
    this.centerViewport()
  }

  moveViewportIntoBoundary (vpt: number[]) {
    const reach = {
      top: false,
      left: false,
      right: false,
      bottom: false
    }

    const zoom = this.canvas.getZoom()
    const canvasScaledWidth = this.canvas.getWidth() * (1 / zoom)
    const canvasScaledHeight = this.canvas.getHeight() * (1 / zoom)
    const pageScaledWidth = this.pages[0].getScaledWidth()
    const pageScaledHeight = this.pages[0].getScaledHeight()
    const currentVpt = this.canvas.viewportTransform as number[]
    const tl = { x: -vpt[4] / zoom, y: -vpt[5] / zoom }
    const br = { x: (this.canvas.getWidth() - vpt[4]) / zoom, y: (this.canvas.getHeight() - vpt[5]) / zoom }

    const isPageFillHorizontalSpace = Math.round(canvasScaledWidth) <= Math.round(pageScaledWidth)
    const isPageFillVertialSpace = Math.round(canvasScaledHeight) <= Math.round(pageScaledHeight)
    let lockViewportY = isPageFillHorizontalSpace && canvasScaledHeight > pageScaledHeight * this.pages.length
    let lockViewportX = isPageFillVertialSpace && canvasScaledWidth > pageScaledWidth && !lockViewportY

    if (!isPageFillHorizontalSpace && !isPageFillVertialSpace && this.pages.length > 1) {
      lockViewportX = true
      lockViewportY = false
    }

    if (lockViewportX) {
      vpt[4] = currentVpt[4]
    } else {
      if (tl.x < this.boundary.left) {
        vpt[4] = -this.boundary.left * zoom
        reach.left = true
      } else if (br.x > this.boundary.right) {
        vpt[4] = this.canvas.getWidth() - (this.boundary.right * zoom)
        reach.right = true
      }
    }

    if (lockViewportY) {
      vpt[5] = currentVpt[5]
    } else {
      if (tl.y < this.boundary.top) {
        vpt[5] = -this.boundary.top * zoom
        reach.top = true
      } else if (br.y > this.boundary.bottom) {
        vpt[5] = this.canvas.getHeight() - (this.boundary.bottom * zoom)
        reach.bottom = true
      }
    }

    return {
      vpt: vpt,
      reach: reach
    }
  }

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
    const pages = this.pages
    this.setupCanvasDimensions()
    this.setupZoomOutBoundary(pages)
    this.setupPanBoundary(pages)
    this.centerViewport()
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

  async exportPNG (): Promise<Blob> {
    // reset zoom ratio for exporting
    this.setupZoomOutBoundary(this.pages)

    // resize canvas to fit image
    const img = this.pages[0]
    const zoom = this.canvas.getZoom()
    this.canvas.setWidth(img.getScaledWidth() * zoom)
    this.canvas.setHeight(img.getScaledHeight() * zoom)

    // Move viewport to fit the whole image
    const vpt = [...(this.canvas.viewportTransform || [])]
    vpt[4] = 0
    vpt[5] = 0
    this.canvas.setViewportTransform(vpt)

    // Export data as blob
    const dataURL = this.canvas.toDataURL({ format: 'png' })
    const res = await fetch(dataURL)
    const blob = await res.blob()

    // Reset canvas back to normal
    this.resizeCanvas()

    return blob
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

  setDrawingTool (tool: 'pen' | 'highlighter' | 'eraser'): void {
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

  insertTextBox () {
    const textbox = new fabric.Textbox('Textbox\nEnter you text here!', { width: 400 });
    (textbox as never as FabricObject).attrs = { type: 'textbox' }
    textbox.scaleToWidth(500)
    this.canvas.add(textbox)
    this.canvas.setActiveObject(textbox)
    this.canvas.viewportCenterObject(textbox)
  }

  insertText (text: string, options: ITextboxOptions, isRight: boolean) : void {
    const textbox = new fabric.Text(text,
      {
        ...options,
        selectable: false
      });
    (textbox as never as FabricObject).attrs = { type: 'textbox' }

    let pos = options.left
    if (isRight && options.left && this.canvas.width && textbox.width) pos = this.canvas.width - textbox.width - options.left

    textbox.set({
      left: pos,
      originX: 'right'
    })
    this.canvas.add(textbox)
  }
}
