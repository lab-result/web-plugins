<template lang="pug">
  v-card
    v-card-text
      v-layout(column)
        h3 {{ importText }}
        span.mt-3
          a(:href="downloadLink" download) Download Template
          span  and upload the completed file.
        v-layout(row).mt-3
          v-spacer
          v-btn(
            color="primary"
            @click="chooseFile"
          ) Browse file
        input(
          ref="fileInput"
          type="file"
          hidden
          @change="onInputChange($event)"
        )
</template>

<script>
import { readInputFile } from '../../utils/file';

/**
 * @typedef {Object} XlsxUtils
 * @desc Injected xlsx utils dependency, to avoid importing for every consumer
 * @property {function} convertXlsxToJson
 * @property {function} convertJsonToXlsx
 */

export default {
  props: {
    downloadLink: {
      type: String,
      required: true,
    },
    headers: {
      type: Array,
      required: true,
    },
    importText: {
      type: String,
      default: 'Move your data to LabResult.org',
    },
    /** @type {XlsxUtils} */
    utils: {
      type: Object,
      default: undefined,
    },
  },
  created () {
    this.$initLogger('import-xlsx');
  },
  methods: {
    chooseFile () {
      this.$refs.fileInput.click();
    },
    async onInputChange (event) {
      if (!this.utils || !this.utils.convertXlsxToJson) {
        this.$log('onInputChange: no utils passed!');
        throw new Error('XLSX utils dependency must be injected');
      }

      if (!event.target.files[0].name.match(/.(xlsx|xls)$/i)) {
        window.alert('Invalid file. Must be an Excel file');
        event.target.value = null;
        return;
      }
      this.$log('onInputChange#event: %O', event);
      const file = await readInputFile(event, 'binary');

      const data = this.utils.convertXlsxToJson(file, this.headers);

      this.$log('onInputChange#data: %O', data);
      this.$emit('result', data);
      event.target.value = '';
    },
  },
};
</script>
