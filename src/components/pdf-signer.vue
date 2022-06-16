<template>
  <div>
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
import { PDFCanvasController, setupCanvas } from '@/lib/pdf-canvas'
import { debounce } from 'lodash'
import PdfToolbar from './pdf-toolbar.vue'

interface ResizeHandler {
  (e: UIEvent): void
}

export default Vue.extend({
  name: 'PdfSigner',
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
    }
  }
})
</script>
