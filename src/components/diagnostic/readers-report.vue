<template lang="pug">
  generic-table(
    :items="orderTests"
    :total-items="totalItems"
    :pagination.sync="paginationModel"
    :headers="headers"
    :loading="loading"
    :date-filter.sync="dateFilterModel"
    :date-filter-options="dateFilterOptions"
    date-filterable
    exportable
    :export-filename="exportFilename"
    :export-format="exportFormat"
    :export-headers="exportHeaders"
    :xlsx-utils="xlsxUtils"
  )
    template(slot="middle-action")
      v-flex(xs3).px-1
        org-members-search(
          v-model="readerFilterModel"
          :filter-roles="filterRoles"
          label="Filter by Reader"
          solo
          flat
        )
      v-flex(xs3).px-1
        search-diagnostic-tests(
          v-model="testFilterModel"
          :type="type"
          label="Filter by Test"
          solo
          flat
        )
    tr(slot="items" slot-scope="props")
      td {{props.item.finalizedAt | morph-date('MM/DD/YY')}}
      td {{props.item | prop('test.name')}}
      td {{props.item | prop('reader.name') | prettify-name}}
      td {{props.item.invoiceItem | extract-price | format-decimal}}
      td {{props.item.service | format-readers-fee(props.item.invoiceItem)}}
</template>

<script>
import GenericTable from '../commons/generic-table';
import OrgMembersSearch from '../org/org-members-search';
import SearchDiagnosticTests from '../common-search/search-diagnostic-tests';
import { PATHOLOGIST_ROLES, IMAGING_DOCTOR_ROLES } from './constants';
import { formatDecimal, prettifyNameFirst } from '../../utils/string';
import { syncProp } from '../../utils/vue';
import { genericTransform } from '../../utils/obj';
import * as xlsxUtils from '../../utils/xlsx';
import { computeBillItemTotalPrice } from '@mycure/sdk/lib/utils/billing';
import { format } from 'date-fns';
import _ from 'lodash';

const formatReadersFee = (service, invoiceItem) => {
  const commissionsPost = _.get(service, 'commissionsPost');
  if (!commissionsPost) return '-';
  const readersFee = commissionsPost.find(commission => commission.type === 'readersfee');

  if (_.has(readersFee, 'amount')) {
    return formatDecimal(readersFee.amount);
  }
  if (_.has(readersFee, 'percentage')) {
    const price = invoiceItem ? computeBillItemTotalPrice(invoiceItem) : 0;
    const netFee = +price * +readersFee.percentage / 100;
    return `${formatDecimal(netFee)} (${readersFee.percentage}%)`;
  }
};

const EXPORT_MAPPINGS = [
  { from: 'test.name', to: 'Test' },
  { from: 'finalizedAt', to: 'Date', format: date => format(date, 'MM/DD/YY') },
  { from: 'reader.name', to: 'Doctor', format: prettifyNameFirst },
  {
    from: 'invoiceItem',
    to: 'Price',
    format: i => i ? computeBillItemTotalPrice(i) : 0,
  },
  {
    from: 'service',
    to: "Reader's Fee",
    provideSource: true,
    format: (service, { invoiceItem }) => formatReadersFee(service, invoiceItem),
  },
];

export default {
  components: {
    GenericTable,
    OrgMembersSearch,
    SearchDiagnosticTests,
  },
  filters: {
    formatReadersFee,
    prop (item, prop) {
      return _.get(item, prop);
    },
    extractPrice (billingItem) {
      return billingItem ? computeBillItemTotalPrice(billingItem) : 0;
    },
  },
  props: {
    readers: {
      type: Array,
      default: undefined,
    },
    type: {
      type: String,
      default: undefined,
    },
    orderTests: {
      type: Array,
      default: undefined,
    },
    dateFilter: {
      type: Object,
      default: undefined,
    },
    readerFilter: {
      type: Object,
      default: undefined,
    },
    testFilter: {
      type: [String, Object],
      default: undefined,
    },
    loading: Boolean,
    pagination: {
      type: Object,
      default: undefined,
    },
    totalItems: {
      type: Number,
      default: undefined,
    },
  },
  data () {
    return {
      headers: [
        { text: 'Date', sortable: false },
        { text: 'Test', sortable: false },
        { text: 'Doctor', sortable: false },
        { text: 'Price', sortable: false },
        { text: "Reader's Fee", sortable: false },
      ],
      dateFilterOptions: {
        noFuture: true,
      },
    };
  },
  computed: {
    dateFilterModel: syncProp('dateFilter'),
    readerFilterModel: syncProp('readerFilter'),
    testFilterModel: syncProp('testFilter'),
    paginationModel: syncProp('pagination'),
    filterRoles () {
      return this.type === 'laboratory'
        ? PATHOLOGIST_ROLES
        : IMAGING_DOCTOR_ROLES;
    },
    exportFilename () {
      const { start, end } = this.dateFilter;
      const startDate = format(start, 'MMDDYY');
      const endDate = format(end, 'MMDDYY');
      return `Reader's Fee - Report (${startDate}-${endDate})`;
    },
  },
  created () {
    this.exportFormat = item => genericTransform(EXPORT_MAPPINGS, item);
    this.exportHeaders = _.map(EXPORT_MAPPINGS, m => m.to);
    this.xlsxUtils = { ...xlsxUtils };
  },
};
</script>
