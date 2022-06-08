<template>
  <div class="toolbar">
    <div>
      <div style="display: inline-block; width: 110px; text-align: center;">
        <!-- <svg-icon type="mdi" :path="icons.pages" /> -->
        <span style="font-size: 16px; height: 40px; position: relative; top: -5px; margin-left: 5px;">
          Page
          <input
            class="page-input"
            type="number"
            onClick="this.setSelectionRange(0, this.value.length)"
            :value="page"
            @input="$emit('update:page', $event.target.value)"
          /> / {{ totalPages }}
        </span>
      </div>

      <span style="font-size: 32px; width: 0;">&nbsp;</span>

      <button v-if="!isMobile" @click="$emit('click-zoomout')" class="icon-button">
        <svg-icon type="mdi" :path="icons.zoomOut" />
      </button>
      <button v-if="!isMobile" @click="$emit('click-zoomin')" class="icon-button">
        <svg-icon type="mdi" :path="icons.zoomIn" />
      </button>
    </div>

    <div>
      <span style="font-size: 32px; width: 0;">&nbsp;</span>
      <button
        @click="$emit('click-sign')"
        class="icon-button"
        style="width: 160px"
      >
        <svg-icon type="mdi" :path="icons.sign" />
        <span style="font-size: 16px; position: relative; top: -5px">
          Add Signature
        </span>
      </button>
      <button @click="$emit('click-export')" class="icon-button" style="margin-right: 5px;">
        <svg-icon type="mdi" :path="icons.export" />
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import SvgIcon from './svg-icon.vue'
import {
  mdiDownload,
  mdiMagnifyMinus,
  mdiMagnifyPlus,
  mdiSignatureFreehand,
  mdiFormatListBulletedSquare
} from '@mdi/js'
import { isMobile } from '@/utils/device'

export default Vue.extend({
  components: {
    SvgIcon
  },

  props: {
    page: {
      type: Number,
      required: true
    },
    totalPages: {
      type: Number,
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
        pages: mdiFormatListBulletedSquare
      }
    }
  }
})
</script>

<style scoped>
@media(hover: hover) and (pointer: fine) {
  .icon-button:hover {
    background: #e0e0e0;
  }
}
.icon-button {
  width: 60px;
  height: 40px;
  background: #f5f5f5;
  border: none;
  border-radius: 5px;
  transition-duration: 0.4s;
  position: relative;
  overflow: hidden;
  -webkit-transition-duration: 0.4s; /* Safari */
  margin: 2px;
}

.icon-button:active {
  background: #cccccc;
}

.toolbar {
  width: 100%;
  display: flex;
  justify-content: space-between;
  flex-direction: row;
  flex-wrap: nowrap;
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
