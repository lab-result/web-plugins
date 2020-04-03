<template lang="pug">
  v-dialog(v-model="dialog" width="800" persistent scrollable)
    v-card
      v-toolbar(flat)
        h2 Crop
        v-spacer
        v-btn(icon @click="close")
          v-icon mdi-close
      v-card-text(style="height: 500px;").text-xs-center.pa-0
        vue-cropperjs(
          style="width: 400px; height: 200px"
          ref="cropperRef"
          :viewMode="1"
          :aspectRatio="1"
          @crop="result"
        ).red
      v-toolbar(flat)
        v-spacer
        v-btn(color="primary" large @click="crop")
          v-icon mdi-crop
          | Crop
        v-btn(color="error" flat large @click="close") Cancel
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
    dialog: Boolean,
    source: {
      type: String,
      default: undefined,
    },
  },
  data () {
    return {
      model: this.dialog,
    };
  },
  watch: {
    source (val) {
      !!val && this.$refs.cropperRef.bind(val);
    },
  },
  methods: {
    result (res) {
      this.$emit('result', res);
      this.close();
    },
    close () {
      this.$emit('update:dialog', false);
      this.$refs.cropperRef.destroy();
    },
    crop () {
      this.$refs.cropperRef.crop();
    },
  },
};
</script>
