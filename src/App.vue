<template>
  <div id="app">
    <div class="meta">
      window.innerWidth = {{ window.innerWidth }}<br>
      window.innerHeight = {{ window.innerHeight }}<br>
    </div>

    <pdf-signer :key="src" :src="src" ref="pdf" style="border: 1px solid #d0d0d0" />

    <div>External Control</div>
    <button @click="exportPDF()">Export PDF</button>
    <button @click="exportPNG()">Export PNG</button>
    <button @click="togglePdfImage()">Toggle PDF / Image</button>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import PdfSigner from './components/pdf-signer.vue'
import { PDFCanvasController } from './lib/pdf-canvas'
import { downloadURL, openURL } from './utils/window'

export default Vue.extend({
  name: 'App',
  components: {
    PdfSigner
  },
  data () {
    return {
      src: '/example.pdf'
    }
  },
  computed: {
    window () {
      return window
    }
  },
  methods: {
    async exportPDF () {
      const controller = (this.$refs.pdf as any).controller as PDFCanvasController
      const pdfBytes = await controller.exportPDF()
      const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(pdfBlob)
      openURL(url)
    },

    async exportPNG () {
      const controller = (this.$refs.pdf as any).controller as PDFCanvasController
      const imageBlob = await controller.exportPNG()
      const url = URL.createObjectURL(imageBlob)
      downloadURL(url)
    },

    togglePdfImage () {
      if (this.src === '/example.pdf') {
        this.src = '/example.jpg'
      } else {
        this.src = '/example.pdf'
      }
    }
  }
})
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
  max-width: 900px;
  margin: auto;
}
</style>
