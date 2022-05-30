<template>
  <div>
    <button @click="dialog = true">Sign</button>
    <button @click="exportPDF()">Export</button>

    <div id="pdf-wrapper" style="max-height: 90vh; overflow-y: scroll; overflow-x: hidden;">
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

export default Vue.extend({
  components: { SignatureDialog },
  data () {
    return {
      canvas: null as fabric.Canvas | null,
      signature: null as fabric.Group | null,
      dialog: false
    }
  },
  mounted () {
    this.canvas = new fabric.Canvas('canvas')
    const pdfUrl = 'https://test-media.jeracloud.com/clinic_1/files/before_after/file/e076582f-cbe8-4383-859a-8419500c2028.pdf?Expires=1653918834&Signature=TXnnSymvl7Y4ietUVby-ISW3MbXepfhhIk0zg--S2ZrmARYUiVuubRw-JqUqE9ZpJ36jTyXdHd0FMOA5w57j0iVzNUHQQdMYuBZzshjfd05-Sqq5Ep6Z5alZKut3oIjPocyFAeVDgbIzi1DCavMAncp1F5ItsaIJ-iGtPvA~83aPHD2lTlmCk9qtRwg4cpv1XhHuN5y4D7vwC7JnM1XeD5gV1eHIzyu3YHe~slhu4EieXgjTHKiBX~3PB6nBQ3fA4B9FQH7gZAwiv3HBGlkEMOayrIGvCK68fZZhBQxmN1R-PRmq1AVD8qAoh5zNscfUQYXW0JJp2AzHUwE-pQYkVw__&Key-Pair-Id=APKAJH3DRXDNDEHWYJFA'
    const wrapper = document.getElementById('pdf-wrapper')
    if (!wrapper) {
      return
    }
    this.canvas.setWidth(wrapper.offsetWidth - 20)
    this.canvas.setHeight(1694 * 1 + 100)
    this.canvas.setBackgroundColor('#eeeeee', console.log)
    this.loadPdf(this.canvas, pdfUrl)
  },
  methods: {
    async loadPdf (canvas: fabric.Canvas, url: string) {
      const fbImages = await loadPDF(url)
      for (let i = 0; i < fbImages.length; i++) {
        const img = fbImages[i]
        img.set('top', (img.getScaledHeight() + 10) * i + 50)
        img.set('selectable', false)
        canvas.add(img)
        canvas.centerObjectH(img)
      }
    },

    insertSignature (signature: fabric.Group) {
      if (!this.canvas) {
        alert('Canvas not initialized!')
        return
      }

      this.signature = signature
      this.canvas.add(signature)
    },

    async exportPDF () {
      if (!this.signature) {
        alert('Not signed yet!')
        return
      }

      const pdfUrl = 'https://test-media.jeracloud.com/clinic_1/files/before_after/file/e076582f-cbe8-4383-859a-8419500c2028.pdf?Expires=1653918834&Signature=TXnnSymvl7Y4ietUVby-ISW3MbXepfhhIk0zg--S2ZrmARYUiVuubRw-JqUqE9ZpJ36jTyXdHd0FMOA5w57j0iVzNUHQQdMYuBZzshjfd05-Sqq5Ep6Z5alZKut3oIjPocyFAeVDgbIzi1DCavMAncp1F5ItsaIJ-iGtPvA~83aPHD2lTlmCk9qtRwg4cpv1XhHuN5y4D7vwC7JnM1XeD5gV1eHIzyu3YHe~slhu4EieXgjTHKiBX~3PB6nBQ3fA4B9FQH7gZAwiv3HBGlkEMOayrIGvCK68fZZhBQxmN1R-PRmq1AVD8qAoh5zNscfUQYXW0JJp2AzHUwE-pQYkVw__&Key-Pair-Id=APKAJH3DRXDNDEHWYJFA'
      const existingPdfBytes = await fetch(pdfUrl).then(res => res.arrayBuffer())
      const pdfDoc = await PDFDocument.load(existingPdfBytes)

      const pngUrl = this.signature.toDataURL({})
      console.log(pngUrl)
      const pngImageBytes = await fetch(pngUrl).then((res) => res.arrayBuffer())
      const pngImage = await pdfDoc.embedPng(pngImageBytes)

      const page = pdfDoc.getPage(0)
      page.drawImage(pngImage, { x: 0, y: 0, width: pngImage.width, height: pngImage.height })

      // const pdfBytes = await pdfDoc.save()
      const pdfDataUri = await pdfDoc.saveAsBase64({ dataUri: true })
      console.log(pdfDataUri)
    }
  }
})
</script>
