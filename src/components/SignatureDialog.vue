<template>
  <div
    class="dialog"
    :style="{ display: value ? 'block' : 'none' }"
    @click.self="$emit('input', false)"
  >
    <div class="dialog-content" :style="{width: width, height: height}">
      <div style="background-color: #eeeeee">
        <h3 style="margin: 0; padding: 20px 0px">Signature</h3>
      </div>
      <hr class="my-0">
      <div style="display: flex; justify-content: center; padding-top: 25px; padding-bottom: 25px;">
        <canvas id="signature-canvas" height="240" style="border: 1px dashed black; margin: auto;" />
      </div>
      <hr class="my-0">
      <div style="background-color: #eeeeee; padding: 20px">
        <button @click="clear()">Clear</button>
        <button @click="submit()">OK</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { fabric } from 'fabric'

export default Vue.extend({
  props: {
    value: {
      type: Boolean
    },
    width: {
      type: String,
      default: '90%'
    },
    height: {
      type: String,
      default: ''
    }
  },

  data () {
    return {
      canvas: null as fabric.Canvas | null
    }
  },
  mounted () {
    this.canvas = new fabric.Canvas('signature-canvas', { isDrawingMode: true })
    this.canvas.freeDrawingBrush.width = 3
  },

  methods: {
    clear () {
      if (!this.canvas) {
        return
      }
      for (const obj of this.canvas?.getObjects()) {
        this.canvas.remove(obj)
      }
    },
    submit () {
      if (!this.canvas) {
        return
      }
      const paths = this.canvas.getObjects()
      const signature = new fabric.Group(paths, {})
      this.$emit('submit', signature)
      this.$emit('input', false)

      this.clear()
    }
  }
})
</script>

<style scoped>
  .dialog {
    display: none; /* Hidden by default */
    position: fixed; /* Stay in place */
    z-index: 1; /* Sit on top */
    padding-top: 150px; /* Location of the box */
    left: 0;
    top: 0;
    width: 100%; /* Full width */
    height: 100%; /* Full height */
    overflow: auto; /* Enable scroll if needed */
    background-color: rgb(0,0,0); /* Fallback color */
    background-color: rgba(0,0,0,0.4); /* Black w/ opacity */
  }

  /* Modal Content */
  .dialog-content {
    background-color: #fefefe;
    margin: auto;
    border: 1px solid #888;
  }
  .my-0 {
    margin-top: 0;
    margin-bottom: 0;
  }
</style>
