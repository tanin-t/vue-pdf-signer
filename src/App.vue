<template>
  <div id="app">
    <div class="meta">
      window.innerWidth = {{ window.innerWidth }}<br>
      window.innerHeight = {{ window.innerHeight }}<br>
    </div>
    <pdf-signer ref="pdf" style="border: 1px solid #d0d0d0" pdfUrl="/example.pdf" />

    <div>External Control</div>
    <button @click="exportPDF()">Export</button>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import PdfSigner from './components/pdf-signer.vue'
import { PDFCanvasController } from './lib/pdf-canvas'

export default Vue.extend({
  name: 'App',
  components: {
    PdfSigner
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
      console.log(pdfBytes)
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
