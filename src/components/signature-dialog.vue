<template>
  <div
    class="dialog"
    :style="{ display: value ? 'flex' : 'none' }"
    @click.self="$emit('input', false)"
  >
    <div
      class="dialog-body"
      style="max-height: 360px; overflow-y: scroll"
    >
      <div class="dialog-header" @click="$emit('input', false)">
        <h3>Signature</h3>
      </div>
      <div class="dialog-content">
        <div
          class="signature-canvas-wrapper"
          style="padding: 1px; width: 500px; height: 180px"
        >
          <canvas
            id="signature-canvas"
            width="480"
            height="180"
            style="border: 1px dashed black"
          />
        </div>
        <div style="padding-top: 10px">
          <a class="link-button" href="#" @click.prevent="clear()">
            Clear Signature
          </a>
          <button
            class="button"
            @click="submit()"
            style="margin: 5px; margin-left: 15px"
          >
            OK
          </button>
        </div>
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
    }
  },

  data () {
    return {
      canvas: null as fabric.Canvas | null
    }
  },

  watch: {
    value (v) {
      if (v && !this.canvas) {
        this.setupSignatureCanvas()
      }
    }
  },

  methods: {
    async setupSignatureCanvas () {
      this.canvas = new fabric.Canvas('signature-canvas', {
        isDrawingMode: true
      })
      this.canvas.freeDrawingBrush.width = 3
    },

    clear () {
      if (!this.canvas) {
        return
      }
      for (const obj of this.canvas?.getObjects()) {
        this.canvas.remove(obj)
      }

      this.canvas.requestRenderAll()
    },
    cancel () {
      this.clear()
      this.$emit('input', false)
    },
    submit () {
      if (!this.canvas) {
        return
      }
      const paths = this.canvas.getObjects()
      if (paths.length === 0) {
        return
      }

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
  left: 0;
  top: 0;
  width: 100%; /* Full width */
  height: 100%; /* Full height */
  overflow: auto; /* Enable scroll if needed */
  background-color: rgb(0, 0, 0); /* Fallback color */
  background-color: rgba(0, 0, 0, 0.4); /* Black w/ opacity */
  justify-content: space-between;
  flex-direction: column;
}

.dialog-body {
  margin: auto;
}

.dialog-header {
  height: 45px;
  top: 0;
  width: 100%;
  background-color: #eeeeee;
  border-bottom: 1px solid black;
  z-index: 2;
}

.dialog-header > h3 {
  padding-top: 10px;
}

.dialog-content {
  background-color: #fefefe;
  margin: auto;
  max-width: 100%;
  overflow: hidden;
  padding-top: 15px;
  padding-bottom: 15px;
}

.dialog-footer {
  height: 45px;
  bottom: 0;
  width: 100%;
  border-top: 1px solid black;
  z-index: 2;
  background-color: #eeeeee;
}

.signature-canvas-wrapper {
  display: flex;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.my-0 {
  margin-top: 0;
  margin-bottom: 0;
}

button.button {
  padding: 10px;
  min-width: 100px;
}

a.link-button {
  text-decoration: none;
}
</style>
