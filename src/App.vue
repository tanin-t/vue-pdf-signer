<template>
  <div id="app">
    <!-- <div class="meta">
      window.innerWidth = {{ window.innerWidth }}<br>
      window.innerHeight = {{ window.innerHeight }}<br>
    </div> -->

    <x-dialog v-model="loading">
      <template #header>
        <h1 style="padding: 10px;">Loading Document</h1>
      </template>
      <div>Please wait ...</div>
    </x-dialog>

    <pdf-signer
      :key="src"
      ref="pdf"
      :src="src"
      style="border: 1px solid #d0d0d0; width: 100%; height: calc(100vh - 100px);"
      @ready="loading = false"
    />

    <div>External Control</div>
    <button @click="exportPDF()">Export PDF</button>
    <button @click="exportPNG()">Export PNG</button>
    <button @click="changeSrc()">Change File</button>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import XDialog from './components/common/x-dialog.vue'
import PdfSigner from './components/pdf-signer.vue'
import { PDFCanvasController } from './lib/pdf-canvas'
import { downloadURL, openURL } from './utils/window'

export default Vue.extend({
  name: 'App',
  components: {
    PdfSigner,
    XDialog
  },
  data () {
    return {
      src: '/img-sample-1.jpg',
      srcindex: 0,
      srcset: [
        '/pdf-sample-1.pdf',
        '/pdf-sample-2.pdf',
        '/pdf-sample-3.pdf',
        '/img-sample-1.jpg',
        '/img-sample-2.jpg'
      ],
      loading: true,
      width: '',
      height: ''
    }
  },
  mounted () {
    window.addEventListener('resize', () => {
      this.width = (window.innerWidth - 16) + 'px'
      this.height = (window.innerHeight - 16) + 'px'
    })
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

    changeSrc () {
      this.srcindex = (this.srcindex += 1) % this.srcset.length
      this.src = this.srcset[this.srcindex]
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
  margin: 0;
  padding: 0;
  /* margin-top: 60px; */
  /* max-width: 1202px; */
  /* margin: auto; */
}
</style>
