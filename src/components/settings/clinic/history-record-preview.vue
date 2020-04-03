<template lang="pug">
  v-dialog(v-model="model" width="600" scrollable)
    v-card
      v-toolbar(flat)
        v-toolbar-title {{record.type | filter-type}} - {{activityLog.createdAt | morph-date('MMM. DD, YYYY hh:mm:ss A')}}
        v-spacer
        v-btn(icon @click="model = false")
          v-icon mdi-close
      v-card-text
        v-layout(row)
          v-flex(xs12 md12).grey.lighten-3.pa-2
            h5.grey--text Patient
            span {{record.patient | parse-patient }}
        v-layout(row)
          v-flex(xs12 md12).pa-2
            h5.grey--text Date of Record
            span {{record.createdAt | morph-date('MMM. DD, YYYY hh:mm:ss A')}}

        lab-order-preview(
          v-if="record.type === 'lab-test-order'"
          :record="record"
          :patient="patient"
          read-only
          remove-options
        )
</template>

<script>
import LabOrderPreview from '../../medical-records/lab-order/preview';
import { prettifyNameFirst, middleInitalInjector } from '../../../utils/string';
import _ from 'lodash';

export default {
  components: {
    LabOrderPreview,
  },
  filters: {
    filterType (str) {
      return _.startCase(str);
    },
    parsePatient (patient) {
      if (_.isEmpty(patient) || _.isEmpty(patient.name)) return '-';
      return prettifyNameFirst(middleInitalInjector(patient.name));
    },
  },
  props: {
    activityLog: {
      type: Object,
      default: undefined,
    },
    record: {
      type: Object,
      default: undefined,
    },
    patient: {
      type: Object,
      default: undefined,
    },
    dialog: Boolean,
  },
  data () {
    return {
      model: false,
    };
  },
  watch: {
    dialog (val) {
      this.model = val;
    },
    model (val) {
      if (!val) {
        this.$emit('close', false);
      }
    },
  },
};
</script>
