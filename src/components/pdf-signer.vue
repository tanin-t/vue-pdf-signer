<template>
  <div>
    <div id="pdf-wrapper" :style="{'width': width, 'height': height}" :data-width="width" :data-height="height" tabindex="1" @keydown="onCanvasKeydown($event)">
      <pdf-toolbar
        v-if="controller"
        @click-zoomin="zoomIn()"
        @click-zoomout="zoomOut()"
        @click-sign="addSignatureDialog = true"
        @click-export="exportPDF()"
        @click-draw="toggleDrawingMode()"
        @click-insert-image="insertImageDialog = true"
        :page="controller.currentPage"
        @update:page="changePage($event)"
        :is-drawing="drawing.enable"
        :drawing-pen="drawing.pen"
        @update:drawing-pen="updateDrawingPen($event)"
        :drawing-tool="drawing.tool"
        @update:drawing-tool="updateDrawingTool($event)"
        :total-pages="controller.totalPages"
      />
      <canvas id="canvas" />
    </div>

    <signature-dialog v-model="addSignatureDialog" @submit="insertSignature($event)"/>
    <insert-image-dialog v-model="insertImageDialog" @submit="insertImage($event)" />
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { fabric } from 'fabric'
import SignatureDialog from './pdf-signature-dialog.vue'
import { PDFCanvasController, setupCanvas } from '@/lib/pdf-canvas'
import { debounce } from 'lodash'
import PdfToolbar from './pdf-toolbar.vue'
import InsertImageDialog from './pdf-insert-image-dialog.vue'

interface ResizeHandler {
  (e: UIEvent): void
}

export default Vue.extend({
  name: 'PdfSigner',
  components: { SignatureDialog, PdfToolbar, InsertImageDialog },
  props: {
    pdfUrl: {
      type: String,
      required: true
    },
    width: {
      type: [Number, String],
      default: ''
    },
    height: {
      type: [Number, String],
      default: ''
    }
  },
  data () {
    return {
      addSignatureDialog: false,
      insertImageDialog: false,
      controller: null as PDFCanvasController | null,
      resizeHandler: null as ResizeHandler | null,
      drawing: {
        tool: 'pen',
        pen: {
          size: 1,
          color: 'black'
        },
        enable: false
      }
    }
  },
  mounted () {
    this.controller = setupCanvas('canvas', this.pdfUrl)

    this.resizeHandler = debounce(() => {
      if (!this.controller) {
        throw new Error('`this.controller` is not initialized')
      }
      this.controller.resizeCanvas()
    }, 500)

    window.onresize = (e) => {
      if (this.resizeHandler) {
        this.resizeHandler(e)
      }
    }
  },
  methods: {
    insertSignature (signature: fabric.Group) {
      if (!signature) return
      if (!this.controller) return
      this.controller.addSignature(signature)
    },
    zoomIn () {
      this.controller?.zoomIn()
    },
    zoomOut () {
      this.controller?.zoomOut()
    },
    async exportPDF () {
      if (!this.controller) {
        throw new Error('`this.controller` is not initialized')
      }

      const pdfBytes = await this.controller.exportPDF()
      const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' })

      const url = window.URL.createObjectURL(pdfBlob)
      const newtab = window.open(url, '_blank')
      if (!newtab || newtab.closed) {
        window.location.href = url
      }
    },

    changePage (pageNum: string) {
      if (!this.controller) {
        return
      }

      if (pageNum === '') {
        return
      }

      let n = Number(pageNum)

      if (n > this.controller.totalPages) {
        n = this.controller.totalPages
      }

      if (n <= 0) {
        n = 1
      }

      this.controller.goToPage(n)
    },

    toggleDrawingMode () {
      if (!this.drawing.enable) {
        this.startDrawing()
      } else {
        this.stopDrawing()
      }
    },

    startDrawing () {
      this.drawing.enable = true
      this.controller?.setDrawingMode(true)
      this.updateDrawingPen({ size: 3, color: 'black' })
      this.updateDrawingTool('pen')
    },

    stopDrawing () {
      this.drawing.enable = false
      this.controller?.setDrawingMode(false)
    },

    updateDrawingPen (pen: { size: number, color: string}) {
      if (!this.controller) {
        throw new Error('controller is not initialized')
      }
      this.drawing.pen = pen
      this.controller.canvas.freeDrawingBrush.width = pen.size
      this.controller.canvas.freeDrawingBrush.color = pen.color
    },

    updateDrawingTool (tool: 'pen'|'eraser') {
      console.log('updateDrawingTool', { tool })
      this.drawing.tool = tool
      this.controller?.setDrawingTool(tool)
    },

    insertImage (evt: any) {
      if (!this.controller) {
        throw new Error('controller is not initialized')
      }
      this.controller.insertImage(evt.file, evt.opacity, evt.insertToAllPages)
    },

    onCanvasKeydown (e: KeyboardEvent) {
      if (e.key === 'Backspace' || e.key === 'Delete') {
        if (!this.controller?.canvas) return

        const canvas = this.controller.canvas
        const activeObject = canvas?.getActiveObject()
        canvas.remove(activeObject)
      }
    }
  }
})
</script>

<style scoped>
#pdf-wrapper:focus {
  /* border-style: none; */
  border: none;
  outline: none;
}
</style>
