<template>
  <div>
    <div class="toolbar">
      <!-- Left -->
      <div>
        <div style="display: inline-block; width: 110px; text-align: center;">
          <span style="font-size: 16px; height: 40px; position: relative; top: -5px; margin-left: 5px;">
            Page
            <input
              class="page-input"
              type="number"
              :value="page"
              @input="$emit('update:page', $event.target.value)"
            /> / {{ totalPages }}
          </span>
        </div>
        <span style="font-size: 32px; width: 0;">&nbsp;</span>
        <x-button v-if="!isMobile" :icon="icons.zoomOut" @click="$emit('click-zoomout')" />
        <x-button v-if="!isMobile" :icon="icons.zoomIn" @click="$emit('click-zoomin')" />
      </div>

      <!-- Right -->
      <div style="padding-right: 4px;">
        <span style="font-size: 32px; width: 0;">&nbsp;</span>
        <x-button :icon="icons.textBox" text="Text Box" @click="$emit('click-textbox')" />
        <x-button :icon="icons.sign" text="Signature" @click="$emit('click-sign')" />
        <x-button :icon="icons.drawPen" text="Draw" :class="{'active': isDrawing}" @click="$emit('click-draw')" />
        <x-button :icon="icons.imagePlus" text="Image" @click="$emit('click-insert-image')" />
        <x-button :icon="icons.export" @click="$emit('click-export')" />
      </div>
    </div>

    <div class="sub-toolbar">
      <pdf-drawing-toolbar
        v-if="isDrawing"
        :pen-size="drawingPen.size"
        :pen-color="drawingPen.color"
        :tool="drawingTool"
        @update:pen-size="updateDrawingPen({ size: $event })"
        @update:pen-color="updateDrawingPen({ color: $event })"
        @update:tool="updateTool($event)"
        @click-close="$emit('click-draw')"
      />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
// import xIcon from './common/x-icon.vue'
import {
  mdiDownload,
  mdiMagnifyMinus,
  mdiMagnifyPlus,
  mdiSignatureFreehand,
  mdiFormatListBulletedSquare,
  mdiDrawPen,
  mdiImagePlus,
  mdiTextBox
} from '@mdi/js'
import { isMobile } from '@/utils/device'
import PdfDrawingToolbar from './pdf-drawing-toolbar.vue'
import xButton from './common/x-button.vue'

const defaultTools = {
  'vue-pdf-signer:tool:pen': {
    size: 3,
    color: 'rgba(0,0,0,1)'
  },
  'vue-pdf-signer:tool:highlighter': {
    size: 15, color: 'rgba(252,186,3,0.5)'
  },
  'vue-pdf-signer:tool:eraser': null
}

export default Vue.extend({
  components: {
    // xIcon,
    PdfDrawingToolbar,
    xButton
  },

  props: {
    page: {
      type: Number,
      required: true
    },
    totalPages: {
      type: Number,
      required: true
    },
    isDrawing: {
      type: Boolean,
      default: false
    },
    drawingPen: {
      type: Object,
      required: true
    },
    drawingTool: {
      type: String,
      required: true
    }
  },

  computed: {
    isMobile (): boolean {
      return isMobile()
    }
  },

  data () {
    return {
      icons: {
        zoomIn: mdiMagnifyPlus,
        zoomOut: mdiMagnifyMinus,
        sign: mdiSignatureFreehand,
        export: mdiDownload,
        pages: mdiFormatListBulletedSquare,
        drawPen: mdiDrawPen,
        imagePlus: mdiImagePlus,
        textBox: mdiTextBox
      }
    }
  },

  methods: {
    updateDrawingPen (data: { size?: number, color?: string}) {
      const drawingPen = { ...this.drawingPen, ...data }
      this.$emit('update:drawing-pen', drawingPen)

      localStorage.setItem(`vue-pdf-signer:tool:${this.drawingTool}`, JSON.stringify(drawingPen))
    },

    updateTool (tool:'pen'|'highlighter'|'eraser') {
      const key = `vue-pdf-signer:tool:${tool}`
      const savedTool = localStorage.getItem(key)
      const toolConfig = savedTool ? JSON.parse(savedTool) : defaultTools[key as keyof typeof defaultTools]

      if (toolConfig) {
        this.$emit('update:drawing-tool', tool)
        this.$emit('update:drawing-pen', toolConfig)
      } else {
        this.$emit('update:drawing-tool', tool)
      }
    }

  }
})
</script>

<style scoped>
.active {
  background: #aaaaaa;
}

.toolbar {
  width: 100%;
  display: flex;
  justify-content: space-between;
  flex-direction: row;
  /* flex-wrap: nowrap; */
  background: #e0e0e0;
  border-top: 2px solid #e0e0e0;
  border-bottom: 2px solid #e0e0e0;
}

.page-input {
  width: 20px;
  border: none;
  text-align: center;
  font-size: 16px;
  background-color: white;
}

/* Chrome, Safari, Edge, Opera */
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Firefox */
input[type=number] {
  -moz-appearance: textfield;
}
</style>
