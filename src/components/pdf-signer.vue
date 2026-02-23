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
      <div class="canvas-area">
        <canvas id="canvas" />
        <div
          v-if="scrollState.hasScroll"
          class="pdf-scrollbar"
          ref="scrollbarTrack"
          @mousedown="onTrackClick"
          @touchstart.prevent="onTrackClick"
        >
          <div
            class="pdf-scrollbar-thumb"
            :style="{ top: scrollState.thumbTop + 'px', height: scrollState.thumbHeight + 'px' }"
            @mousedown.stop="onThumbDragStart"
            @touchstart.stop.prevent="onThumbDragStart"
          />
        </div>
      </div>
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
      height: 0,
      rafId: null as number | null,
      dragCleanup: null as (() => void) | null,
      scrollState: { thumbTop: 0, thumbHeight: 30, hasScroll: false } as {
        thumbTop: number
        thumbHeight: number
        hasScroll: boolean
      }
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
      this.rafId = requestAnimationFrame(this.syncScrollbar)
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
    },

    syncScrollbar () {
      if (this.controller) {
        const { ratio, thumbRatio, hasScroll } = this.controller.getScrollInfo()
        const canvasH = this.controller.canvas.getHeight()
        const thumbH = Math.max(30, thumbRatio * canvasH)
        const maxThumbTop = Math.max(0, canvasH - thumbH)
        this.scrollState = {
          thumbTop: ratio * maxThumbTop,
          thumbHeight: thumbH,
          hasScroll
        }
      }
      this.rafId = requestAnimationFrame(this.syncScrollbar)
    },

    onThumbDragStart (e: MouseEvent | TouchEvent) {
      const startClientY = e instanceof TouchEvent ? e.touches[0].clientY : (e as MouseEvent).clientY
      const startThumbTop = this.scrollState.thumbTop

      const onMove = (moveE: Event) => {
        if (!this.controller) return
        const clientY = moveE instanceof TouchEvent
          ? (moveE as TouchEvent).touches[0].clientY
          : (moveE as MouseEvent).clientY
        const delta = clientY - startClientY
        const canvasH = this.controller.canvas.getHeight()
        const thumbH = this.scrollState.thumbHeight
        const maxThumbTop = Math.max(0, canvasH - thumbH)
        const newThumbTop = Math.max(0, Math.min(maxThumbTop, startThumbTop + delta))
        const ratio = maxThumbTop > 0 ? newThumbTop / maxThumbTop : 0
        this.controller.scrollToRatio(ratio)
      }

      const cleanup = () => {
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', cleanup)
        document.removeEventListener('touchmove', onMove)
        document.removeEventListener('touchend', cleanup)
        this.dragCleanup = null
      }

      this.dragCleanup = cleanup
      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', cleanup)
      document.addEventListener('touchmove', onMove, { passive: true })
      document.addEventListener('touchend', cleanup)
    },

    onTrackClick (e: MouseEvent | TouchEvent) {
      if (!this.controller) return
      const track = this.$refs.scrollbarTrack as HTMLElement
      if (!track) return
      const rect = track.getBoundingClientRect()
      const clientY = e instanceof TouchEvent
        ? (e as TouchEvent).touches[0].clientY
        : (e as MouseEvent).clientY
      const clickY = clientY - rect.top
      const canvasH = this.controller.canvas.getHeight()
      const thumbH = this.scrollState.thumbHeight
      const maxThumbTop = Math.max(0, canvasH - thumbH)
      const ratio = maxThumbTop > 0 ? Math.max(0, Math.min(1, (clickY - thumbH / 2) / maxThumbTop)) : 0
      this.controller.scrollToRatio(ratio)
    }
  },

  beforeDestroy () {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId)
    if (this.dragCleanup !== null) this.dragCleanup()
  }

})
</script>

<style scoped>
#pdf-wrapper:focus {
  /* border-style: none; */
  border: none;
  outline: none;
}

.canvas-area {
  position: relative;
}

.pdf-scrollbar {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 10px;
  background: rgba(0, 0, 0, 0.08);
  border-radius: 4px;
  cursor: pointer;
  z-index: 10;
}

.pdf-scrollbar-thumb {
  position: absolute;
  left: 1px;
  width: 8px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  cursor: grab;
  transition: background 0.15s;
  user-select: none;
}

.pdf-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.5);
}

.pdf-scrollbar-thumb:active {
  cursor: grabbing;
  background: rgba(0, 0, 0, 0.65);
}
</style>
