<template>
  <div style="overflow-y: scroll">
    <!-- <button @click="dialog = true">Sign</button>
    <button @click="exportPDF()">Export</button>
    <button @click="zoomIn()">Zoom In</button>
    <button @click="zoomOut()">Zoom Out</button> -->

    <!-- <div id="pdf-wrapper" style="max-height: 90vh; overflow-y: scroll; overflow-x: hidden;"> -->
    <div id="pdf-wrapper" :style="{'width': width, 'height': height}" :data-width="width" :data-height="height">
      <pdf-toolbar
        v-if="controller"
        @click-zoomin="zoomIn()"
        @click-zoomout="zoomOut()"
        @click-sign="dialog = true"
        @click-export="exportPDF()"
        @update:page="changePage($event)"
        :page="controller.currentPage"
        :total-pages="controller.totalPages"
      />
      <canvas id="canvas" />
    </div>

    <signature-dialog v-model="dialog" @submit="insertSignature($event)"/>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { fabric } from 'fabric'
import SignatureDialog from './signature-dialog.vue'
import { PDFCanvasController, drawRulers, setupCanvas } from '@/lib/pdf-canvas'
import { PDFController } from '@/lib/pdf-renderer'
import { debounce } from 'lodash'
import PdfToolbar from './pdf-toolbar.vue'

interface ResizeHandler {
  (e: UIEvent): void
}

export default Vue.extend({
  components: { SignatureDialog, PdfToolbar },
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
      dialog: false,
      controller: null as PDFCanvasController | null,
      resizeHandler: null as ResizeHandler | null
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

    // setTimeout(() => {
    //   if (this.controller && this.controller.canvas) {
    //     drawRulers(this.controller.canvas)
    //   }
    // }, 1000)
  },
  methods: {
    insertSignature (signature: fabric.Group) {
      console.log('insertSignature', signature)
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

      const pdfDoc = await PDFController.getPDFDocument(this.pdfUrl)
      await PDFController.mergeAnnotations(pdfDoc, this.controller.canvas)

      const pdfBytes = await pdfDoc.save()
      const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' })
      console.log(pdfBlob)

      const url = window.URL.createObjectURL(pdfBlob)
      window.open(url, '_blank')
      console.log(url)
    },

    changePage (pageNum: string) {
      console.log(pageNum)
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
    }
  }
})
</script>
