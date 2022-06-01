<template>
  <div>
    <button @click="dialog = true">Sign</button>
    <button @click="exportPDF()">Export</button>
    <button @click="zoomIn()">Zoom In</button>
    <button @click="zoomOut()">Zoom Out</button>

    <!-- <div id="pdf-wrapper" style="max-height: 90vh; overflow-y: scroll; overflow-x: hidden;"> -->
    <div id="pdf-wrapper">
      <canvas
        style="border: 1px solid blue;"
        id="canvas"
        width="100%"
        height="100%"
      />
    </div>

    <SignatureDialog v-model="dialog" @submit="insertSignature($event)"/>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { fabric } from 'fabric'
import { PDFDocumentProxy, PDFPageProxy } from '..'
import SignatureDialog from './SignatureDialog.vue'
import { PDFDocument } from 'pdf-lib'
import { CoordsTranformer } from '@/utils'
import { isMobile } from '@/utils/device'
import { drawRulers, setupCanvas } from '@/lib/pdf-canvas'
import { MobileCanvasController } from '@/lib/pdf-canvas/mobile'
import { PDFController } from '@/lib/pdf-renderer'

function downloadBlob (blob: Blob, name = 'file.pdf') {
  // Create a link pointing to the ObjectURL containing the blob.
  const data = window.URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = data
  link.download = name

  // this is necessary as link.click() does not work on the latest firefox
  link.dispatchEvent(
    new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window
    })
  )

  setTimeout(() => {
    // For Firefox it is necessary to delay revoking the ObjectURL
    window.URL.revokeObjectURL(data)
    link.remove()
  }, 100)
}
function renderPDFPageToCanvas (page: PDFPageProxy): Promise<HTMLCanvasElement> {
  return new Promise((resolve) => {
    //  retina scaling
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

function loadPDF (src: string): Promise<fabric.Image[]> {
  return new Promise((resolve) => {
    const loadingTask = window.pdfjsLib.getDocument(src)

    loadingTask.promise.then(async (pdf: PDFDocumentProxy) => {
      let pageProxies = []
      for (let i = 1; i < pdf.numPages + 1; i++) {
        pageProxies.push(pdf.getPage(i))
      }
      pageProxies = await Promise.all(pageProxies)

      let pageCanvases = []
      for (const pageProxy of pageProxies) {
        pageCanvases.push(renderPDFPageToCanvas(pageProxy))
      }

      pageCanvases = await Promise.all(pageCanvases)

      const pageFabicImages = pageCanvases.map(x => new fabric.Image(x))
      resolve(pageFabicImages)
    })
  })
}

const deleteIcon = "data:image/svg+xml,%3C%3Fxml version='1.0' encoding='utf-8'%3F%3E%3C!DOCTYPE svg PUBLIC '-//W3C//DTD SVG 1.1//EN' 'http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd'%3E%3Csvg version='1.1' id='Ebene_1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' x='0px' y='0px' width='595.275px' height='595.275px' viewBox='200 215 230 470' xml:space='preserve'%3E%3Ccircle style='fill:%23F44336;' cx='299.76' cy='439.067' r='218.516'/%3E%3Cg%3E%3Crect x='267.162' y='307.978' transform='matrix(0.7071 -0.7071 0.7071 0.7071 -222.6202 340.6915)' style='fill:white;' width='65.545' height='262.18'/%3E%3Crect x='266.988' y='308.153' transform='matrix(0.7071 0.7071 -0.7071 0.7071 398.3889 -83.3116)' style='fill:white;' width='65.544' height='262.179'/%3E%3C/g%3E%3C/svg%3E"
function renderIcon (icon: HTMLElement) {
  return function renderIcon (ctx: any, left: number, top: number, fabricObject: fabric.Object) {
    const size = 24
    ctx.save()
    ctx.translate(left, top)
    ctx.rotate(fabric.util.degreesToRadians(fabricObject.angle || 0))
    ctx.drawImage(icon, -size / 2, -size / 2, size, size)
    ctx.restore()
  }
}

export default Vue.extend({
  components: { SignatureDialog },
  props: {
    pdfUrl: {
      type: String,
      default: '/example.pdf'
    }
  },
  data () {
    return {
      dialog: false,
      controller: null as MobileCanvasController | null,
      canvas: null as fabric.Canvas | null
    }
  },
  mounted () {
    this.controller = setupCanvas('canvas', this.pdfUrl)
    this.canvas = this.controller.canvas

    setTimeout(() => {
      if (this.controller && this.controller.canvas) {
        drawRulers(this.controller.canvas)
      }
    }, 1000)
  },
  methods: {
    insertSignature (signature: fabric.Group) {
      if (!this.controller) return
      if (!this.canvas) return
      this.controller.addSignature(this.canvas, signature)
    },
    async exportPDF () {
      if (!this.canvas) return
      const pdfDoc = await PDFController.getPDFDocument(this.pdfUrl)
      await PDFController.mergeAnnotations(pdfDoc, this.canvas)

      const pdfBytes = await pdfDoc.save()
      const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' })
      console.log(pdfBlob)

      const url = window.URL.createObjectURL(pdfBlob)
      window.open(url, '_blank')
    },
    zoomIn () {
      if (!this.canvas) return
      this.controller?.zoomIn(this.canvas)
    },
    zoomOut () {
      if (!this.canvas) return
      this.controller?.zoomOut(this.canvas)
    }
  }
})
</script>
