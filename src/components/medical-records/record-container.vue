<template lang="pug">
  div.mb-2
    div.record-header.pa-2
      span {{recordName}}
    div.record-body.pa-2
      template
        v-layout(row wrap).pa-3
          v-flex(shrink v-for="(record, key) in records" :key="key").pa-2.record-preview.ma-1
            slot(name="record-preview" :record="record")
      template(v-for="(model, key) in models")
        div.py-2
          v-divider
          v-toolbar(flat dense color="transparent")
            h3 New Entry
            v-spacer
            v-btn(icon @click="removeEntry(key)")
              v-icon(color="error") mdi-trash-can-outline
          div(style="border-left: 3px solid #0099cc;")
            slot(:ref="ref" name="record-form" :model="model")
      template
        div.px-3
          v-btn(flat color="primary" @click="addEntry" outline small).ma-0.ml-1 + Add New
</template>

<script>
import _ from 'lodash';
export default {
  props: {
    ref: {
      type: Object,
      default: undefined,
    },
    type: {
      type: String,
      default: undefined,
    },
    records: {
      type: [Object, Array],
      default: undefined,
    },
    recordName: {
      type: String,
      default: undefined,
    },
    recordIndex: {
      type: Number,
      default: undefined,
    },
    recordTotal: {
      type: Number,
      default: undefined,
    },
    modelShape: {
      type: Object,
      default: undefined,
    },
  },
  data () {
    return {
      valid: false,
      loading: false,
      //
      models: [],
    };
  },
  watch: {
    loading (val) {
      this.$emit('loading', val);
    },
    models: {
      handler (val) {
        this.$emit('data', val);
      },
      deep: true,
    },
  },
  methods: {
    async submit () {
      return new Promise((resolve, reject) => {
        this.loading = true;

        console.warn(this.ref);

        if (_.isEmpty(this.$refs.formRef)) {
          this.valid = true;
          resolve([]);
          return;
        }
        _.forEach(this.$refs.formRef, (ref) => {
          ref.validate();
        });

        this.$nextTick(() => {
          this.valid = _.every(this.$refs.formRef.map(ref => ref.valid));
          this.$emit('valid', this.valid);
          if (this.valid) {
            resolve(Object.assign([], this.models));
          } else {
            reject(new Error(`${this.recordName} is invalid.`));
          }
        });
      });
    },
    addEntry () {
      this.models.push(this.modelShape);
    },
    removeEntry (index) {
      this.models.splice(index, 1);
      if (_.isEmpty(this.models)) { this.$emit('valid', true); }
    },
    clearEntries () {
      this.models = [];
      if (_.isEmpty(this.models)) { this.$emit('valid', true); }
    },
  },
};
</script>

<style scoped>
  @import url('../../assets/styles/records.css');
</style>
