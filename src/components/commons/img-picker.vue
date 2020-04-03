<template lang="pug">
  div
    slot(name="activator")
      v-btn(
        color="primary"
        @click="openFileInput"
      ) Upload
    input(
      ref="fileInput"
      v-show="false"
      type="file"
      :multiple="multiple"
      @change="onFileChoose"
    )
</template>

<script>
import _ from 'lodash';
import { convertFileToDataURL } from '../../utils/file';

export default {
  props: {
    multiple: Boolean,
  },
  created () {
    this.$initLogger('img-picker');
  },
  methods: {
    openFileInput () {
      this.$refs.fileInput.click();
    },
    async onFileChoose (e) {
      this.$log('onFileChoose#files: %O', e.target.files);

      let dataURLs = await Promise.all(
        _.map(Array.from(e.target.files), convertFileToDataURL)
      );
      this.$log('onFileChoose#dataURLs: %O', dataURLs);

      this.$emit('select', dataURLs);
      dataURLs = [];
      e.target.value = null;
    },
  },
};
</script>
