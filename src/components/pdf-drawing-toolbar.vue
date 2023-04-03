<template>
  <div class="drawing-toolbar">
    <div style="display: flex; align-items: center">
      <x-button
        class="square"
        :icon="icons.pen"
        :class="{'active': tool === 'pen'}"
        @click="$emit('update:tool', 'pen')"
      />
      <x-button
        class="square"
        :icon="icons.marker"
        :class="{'active': tool === 'highlighter'}"
        @click="$emit('update:tool', 'highlighter')"
      />
      <x-button
        class="square"
        :icon="icons.eraser"
        :class="{'active': tool === 'eraser'}"
        @click="$emit('update:tool', 'eraser')"
      />

      <label style="margin-left: 12px;">Size</label>
      <input
        type="range"
        min="1"
        max="30"
        :value="penSize"
        @input="$emit('update:pen-size', Number($event.target.value))"
        style="width: 100px;"
      />

      <label style="margin-left: 12px">Color</label>
      <x-button
        v-for="c in ['rgba(0,0,0,1)', 'rgba(255,0,0,1)', 'rgba(0,0,255,1)', 'rgba(252,186,3,1)', 'rgba(255,192,203,1)', 'rgba(5,194,2,1)']"
        :key="c"
        :icon="icons.circle"
        :color="c"
        class="square"
        :class="{'active': isActivePenColor(c)}"
        @click="updatePenColor(c)"
      />
    </div>
    <div style="text-align: right">
      <x-button
        @click="$emit('click-close')"
        :icon="icons.close"
        class="square"
      />
    </div>
  </div>
</template>

<script lang="ts">
import Vue, { PropOptions } from 'vue'
import xButton from './common/x-button.vue'
import { mdiCircle, mdiClose, mdiDrawPen, mdiPen, mdiEraser, mdiMarker } from '@mdi/js'
import { updateRgbaAlpha } from '@/utils/color'

export default Vue.extend({

  components: { xButton },

  props: {
    penSize: {
      type: Number,
      default: 1
    } as PropOptions<number>,
    penColor: {
      type: String,
      default: 'black'
    } as PropOptions<string>,
    tool: {
      type: String,
      default: 'pen'
    } as PropOptions<string>
  },

  data () {
    return {
      icons: {
        close: mdiClose,
        circle: mdiCircle,
        drawPen: mdiDrawPen,
        pen: mdiPen,
        eraser: mdiEraser,
        marker: mdiMarker
      }
    }
  },

  methods: {
    updatePenColor (color: string) {
      if (this.tool === 'pen') {
        this.$emit('update:pen-color', color)
      }

      if (this.tool === 'highlighter') {
        this.$emit('update:pen-color', updateRgbaAlpha(color, 0.5))
      }
    },

    isActivePenColor (color: string) {
      return updateRgbaAlpha(this.penColor, 1) === color
    }
  }
})
</script>

<style scoped>
.drawing-toolbar {
  display: flex;
  justify-content: space-between;
  flex-direction: row;
  flex-wrap: nowrap;
  border-bottom: 1px solid #cccccc;
  padding: 0;

  overflow-x: scroll;
}

label {
  margin-right: 5px;
}

.active {
  background-color: #eeeeee !important;
}

.square {
  background-color: white;
  padding: 0;
  width: 40px;
}

@media (hover: hover) and (pointer: fine) {
  .square:hover {
    background: #e0e0e0;
  }
}
</style>
