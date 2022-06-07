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
      this.scrollPan(opt.e.deltaX, opt.e.deltaY)
    })
  }

  scrollPan (deltaX: number, deltaY: number) {
    const vpt = this.canvas.viewportTransform
    if (vpt) {
      const zoom = this.canvas.getZoom()
      vpt[4] = vpt[4] - deltaX
      vpt[5] = vpt[5] - deltaY
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
      }
      if (br.y > this.boundary.bottom) {
        vpt[5] = this.canvas.getHeight() - (this.boundary.bottom * zoom)
      }
    }
    this.updateCurrentPage()
    this.canvas.requestRenderAll()
  }
}
