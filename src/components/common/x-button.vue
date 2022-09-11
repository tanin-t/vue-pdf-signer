<template>
  <button class="icon-button" v-bind="$attrs" v-on="$listeners">
    <x-icon
      type="mdi"
      :size="iconSize"
      :path="icon"
      :style="{ color: color }"
    />
    <span
      v-show="showButtonText"
      style="font-size: 16px; position: relative; top: -5px"
      :style="{ color: color }"
    >
      {{ text }}
    </span>
  </button>
</template>

<script lang="ts">
import Vue, { PropOptions } from 'vue'
import xIcon from './x-icon.vue'

export default Vue.extend({
  components: {
    xIcon
  },

  props: {
    icon: {
      type: String,
      required: true
    } as PropOptions<string>,
    iconSize: {
      type: Number,
      default: 24
    },
    text: {
      type: String,
      required: false,
      default: ''
    } as PropOptions<string>,
    color: {
      type: String,
      default: '#000000'
    } as PropOptions<string>
  },

  computed: {
    showButtonText (): boolean {
      return window.innerWidth > 400
    }
  }
})
</script>

<style>
@media (hover: hover) and (pointer: fine) {
  .icon-button:hover {
    background: #e0e0e0;
  }
}

.icon-button {
  height: 40px;
  background: #f5f5f5;
  border: none;
  border-radius: 5px;
  transition-duration: 0.4s;
  position: relative;
  overflow: hidden;
  -webkit-transition-duration: 0.4s; /* Safari */
  padding-left: 12px;
  padding-right: 12px;
  margin: 2px;
  white-space: nowrap;
}

.icon-button:active {
  background: #cccccc;
}
</style>
