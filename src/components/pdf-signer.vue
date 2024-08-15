<template>
  <div id="pdf-container">
    <div
      id="pdf-wrapper"
      :style="{margin: 'auto'}"
      :data-width="width"
      :data-height="height"
      tabindex="1"
      @keydown="onCanvasKeydown($event)"
    >
      <pdf-toolbar
        v-if="controller"
        @click-zoomin="zoomIn()"
        @click-zoomout="zoomOut()"
        @click-sign="addSignatureDialog = true"
        @click-export="exportData()"
        @click-draw="toggleDrawingMode()"
        @click-insert-image="insertImageDialog = true"
        @click-textbox="insertTextBox()"
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
import { debounce } from 'lodash'
import { fabric } from 'fabric'
import SignatureDialog from './pdf-signature-dialog.vue'
import { PDFCanvasController, setupCanvas } from '@/lib/pdf-canvas'
import { openURL, downloadURL, getFileExtension, wait } from '@/utils'
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
      required: false
    },
    imageUrl: {
      type: String,
      required: false
    },
    src: {
      type: String,
      required: false
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
          color: 'rgba(0,0,0,1)'
        },
        enable: false
      },
      width: 0,
      height: 0
    }
  },

  computed: {
    canvasSrc (): string {
      return this.imageUrl || this.pdfUrl || this.src
    },

    srcType (): 'pdf'|'image' {
      if (this.pdfUrl) {
        return 'pdf'
      }

      if (this.imageUrl) {
        return 'image'
      }

      const fileExt = getFileExtension(this.canvasSrc)

      if (fileExt === 'pdf') {
        return 'pdf'
      } else if (['jpg', 'jpeg', 'png'].includes(fileExt)) {
        return 'image'
      } else {
        throw new Error('Invalid file type')
      }
    }
  },

  mounted () {
    (async () => {
      this.resizeWrapper()
      await wait(200)
      this.controller = await setupCanvas('canvas', this.canvasSrc, this.srcType)
      // drawRulers(this.controller.canvas)
      this.$emit('ready')
    })()

    this.resizeHandler = debounce(async () => {
      if (!this.controller) {
        throw new Error('`this.controller` is not initialized')
      }
      this.resizeWrapper()
      await wait(200)
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
    async exportData () {
      if (this.srcType === 'pdf') {
        this.exportPDF()
      }
      if (this.srcType === 'image') {
        this.exportPNG()
      }
    },
    async exportPNG () {
      if (!this.controller) {
        throw new Error('`this.controller` is not initialized')
      }

      const imgBlob = await this.controller.exportPNG()
      const url = window.URL.createObjectURL(imgBlob)
      // openURL(url)
      downloadURL(url)
    },
    async exportPDF () {
      if (!this.controller) {
        throw new Error('`this.controller` is not initialized')
      }

      const pdfBytes = await this.controller.exportPDF()
      const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(pdfBlob)
      openURL(url)
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
      this.updateDrawingPen({ size: 3, color: 'rgba(0,0,255,1)' })
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

    updateDrawingTool (tool: 'pen'|'highlighter'|'eraser') {
      this.drawing.tool = tool

      if (['pen', 'highlighter'].includes(tool)) {
        this.controller?.setDrawingTool('pen')
      } else {
        this.controller?.setDrawingTool('eraser')
      }
    },

    insertImage (evt: any) {
      if (!this.controller) {
        throw new Error('controller is not initialized')
      }
      this.controller.insertImage(evt.file, evt.opacity, evt.insertToAllPages)
    },

    insertTextBox () {
      if (!this.controller) {
        throw new Error('controller is not initialized')
      }
      this.controller.insertTextBox()
    },

    onCanvasKeydown (e: KeyboardEvent) {
      if (e.key === 'Backspace' || e.key === 'Delete') {
        if (!this.controller?.canvas) return

        const canvas = this.controller.canvas
        const activeObject = canvas?.getActiveObject()
        canvas.remove(activeObject)
      }
    },

    resizeWrapper () {
      const container = document.getElementById('pdf-container')
      this.width = container?.offsetWidth || 0
      this.height = (container?.offsetHeight || 50) - 50
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
