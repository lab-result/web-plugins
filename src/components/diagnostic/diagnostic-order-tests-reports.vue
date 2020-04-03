<template lang="pug">
  generic-table(
    :items="reports"
    :headers="headers"
    :loading="loading"
    :pagination.sync="paginationModel"
    :total-items="reportsTotal"
    date-filterable
    :date-filter.sync="dateFilterModel"
    :date-filter-options="dateFilterOptions"
    filterable
    :filter.sync="diagnosticCenterFilterModel"
    :filter-items="diagnosticCenterFilterItems"
    filter-label="Send Out To"
    :filter-options="diagnosticCenterFilterOptions"
    addable
    @add="onAdd"
  )
    template(slot="middle-action")
      v-flex(xs3).px-1
        v-select(
          v-model="statusFilterModel"
          :items="statusFilterItems"
          label="Status"
          v-bind="statusFilterOptions"
          flat
          solo
          hide-details
        )
    tr(
      slot="items"
      slot-scope="props"
      @click="onReportClick(props.item)"
    )
      td {{props.item.preparedAt | morph-date('MMM DD, YYYY h:mm A')}}
      td {{props.item.sentOutTo | extract-prop('name')}}
      td
        v-chip(
          :color="props.item | extract-status | get-status-color"
          dark
        ) {{props.item | extract-status | get-status-text}}
</template>

<script>
// components
import GenericTable from '../commons/generic-table';
// constants
// utils
import _ from 'lodash';
import { syncProp } from '../../utils/vue';

/**
 * @typedef {import('@mycure/sdk').DiagnosticOrderTestsReport} DiagnosticOrderTestsReport
 */

/**
 * @typedef {import('@mycure/sdk').Organization} Organization
 */

/**
 * @typedef {Object} Pagination
 * @property {number} pageNo
 * @property {number} rowsPerPage
 */

/**
 * @typedef {number} Timestamp
 * @desc Unix timestamp
 *
 * @typedef {Object} DateFilter
 * @property {Timestamp} start
 * @property {Timestamp} end
 */

/**
 * @typedef {Organization} DiagnosticCenter
 * @desc Organization with type diagnostic-center
 */

/**
 * @typedef {Object} Status
 * @property {string} text
 * @property {string} value
 */

/**
 * @emits update:pagination
 * @return {Pagination}
 */

/**
 * @emits update:dateFilter
 * @return {DateFilter}
 */

/**
 * @emits update:diagnosticCenterFilter
 * @return {DiagnosticCenter}
 */

/**
 * @emits update:statusFilter
 * @return {Status}
 */

/**
 * @emits add
 */

/**
 * @emits click
 * @return {DiagnosticOrderTestsReport}
 */

const STATUS_DETAILS_MAP = {
  delivered: {
    text: 'Delivered',
    color: 'error',
  },
  partial: {
    text: 'Partially Received',
    color: 'primary',
  },
  received: {
    text: 'Received',
    color: 'success',
  },
};

export default {
  components: {
    GenericTable,
  },
  filters: {
    extractProp (item, prop) {
      return _.get(item, prop);
    },
    extractStatus (report) {
      const items = _.get(report, 'items');
      const receivedItems = _.filter(items, 'receivedAt');
      if (_.isEmpty(receivedItems)) return 'delivered';
      if (_.size(receivedItems) < _.size(items)) return 'partial';
      return 'received';
    },
    getStatusColor (status) {
      return _.get(STATUS_DETAILS_MAP, [status, 'color']);
    },
    getStatusText (status) {
      return _.get(STATUS_DETAILS_MAP, [status, 'text']);
    },
  },
  props: {
    /** @type {DiagnosticOrderTestsReport[]} */
    reports: {
      type: Array,
      default: undefined,
    },
    /**
     * Use as :pagination.sync
     * @type {Pagination}
     */
    pagination: {
      type: Object,
      default: undefined,
    },
    reportsTotal: {
      type: Number,
      default: undefined,
    },
    /**
     * Use as :date-filter.sync
     * @type {DateFilter}
     */
    dateFilter: {
      type: Object,
      default: undefined,
    },
    /**
     * Use as :diagnostic-center-filter.sync
     * @type {DiagnosticCenter}
     */
    diagnosticCenterFilter: {
      type: Object,
      default: undefined,
    },
    /** @type {DiagnosticCenter[]} */
    diagnosticCenterFilterItems: {
      type: Array,
      default: undefined,
    },
    /**
     * Use as :status-filter.sync
     * @type {Status}
     */
    statusFilter: {
      type: Object,
      default: undefined,
    },
    /** @type {Status[]} */
    statusFilterItems: {
      type: Array,
      default: undefined,
    },
    loading: Boolean,
  },
  data () {
    return {
      headers: [
        { text: 'Date Requested', value: 'preparedAt', sortable: false },
        { text: 'Send Out Center', value: 'sentOutTo.name', sortable: false },
        { text: 'Status', value: 'status', sortable: false },
      ],
      dateFilterOptions: {
        noFuture: true,
      },
      diagnosticCenterFilterOptions: {
        returnObject: true,
        clearable: true,
        itemText: 'name',
        itemValue: 'id',
      },
      statusFilterOptions: {
        returnObject: true,
        clearable: true,
        itemText: 'text',
        itemValue: 'value',
      },
    };
  },
  computed: {
    paginationModel: syncProp('pagination'),
    dateFilterModel: syncProp('dateFilter'),
    diagnosticCenterFilterModel: syncProp('diagnosticCenterFilter'),
    statusFilterModel: syncProp('statusFilter'),
  },
  created () {
    this.$initLogger('diagnostic-order-tests-reports');
  },
  methods: {
    onAdd () {
      this.$log('onAdd: emitting');
      this.$emit('add');
    },
    onReportClick (report) {
      this.$log('onReportClick#report: %O', report);
      this.$emit('click', report);
    },
  },
};
</script>

<style scoped>
  tr:hover {
    cursor: pointer !important;
  }
</style>
