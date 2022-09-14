import { isMobile } from '@/utils/device'
import { fabric } from 'fabric'
import { DesktopCanvasController } from './desktop'
import { MobileCanvasController } from './mobile'

export interface PDFCanvasController {
  canvas: fabric.Canvas
  totalPages: number
  currentPage: number

  setup (canvasId: string, pdfUrl: string): void
  zoomIn (): void
  zoomOut (): void
  addSignature (signature: fabric.Group): void
  addDrawing (drawing: fabric.Group): void
  resizeCanvas (): void
  goToPage (pageNum: number): void
  exportPDF (): Promise<Uint8Array>
  setDrawingMode (enable: boolean): void
  setDrawingTool (tool: 'pen'|'eraser'): void
  insertImage (file: File, opacity?: number, insertToAllPages?: boolean): void
}

export function setupCanvas (canvasId: string, pdfUrl: string): PDFCanvasController {
  setupObjectControls()
  if (isMobile()) {
    const controller = new MobileCanvasController(canvasId)
    controller.setup(pdfUrl)
    return controller
  } else {
    const controller = new DesktopCanvasController(canvasId)
    controller.setup(pdfUrl)
    return controller
  }
}

function setupObjectControls () {
  fabric.Object.prototype.controls.deleteControl = new fabric.Control({
    x: 0.5,
    y: -0.5,
    offsetY: -16,
    offsetX: 16,
    cursorStyle: 'pointer',
    mouseUpHandler: (ev, transform) => {
      const target = transform.target
      const canvas = target.canvas
      canvas?.remove(target)
      canvas?.requestRenderAll()
      return true
    },
    render: renderIcon(createDeleteImg())
  })
}

function renderIcon (icon: HTMLImageElement) {
  return function renderIcon (ctx: CanvasRenderingContext2D, left: number, top: number, fabricObject: fabric.Object) {
    const size = 24
    ctx.save()
    ctx.translate(left, top)
    ctx.rotate(fabric.util.degreesToRadians(fabricObject.angle || 0))
    ctx.drawImage(icon, -size / 2, -size / 2, size, size)
    ctx.restore()
  }
}

function createDeleteImg () {
  const img = document.createElement('img')
  img.src = "data:image/svg+xml,%3C%3Fxml version='1.0' encoding='utf-8'%3F%3E%3C!DOCTYPE svg PUBLIC '-//W3C//DTD SVG 1.1//EN' 'http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd'%3E%3Csvg version='1.1' id='Ebene_1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' x='0px' y='0px' width='595.275px' height='595.275px' viewBox='200 215 230 470' xml:space='preserve'%3E%3Ccircle style='fill:%23F44336;' cx='299.76' cy='439.067' r='218.516'/%3E%3Cg%3E%3Crect x='267.162' y='307.978' transform='matrix(0.7071 -0.7071 0.7071 0.7071 -222.6202 340.6915)' style='fill:white;' width='65.545' height='262.18'/%3E%3Crect x='266.988' y='308.153' transform='matrix(0.7071 0.7071 -0.7071 0.7071 398.3889 -83.3116)' style='fill:white;' width='65.544' height='262.179'/%3E%3C/g%3E%3C/svg%3E"
  return img
}

export function drawRulers (
  canvas: fabric.Canvas,
  opt = {
    limit: { top: -4000, left: -4000, bottom: 4000, right: 4000 },
    grid: 100
  }
) {
  // Mark origin point
  canvas.add(new fabric.Text('(0, 0)', { top: 0, left: 0 }))

  // Draw Vertical Line
  for (let x = opt.limit.left; x <= opt.limit.right; x += opt.grid) {
    const line = new fabric.Line(
      [x, opt.limit.top, x, opt.limit.bottom],
      { stroke: '#dddddd', strokeWidth: 2, selectable: false }
    )
    canvas.add(line)
  }

  // Draw Horizontal Line
  for (let y = opt.limit.top; y <= opt.limit.bottom; y += opt.grid) {
    const line = new fabric.Line(
      [opt.limit.left, y, opt.limit.right, y],
      { stroke: '#dddddd', strokeWidth: 2, selectable: false }
    )
    canvas.add(line)
  }
}
