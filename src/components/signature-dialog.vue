<template>
  <div
    class="dialog"
    :style="{ display: value ? 'block' : 'none', 'padding-top': fullscreen ? '0' : '120px' }"
    @click.self="$emit('input', false)"
  >
    <div class="dialog-body" :style="{ width: cWidth, height: cHeight }">
      <div class="dialog-header" @click="$emit('input', false)">
        <h3>Signature</h3>

      </div>
      <div class="dialog-content">
        <div class="signature-canvas-wrapper">
          <canvas
            id="signature-canvas"
            style="border: 1px dashed black; margin: auto"
          />
        </div>
      </div>
      <div class="dialog-footer">
        <button @click="clear()" style="margin-right: 30px; margin-top: 10px;">Cancel</button>
        <button @click="submit()" style="margin: auto;">OK</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { fabric } from 'fabric'
import { min } from 'lodash'
import { isLandscape, isMobile } from '@/utils/device'

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
      default: '400px'
    }
  },

  data () {
    return {
      canvas: null as fabric.Canvas | null,
      fullscreen: false
    }
  },

  computed: {
    cWidth (): string {
      return this.fullscreen ? '100%' : this.width
    },
    cHeight (): string {
      return this.fullscreen ? '100%' : this.height
    }
  },

  watch: {
    value (v) {
      if (v && !this.canvas) {
        this.setupSignatureCanvas()
      }
    }
  },

  mounted () {
    this.fullscreen = isMobile() && isLandscape()
    window.addEventListener('orientationchange', () => {
      this.fullscreen = isMobile() && isLandscape()

      setTimeout(() => {
        this.resizeCanvas()
      }, 500)
    }, false)
    window.addEventListener('resize', () => {
      this.resizeCanvas()
    })
  },

  methods: {
    async setupSignatureCanvas () {
      this.canvas = new fabric.Canvas('signature-canvas', {
        isDrawingMode: true
      })
      this.canvas.freeDrawingBrush.width = 3

      await this.$nextTick()
      this.resizeCanvas()
    },

    resizeCanvas () {
      if (!this.canvas) return

      const wrapper = this.canvas.getElement().parentElement?.parentElement
      if (!wrapper) return

      const width = min([wrapper.clientWidth - 50, window.screen.width - 100])
      this.canvas.setHeight(wrapper.clientHeight - 100)
      this.canvas.setWidth(width || 0)
    },

    clear () {
      if (!this.canvas) {
        return
      }
      for (const obj of this.canvas?.getObjects()) {
        this.canvas.remove(obj)
      }

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
  padding-top: 120px;
}

.dialog-body {
  margin: auto;
  position: relative;
}

.dialog-header {
  position: absolute;
  height: 60px;
  top: 0;
  width: 100%;
  background-color: #eeeeee;
  border-bottom: 1px solid black;
  z-index: 2;
}

.dialog-content {
  padding-top: 60px;
  padding-bottom: 60px;
  background-color: #fefefe;
  margin: auto;
  height: calc(100% - 120px);
  max-width: 100%;
  overflow: hidden;
}

.dialog-footer {
  height: 60px;
  position: absolute;
  bottom: 0;
  width: 100%;
  border-top: 1px solid black;
  z-index: 2;
  background-color: #eeeeee;
}

.signature-canvas-wrapper {
  display: flex;
  justify-content: center;
  padding-top: 25px;
  padding-bottom: 25px;
  width: 100%;
  height: 100%;
}

.my-0 {
  margin-top: 0;
  margin-bottom: 0;
}

button {
  padding: 10px;
  min-width: 100px;
}

</style>
