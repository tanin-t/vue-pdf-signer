<template>
  <div id="app">
    <pdf-signer pdfUrl="/example.pdf" />
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import PdfSigner from './components/pdf-signer.vue'

export default Vue.extend({
  name: 'App',
  components: {
    PdfSigner
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
