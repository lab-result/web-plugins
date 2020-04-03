<template lang="pug">
  v-expansion-panel-content
    template(slot="header")
      v-layout(row)
        h3 {{recordName}}
        div.ml-2.record-count.text-xs-center {{records.total}}
    v-card
      v-card-text
        v-layout(row wrap)
          template(v-for="record in records.items")
            v-flex(shrink).grey.lighten-3.pa-3.ma-2
              h3 {{record.createdAt | morph-date('MM/DD/YY hh:mm A')}} - {{record.recordName}}
              lab-order-preview(
                :record="record | omit-record-name"
                :patient="patient"
                remove-options
              )
      v-card-text(v-if="records.items.length !== records.total")
        v-btn(
          block
          flat
          @click="loadMore"
        ) Load more
      v-card-text(v-else)
        h3.text-xs-center.grey--text No more records
</template>

<script>
// components
import LabOrderPreview from '../../../medical-records/lab-order/preview';
// mixins
import PaginationMixin from './mixin';
// utils
import _ from 'lodash';

export default {
  components: {
    LabOrderPreview,
  },
  filters: {
    omitRecordName (obj) {
      return _.omit(obj, ['recordName']);
    },
  },
  mixins: [PaginationMixin],
  props: {
    records: {
      type: Object,
      default: undefined,
    },
    patient: {
      type: Object,
      default: undefined,
    },
  },
  data () {
    return {
      recordName: 'Laboratory Test Orders',
      showRecordsContainer: false,
    };
  },
  watch: {
    showRecordsContainer (val) {
      this.$emit('open', val);
    },
  },
};
</script>

<style scoped>
.record-count {
  background-color: #0099cc;
  color: white;
  padding: 2px;
  border-radius: 100%;
  width: 25px;
  height: 25px;
}
</style>
