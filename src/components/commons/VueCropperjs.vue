<template>
  <img
    id="image"
    width="100%"
    :src="img"
  >
</template>

<script>
import Cropper from 'cropperjs';
import 'cropperjs/dist/cropper.css';

export default {
  props: {
    height: {
      type: Number,
      default: 450,
    },
    viewMode: {
      type: Number,
      default: 1,
    },
    aspectRatio: {
      type: Number,
      default: null,
    },
    minContainerWidth: {
      type: Number,
      default: 500,
    },
    minContainerHeight: {
      type: Number,
      default: 500,
    },
  },
  data () {
    return {
      cropper: null,
      result: null,
      img: '',
    };
  },
  methods: {
    bind (img) {
      this._initCropper(img);
    },
    crop () {
      this.$emit('crop', this.cropper.getCroppedCanvas().toDataURL('image/jpeg'));
      this.cropper.destroy();
    },
    rotate (degree) {
      this.cropper.rotate(degree);
    },
    reset () {
      this.cropper.reset();
    },
    clear () {
      this.cropper.clear();
    },
    destroy () {
      this.cropper.destroy();
    },
    _initCropper (img) {
      const image = document.getElementById('image');
      image.src = img;
      const {
        viewMode,
        aspectRatio,
        height,
        minContainerWidth,
        minContainerHeight,
      } = this;
      this.cropper = new Cropper(image, {
        viewMode,
        aspectRatio,
        height,
        minContainerWidth,
        minContainerHeight,
      });
    },
  },
};
</script>
