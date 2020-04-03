<template lang="pug">
  div
    v-layout(row wrap)
      v-flex(xs12 md12).py-1
        h3(align="center") Laboratory Order
        b.grey--text
          small Test/s
        ol
          li(v-for="(test, key) in record.tests")
            small {{test.name || '-'}}
      v-flex(xs12 md12).py-1
        b.grey--text
          small Diagnosis/Reason for Test Order
        br
        small(style="white-space: pre-wrap !important").pl-3 {{record | diagnosis-reasons}}
</template>

<script>
import RecordOptions from '../record-options';
export const COMPONENT_NAME = 'mc-lab-order-print-preview';
export default {
  filters: {
    diagnosisReasons (record) {
      const diagnosis = [record.diagnosisCode, record.diagnosisText]
        .filter(d => (d || '').trim().length > 0)
        .join(' - ');
      const reason = record.reason || '';

      let result = '';
      if (diagnosis.trim().length > 0) result = `${diagnosis} / `;
      result = `${result}${reason.trim().length > 0 ? reason : 'NA'}`;

      return result;
    },
  },
  components: {
    RecordOptions,
  },
  props: {
    record: {
      type: Object,
      default: undefined,
    },
    readOnly: Boolean,
    removeOptions: Boolean,
  },
};
</script>
