<template lang="pug">
  generic-table(
    :items="orders"
    :headers="headers"
    :loading="loading"
    :pagination.sync="pagination"
    :total-items="ordersTotal"
    searchable
    search-label="Search Patients"
  )
    template(#search)
      search-patients(
        v-model="searchText"
        chips
        single-line
        hide-details
        solo
        flat
        clearable
      )
    tr(
      slot="items"
      slot-scope="props"
      @click="onOrderClick(props.item)"
    )
      td {{props.item.createdAt | morph-date('MM/DD/YYYY, hh:mm A')}}
      td {{props.item.patient.name | prettifyNameFirst}}
      td {{getTestsDescription(props.item.tests)}}
</template>

<script>
// components
import GenericTable from '../commons/generic-table';
import SearchPatients from '../common-search/search-patients';
// constants
// utils
import { debounce } from 'lodash';
import { initLogger } from '../../utils/logger';
import { syncVuexState } from '../../utils/vue';
import { DEFAULT_PAGINATION_VALUE } from '../../constants/tables';

const log = initLogger('DiagnosticOrders');

export default {
  components: {
    GenericTable,
    SearchPatients,
  },
  props: {
    type: {
      type: String,
      default: undefined,
    },
  },
  data () {
    return {
      loading: false,
      headers: [
        {
          text: 'Requested At',
          align: 'left',
          sortable: false,
        },
        {
          text: 'Patient',
          align: 'left',
          sortable: false,
        },
        {
          text: 'Tests',
          align: 'left',
          sortable: false,
        },
      ],
      debouncedFetch: debounce(this.fetchOrders, 1000),
      isInitialLoad: true,
    };
  },
  computed: {
    orders () {
      return this.$store.state.diagnostic.orders;
    },
    ordersTotal () {
      return this.$store.state.diagnostic.ordersTotal;
    },
    pagination: {
      get () {
        return this.$store.state.table.diagnosticPrintLabOrderPagination;
      },
      set (value) {
        const currentPaginationValue = this.$store.state.table.diagnosticPrintLabOrderPagination;
        if (
          this.isInitialLoad &&
          currentPaginationValue !== DEFAULT_PAGINATION_VALUE
        ) {
          value = currentPaginationValue;
        }
        this.$store.commit('table/setDiagnosticPrintLabOrderPagination', value);
      },
    },
    searchText: syncVuexState('table', 'diagnosticPrintLabOrderPatientFilter'),
  },
  watch: {
    searchText () {
      if (this.isInitialLoad) return;
      this.pagination.page = 1;
      this.debouncedFetch();
    },
    pagination: {
      async handler () {
        await this.fetchOrders();
        this.isInitialLoad = false;
      },
      deep: true,
      immediate: true,
    },
  },
  methods: {
    async fetchOrders () {
      try {
        this.loading = true;

        // add search logic
        log(`fetchOrders#searchText: ${this.searchText}`);
        const searchText = this.searchText;

        // add pagination logic
        log('fetchOrders#pagination: %O', this.pagination);
        const { page, rowsPerPage } = this.pagination;
        const query = {
          facility: this.$activeOrganization.id,
          type: this.type,
          queryOpts: {
            // FIXME: statuses should also be in `diagnostic-orders`
            // in order to filter them without using $prequery
            $prequery: [
              {
                service: 'diagnostic-order-tests',
                query: {
                  facility: this.$activeOrganization.id,
                  type: this.type,
                  cancelledAt: { $exists: false },
                  completedAt: { $exists: true },
                  verifiedAt: { $exists: true },
                  finalizedAt: { $exists: true },
                  sentOutAt: { $exists: false },
                },
                extractKey: 'order',
                resKey: 'id',
                resOps: '$in',
              },
            ],
          },
          pageNo: page,
          pageSize: rowsPerPage,
        };

        if (searchText) {
          query.queryOpts.patient = searchText;
          query.queryOpts.$prequery[0].query.patient = searchText;
        }

        await this.$store.dispatch('diagnostic/getOrders', query);
      } catch (error) {
        console.error(error);
        log('init#error');
        this.$enqueueSnack({
          message: error.message,
          color: 'error',
        });
      } finally {
        this.loading = false;
      }
    },
    getTestsDescription (tests) {
      return tests?.map(t => t.test.name)?.join(', ');
    },
    onOrderClick (order) {
      this.$router.push({
        name: 'lis-print-order',
        params: { id: order.id },
      });
    },
  },
};
</script>

<style scoped>
  tr:hover {
    cursor: pointer !important;
  }
</style>
