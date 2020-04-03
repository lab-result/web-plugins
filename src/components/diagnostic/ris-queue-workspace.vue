<template lang="pug">
  queue-workspace(
    ref="queueWorkspace"
    patient-read-only
    @skip="onSkip"
    @next="onNext"
  )
    template(slot-scope="props")
      v-card(flat)
        v-card-text
          diagnostic-pending-orders(
            ref="pendingOrders"
            type="radiology"
            :read-only="props.disabled"
            :patient="props.queueItem | extract-patient-id"
            :queue-item-id="props.queueItem.id"
          )
</template>

<script>
import _ from 'lodash';
import DiagnosticPendingOrders from './pending-orders';
import QueueWorkspace from '../queue/queue-workspace';

export default {
  components: {
    QueueWorkspace,
    DiagnosticPendingOrders,
  },
  filters: {
    extractPatientId (queueItem) {
      return _.get(queueItem, 'meta.patient');
    },
  },
  props: {
    serveNow: Boolean,
  },
  methods: {
    onNext () {
      _.invoke(this.$refs, 'pendingOrders.confirmOrderTests');
    },
    onSkip () {
      _.invoke(this.$refs, 'pendingOrders.cancelOrderTests');
    },
  },
};
</script>
