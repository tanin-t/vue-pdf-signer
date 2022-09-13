<template>
  <div
    class="dialog"
    :style="{ display: value ? 'flex' : 'none' }"
    @click.self="$emit('input', false)"
  >
    <div
      class="dialog-body"
      style="overflow-y: auto;"
      :style="{'max-height': maxHeight}"
    >
      <div class="dialog-header" @click="$emit('input', false)">
        <slot name="header"></slot>
      </div>
      <div class="dialog-content">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
export default Vue.extend({
  props: {
    value: {
      type: Boolean
    },
    maxHeight: {
      type: String,
      default: '360px'
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
  text-align: center;
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

</style>
