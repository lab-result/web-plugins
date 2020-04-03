<template lang="pug">
  div.mb-2
    template
      v-layout(row wrap)
        v-flex(shrink v-for="(record, key) in records" :key="key").pa-2.record-preview.ma-1
          record-preview(
            v-if="record"
            :record="record"
            :patient="patient"
            order-test-type="lis"
          )
    template(v-for="(model, key) in models")
      div.py-2
        v-divider
        v-toolbar(flat dense color="transparent")
          h3 New Entry
          v-spacer
          v-btn(icon @click="removeEntry(key)")
            v-icon(color="error") mdi-trash-can-outline
        div(:style="{ 'border-left': `3px solid ${ valid ? '#0099cc' : '#f75a5f'}` }")
          record-form(
            ref="formRef"
            :model="model"
            :diagnoses="diagnoses"
          )
    template
      div.mt-3
        v-btn(flat color="primary" @click="addEntry" outline small).ma-0.ml-1 + Add New
</template>

<script>
import RecordPreview from './preview';
import RecordForm from './form';
import _ from 'lodash';

export default {
  components: {
    RecordPreview,
    RecordForm,
  },
  props: {
    type: {
      type: String,
      default: undefined,
    },
    records: {
      type: [Object, Array],
      default: undefined,
    },
    patient: {
      type: Object,
      default: undefined,
    },
    recordName: {
      type: String,
      default: undefined,
    },
    diagnoses: {
      type: Array,
      default: undefined,
    },
    dianosticTests: {
      type: Array,
      default: undefined,
    },
  },
  data () {
    return {
      valid: true,
      loading: false,
      //
      models: [],
    };
  },
  watch: {
    valid (val) {
      this.$emit('valid', val);
    },
    loading (val) {
      this.$emit('loading', val);
    },
    models: {
      handler (val) {
        this.$emit('data', val);
        if (_.isEmpty(val)) {
          // Set store validity
          this.$store.commit('medical-records/setPlanTabValidation', {
            key: 'labOrder',
            val: true,
          });
        }
      },
      deep: true,
    },
  },
  methods: {
    async submit () {
      return new Promise((resolve, reject) => {
        this.loading = true;

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
          // Set store validity
          this.$store.commit('medical-records/setPlanTabValidation', {
            key: 'labOrder',
            val: this.valid,
          });
          if (this.valid) {
            // TODO: Refactor validating and getting results from form.
            const models = this.models.map(m => _.omit(m, 'disabledPMEFields'));
            resolve(Object.assign([], models));
          } else {
            reject(new Error(`${this.recordName} is invalid.`));
          }
        });
      });
    },
    addEntry () {
      this.models.push({
        type: this.type,
        createdAt: null,
        reason: '',
        tests: [],
      });
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
  @import url('../../../assets/styles/records.css');
</style>
