<template lang="pug">
  v-layout(row wrap v-if="records.length")
    v-flex(xs12)
      h5.primary--text Lab Test Orders:
    template(v-for="(record) in records")
      v-flex(shrink).pa-2
        preview(
          :record="record"
          :patient="patient"
          read-only
          in-drawer
        ).grey.lighten-4
</template>

<script>
import Preview from '../../../medical-records/lab-order/preview';

export default {
  components: {
    Preview,
  },
  props: {
    records: {
      type: Array,
      default: undefined,
    },
    patient: {
      type: Object,
      default: undefined,
    },
  },
};
</script>
