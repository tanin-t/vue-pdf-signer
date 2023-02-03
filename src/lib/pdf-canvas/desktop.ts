import { MobileCanvasController } from './mobile'

export class DesktopCanvasController extends MobileCanvasController {
  // canvas: fabric.Canvas

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

  setupPanAndZoomEventHandler () {
    if (!this.canvas) {
      throw new Error('`this.canvas` is not initialized')
    }

    this.canvas.on('mouse:down', (opt) => {
      if (this.canvas.getActiveObject()) {
        return
      }
      if (this.canvas.isDrawingMode) {
        return
      }
      if (!opt.pointer) {
        throw new Error('`opt` is not TouchEvent')
      }

      this.canvas.selection = false
      this.dragging.isDragging = true
      this.dragging.lastPosX = opt.pointer.x
      this.dragging.lastPosY = opt.pointer.y
    })

    this.canvas.on('mouse:move', (opt) => {
      if (!opt.pointer) {
        throw new Error('`opt` is not TouchEvent')
      }

      if (!this.dragging.isDragging) {
        return
      }

      if (this.drawing.tool === 'eraser') {
        return
      }

      this.dragPan(opt.pointer)
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

    this.canvas.on('mouse:wheel', (opt) => {
      // console.log('mouse:wheel', opt)
      const hit = this.scrollPan(opt.e.deltaX, opt.e.deltaY)

      if (!hit.bottom && !hit.top) {
        opt.e.preventDefault()
        opt.e.stopPropagation()
      }
    })
  }

  scrollPan (deltaX: number, deltaY: number) {
    const canvasVpt = [...(this.canvas.viewportTransform || [])]
    canvasVpt[4] = canvasVpt[4] - deltaX
    canvasVpt[5] = canvasVpt[5] - deltaY

    const { reach, vpt } = this.moveViewportIntoBoundary(canvasVpt)
    this.canvas.setViewportTransform(vpt)
    this.updateCurrentPage()
    this.canvas.requestRenderAll()

    return reach
  }

  setDrawingMode (enable: boolean): void {
    this.canvas.isDrawingMode = enable
  }
}
