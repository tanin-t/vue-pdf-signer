<template>
  <x-dialog
    :value="value"
    @input="close()"
    :max-height="'600px'"
  >
    <template #header>
      <h3>Insert Image</h3>
    </template>

    <div style="padding: 0 20px; text-align: left; height: 450px">
      <div style="text-align: center; white-space: nowrap">
        <x-button
          style="width: calc(50% - 6px)"
          :icon="mdi.upload"
          :auto-hide-text="false"
          text="Choose Photo"
          @click="openUploadFileDialog()"
        />
        <x-button
          v-if="isMobile"
          style="width: calc(50% - 6px)"
          :icon="mdi.camera"
          :auto-hide-text="false"
          text="Take Photo"
          @click="openCamera()"
        />
      </div>

      <div style="display: none">
        <input
          type="file"
          id="file-input"
          :key="`file-input-${fileInputKey}`"
          accept="image/*"
          @change="onFileSelected($event)"
        />
        <input
          type="file"
          id="file-input-camera"
          capture="environment"
          accept="image/*"
          @change="onFileSelected($event)"
        />
      </div>

      <div
        style="
          display: flex;
          justify-content: center;
          text-align: center;
          border: 1px dashed #aaaaaa;
          border-radius: 5px;
          width: 325px;
          height: 250px;
          padding: 5px;
          margin: 15px 0;
        "
      >
        <img
          v-if="previewUrl"
          style="max-width: 100%; max-height: 100%; object-fit: contain;"
          :style="{ opacity: opacity }"
          :src="previewUrl"
        />
      </div>

      <div class="image-config" style="margin-top: 10px; margin-bottom: 10px">
        <table style="width: 100%">
          <tr>
            <td>Opacity</td>
            <td style="position: relative; top: 2px">
              <input
                style="width: 100%;"
                type="range"
                min="0"
                step="0.01"
                max="1"
                v-model="opacity"
              />
            </td>
          </tr>
          <tr>
            <td>Insert to all pages</td>
            <td style="position: relative; top: 2px">
              <input v-model="insertToAllPages" type="checkbox" />
            </td>
          </tr>
        </table>
      </div>

      <div style="text-align: center">
        <x-button
          :icon="mdi.plus"
          :auto-hide-text="false"
          text="Add Image"
          @click="submit()"
        />
      </div>
    </div>
  </x-dialog>
</template>

<script lang="ts">
import Vue from 'vue'
import xButton from './common/x-button.vue'
import xDialog from './common/x-dialog.vue'
import { mdiCamera, mdiUpload, mdiPlus } from '@mdi/js'
import { isMobile } from '@/utils/device'

export default Vue.extend({
  components: { xDialog, xButton },
  props: {
    value: {
      type: Boolean,
      required: true
    }
  },

  data () {
    return {
      file: null as File | null,
      previewUrl: '',
      opacity: 1,
      insertToAllPages: false,

      mdi: {
        upload: mdiUpload,
        camera: mdiCamera,
        plus: mdiPlus
      },

      fileInputKey: 1
    }
  },

  computed: {
    isMobile (): boolean {
      return isMobile()
    }
  },

  methods: {
    onFileSelected (evt: Event) {
      const fileInput = evt.target as HTMLInputElement
      if (!fileInput.files) {
        throw new Error('fileInput is not <input type="file">')
      }
      const file = fileInput.files[0]

      console.log({ file })
      this.file = file
      this.previewUrl = URL.createObjectURL(file)
    },

    openUploadFileDialog () {
      document.getElementById('file-input')?.click()
    },

    openCamera () {
      document.getElementById('file-input-camera')?.click()
    },

    clear () {
      this.file = null
      this.previewUrl = ''
      this.opacity = 1
      this.insertToAllPages = false
      this.fileInputKey += 1
    },

    close () {
      this.clear()
      this.$emit('input', false)
    },

    submit () {
      if (!this.file) {
        alert('Please select a file')
        return
      }

      this.$emit('submit', {
        file: this.file,
        opacity: this.opacity,
        insertToAllPages: this.insertToAllPages
      })
      this.close()
    }
  }
})
</script>
