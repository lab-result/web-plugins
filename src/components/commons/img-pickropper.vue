<template lang="pug">
  div
    v-tooltip(bottom)
      slot(name="picker" slot="activator")
      | Click to upload
    input(
      ref="fileInputActivator"
      type="file"
      @change="fileChange"
    ).hide
    v-dialog(v-model="confirmDialog" width="500")
      v-card
        v-toolbar(flat)
          h2 Do you want to crop this picture?
          v-spacer
          v-btn(icon @click="close")
            v-icon mdi-close
        v-card-text.black
          v-img(
            max-width="100%"
            :aspect-ratio="1/1"
            :src="source"
          )
        v-divider
        v-card-actions
          v-spacer
          v-btn(color="primary" @click="confirmCrop(true)" large) Yes
          v-btn(flat @click="confirmCrop(false);" large color="error") Nope

    v-dialog(
      v-model="dialog"
      persistent
      :width="minContainerWidth"
      :fullscreen="fullscreen"
    )
      v-card
        v-toolbar(flat)
          h2 Crop Photo
          v-spacer
          v-btn(icon @click="close")
            v-icon mdi-close
        v-card-text.pa-0
          v-layout(column align-center)
            vue-cropperjs(
              ref="cropperRef"
              @crop="result"
              :height="350"
              :max-height="350"
              :aspect-ratio="aspectRatio"
            )
        v-divider
        v-card-actions
          v-spacer
          v-btn(flat large color="primary" @click="rotate(-90)")
            v-icon mdi-rotate-left
            | Rotate Left
          v-btn(flat large color="primary" @click="rotate(90)")
            v-icon mdi-rotate-right
            | Rotate Right
          v-btn(depressed large color="primary" @click="crop")
            v-icon mdi-crop
            |  Crop
          v-btn(depressed large color="error" @click="skipCrop" v-if="!forceCrop")
            v-icon mdi-close
            |  Skip Cropping
          v-spacer

</template>

<script>
// components
import VueCropperjs from './VueCropperjs';
// constants
// utils

export default {
  components: {
    VueCropperjs,
  },
  props: {
    forceCrop: Boolean,
    aspectRatio: {
      type: Number,
      default: null,
    },
    fullscreen: Boolean,
    sizeLimitKb: {
      type: Number,
      default: undefined,
    },
  },
  data () {
    return {
      dialog: false,
      confirmDialog: false,
      source: '',
      minContainerWidth: 800,
      minContainerHeight: 500,
    };
  },
  methods: {
    selectFile () {
      this.$refs.fileInputActivator.click();
    },
    fileChange (file) {
      if (!file.target.files[0].name.match(/.(jpg|jpeg|png|gif)$/i)) {
        window.alert('Invalid image file. Must be JPG, JPEG, PNG or GIF');
        file.target.value = null;
        return;
      }

      const fileSizeKb = file.target.files[0].size / 1000;

      if (this.sizeLimitKb && fileSizeKb > this.sizeLimitKb) {
        window.alert('Image too large. Max size is 1MB');
        file.target.value = null;
        return;
      }

      var reader = new window.FileReader();
      reader.readAsDataURL(file.target.files[0]);
      reader.onload = () => {
        this.$nextTick(() => {
          setTimeout(() => {
            this.dialog = true;
          }, 500);
          this.source = reader.result;
          this.$refs.cropperRef.bind(this.source);
          file.target.value = null;
        });
      };
      reader.onerror = (error) => {
        console.log('Error: ', error);
      };
    },
    confirmCrop (doCrop) {
      if (doCrop) {
        this.dialog = true;
      } else {
        this.$emit('done', this.source);
      }
      this.confirmDialog = false;
    },
    rotate (direction) {
      this.$refs.cropperRef.rotate(direction);
    },
    crop () {
      this.dialog = false;
      this.$refs.cropperRef.crop();
    },
    skipCrop () {
      this.$emit('done', this.source);
      this.$refs.cropperRef.destroy();
      this.dialog = false;
    },
    result (res) {
      this.$emit('done', res);
    },
    close () {
      this.dialog = false;
      this.$refs.cropperRef.destroy();
    },
  },
};
</script>

<style scoped>
  .img-display:hover {
    cursor: pointer;
  }
  .hide {
    display: none;
  }
</style>
