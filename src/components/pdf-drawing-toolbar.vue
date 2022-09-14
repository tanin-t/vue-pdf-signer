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
        :icon="icons.eraser"
        :class="{'active': tool === 'eraser'}"
        @click="$emit('update:tool', 'eraser')"
      />

      <label style="margin-left: 12px;">Size</label>
      <input
        type="range"
        min="1"
        max="10"
        :value="penSize"
        @input="$emit('update:pen-size', Number($event.target.value))"
        style="width: 100px;"
      />

      <label style="margin-left: 12px">Color</label>
      <x-button
        v-for="c in ['black', 'red', 'blue']"
        :key="c"
        :icon="icons.circle"
        :color="c"
        class="square"
        :class="{'active': penColor === c}"
        @click="$emit('update:pen-color', c)"
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
import { mdiCircle, mdiClose, mdiDrawPen, mdiPen, mdiEraser } from '@mdi/js'
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
        eraser: mdiEraser
      }
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
