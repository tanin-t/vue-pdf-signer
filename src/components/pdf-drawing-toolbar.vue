<template>
  <div class="drawing-toolbar">
    <div style="display: flex; align-items: center">
      <label>Size</label>
      <input
        type="range"
        min="1"
        max="10"
        :value="penSize"
        @input="$emit('update:pen-size', Number($event.target.value))"
      />

      <label style="margin-left: 24px">Color</label>
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
import { mdiCircle, mdiClose, mdiDrawPen } from '@mdi/js'
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
    } as PropOptions<string>
  },

  data () {
    return {
      icons: {
        close: mdiClose,
        circle: mdiCircle,
        drawPen: mdiDrawPen
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
  padding: 0 12px;
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
