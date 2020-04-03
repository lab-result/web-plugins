<template lang="pug">
  div
    v-layout(row align-center).mb-2
      v-flex(shrink).px-1
        generic-search(
          v-model="patientFilter"
          :items="patientItems"
          :loading="searchingPatient"
          label="Search by Patient"
          item-value="id"
          solo
          slotted
          no-filter
          @search="onSearchPatients"
        )
          template(slot="selection" slot-scope="props")
            v-chip
              v-avatar
                img(v-if="props.item.picURL" :src="props.item.picURL")
                img(v-else src="@/assets/images/person-placeholder.png")
              | {{props.item.name | prettify-name-first}}
          template(slot="item" slot-scope="props")
            v-list-tile-avatar
              img(v-if="props.item.picURL" :src="props.item.picURL")
              img(v-else src="@/assets/images/person-placeholder.png")
            v-list-tile-content
              v-list-tile-title {{props.item.name | prettify-name-first}}
      v-flex(shrink).px-1
        search-diagnostic-tests(
          v-model="testFilter"
          :type="type"
          label="Search by Test"
          solo
        )
      v-spacer
      v-flex(shrink)
        v-btn(
          color="primary"
          dark
          large
          @click="onItemAdd"
        )
          v-icon mdi-plus
          | Create Order
    generic-table(
      :items="orderTests"
      :headers="headers"
      :loading="loading"
      :pagination.sync="pagination"
      :total-items="orderTestsTotal"
      filterable
      :filter.sync="filter"
      :filter-items="filterItems"
      filter-label="Filter Status"
      :filter-options="filterOptions"
      date-filterable
      :date-filter.sync="dateFilter"
      :date-filter-options="dateFilterOptions"
      exportable
      :export-filename="exportFilename"
      :export-format="exportFormat"
      :export-headers="exportHeaders"
      :xlsx-utils="xlsxUtils"
    )
      template(v-if="useSectionFixtures" slot="middle-action")
        v-flex(xs3).px-1.pt-2
          v-select(
            v-model="section"
            :items="memberSections"
            label="Section"
            item-text="name"
            item-value="name"
            solo
            flat
          )
      tr(
        slot="items"
        slot-scope="props"
        @click="onItemClick(props.item)"
      )
        td {{props.item.createdAt | morph-date('MM/DD/YYYY, hh:mm A')}}
        td {{props.item.specimen}}
        td {{props.item | format-tags}}
        td {{props.item.patient.name | prettifyNameFirst}}
        td {{props.item.test.name}}
        td
          v-layout(full-width column align-center)
            v-chip(:color="getColor(getStatus(props.item))" dark)
              | {{getStatusText(getStatus(props.item))}}

    v-dialog(v-model="addDialog" max-width="1000" lazy persistent)
      diagnostic-order-create(
        :loading="loading"
        :type="type"
        @create="onCreate"
        @close="addDialog = false"
      )
</template>

<script>
// components
import GenericTable from '../commons/generic-table';
import GenericSearch from '../commons/generic-search';
import DiagnosticOrderCreate from './diagnostic-order-create';
import SearchDiagnosticTests from '../common-search/search-diagnostic-tests';
// constants
import {
  TAGS_COLOR_MAP,
  STATUS_QUERY_MAP,
  STATUS_COLOR_MAP,
  ORDER_TEST_STATUSES,
  LIS_ALLOWABLE_ROLES,
  RIS_ALLOWABLE_ROLES,
} from './constants';
import { DEFAULT_PAGINATION_VALUE } from '../../constants/tables';
// utils
import _ from 'lodash';
import { format } from 'date-fns';
import * as xlsxUtils from '../../utils/xlsx';
import { initLogger } from '../../utils/logger';
import { syncVuexState } from '../../utils/vue';
import { genericTransform } from '../../utils/obj';
import { permitRoles } from '../../utils/permissions';
import { prettifyNameFirst } from '../../utils/string';

const log = initLogger('DiagnosticOrderTests');

const TYPE_CONFIG_KEY_MAP = {
  laboratory: 'configLIS',
  radiology: 'configRIS',
};
const TYPE_ROLES_MAP = {
  laboratory: LIS_ALLOWABLE_ROLES,
  radiology: RIS_ALLOWABLE_ROLES,
};
const EXPORT_MAPPINGS = [
  {
    from: 'createdAt',
    to: 'Requested At',
    format: date => format(date, 'MM/DD/YY, hh:mm A'),
  },
  { from: 'specimen', to: 'Control ID' },
  { from: 'patient.tags', to: 'Tags', format: tags => _.join(tags, ', ') },
  { from: 'patient.name', to: 'Patient', format: prettifyNameFirst },
  { from: 'test.name', to: 'Test' },
  {
    from: 'status',
    to: 'Status',
    provideSource: true,
    format: (status, orderTest) => {
      const {
        completedAt,
        verifiedAt,
        finalizedAt,
        sentOutAt,
        cancelledAt,
      } = orderTest;

      if (cancelledAt) return 'Cancelled';
      if (sentOutAt && !completedAt && !finalizedAt) return 'Sent Out';
      if (!completedAt) return 'Pending';
      if (!verifiedAt) return 'Completed';
      if (!finalizedAt) return 'Verified';
      return 'Finalized';
    },
  },
];

export default {
  components: {
    GenericTable,
    GenericSearch,
    DiagnosticOrderCreate,
    SearchDiagnosticTests,
  },
  filters: {
    formatTags (item) {
      if (_.get(item, 'patient.tags')) {
        const formatted = item.patient.tags;
        return formatted.join(', ');
      }
      return '';
    },
  },
  props: {
    type: {
      type: String,
      default: undefined,
    },
    toRoute: {
      type: Object,
      default: undefined,
    },
    addable: {
      type: Boolean,
      default: false,
    },
  },
  data () {
    return {
      loading: false,
      searchingPatient: false,
      addDialog: false,
      filterOptions: {
        itemText: 'name',
        returnObject: true,
      },
      dateFilterOptions: {
        noFuture: true,
        allowAllOption: true,
      },
      patients: [],
      headers: [
        {
          text: 'Requested At',
          align: 'left',
          sortable: false,
        },
        {
          text: this.type === 'laboratory' ? 'Specimen ID' : 'Control ID',
          align: 'left',
          sortable: false,
        },
        {
          text: 'Tags',
          align: 'left',
          sortable: false,
        },
        {
          text: 'Patient',
          align: 'left',
          sortable: false,
        },
        {
          text: 'Test',
          align: 'left',
          sortable: false,
        },
        {
          text: 'Status',
          align: 'center',
          sortable: false,
        },
      ],
      debouncedFetch: _.debounce(this.fetchOrderTests, 1000),
      isInitialLoad: true,
    };
  },
  computed: {
    orderTestType () {
      return this.type === 'laboratory' ? 'Lab' : 'Imaging';
    },
    medicalTestOrderType () {
      switch (this.type) {
        case 'laboratory': return 'lab-test-order';
        case 'radiology': return 'imaging-test-order';
        default: return null;
      }
    },
    filter: {
      get () {
        return _.get(this.$store.state.table, `diagnosticOrderTests${this.orderTestType}StatusFilter`);
      },
      set (value) {
        return this.$store.commit(`table/setDiagnosticOrderTests${this.orderTestType}StatusFilter`, value);
      },
    },
    dateFilter: {
      get () {
        return _.get(this.$store.state.table, `diagnosticOrderTests${this.orderTestType}DateFilter`);
      },
      set (value) {
        return this.$store.commit(`table/setDiagnosticOrderTests${this.orderTestType}DateFilter`, value);
      },
    },
    patientFilter: {
      get () {
        return _.get(this.$store.state.table, `diagnosticOrderTests${this.orderTestType}PatientFilter`);
      },
      set (value) {
        return this.$store.commit(`table/setDiagnosticOrderTests${this.orderTestType}PatientFilter`, value);
      },
    },
    testFilter: {
      get () {
        return _.get(this.$store.state.table, `diagnosticOrderTests${this.orderTestType}TestFilter`);
      },
      set (value) {
        return this.$store.commit(`table/setDiagnosticOrderTests${this.orderTestType}TestFilter`, value);
      },
    },
    pagination: {
      get () {
        return _.get(this.$store.state.table, `diagnosticOrderTests${this.orderTestType}Pagination`);
      },
      set (value) {
        const currentPaginationValue = _.get(this.$store.state.table,
          `diagnosticOrderTests${this.orderTestType}Pagination`);
        if (
          this.isInitialLoad &&
          currentPaginationValue !== DEFAULT_PAGINATION_VALUE
        ) {
          value = currentPaginationValue;
        }
        this.$store.commit(`table/setDiagnosticOrderTests${this.orderTestType}Pagination`, value);
      },
    },
    section: syncVuexState('table', 'diagnosticOrderTestsSectionFilter'),
    organization () {
      return this.$activeOrganization || {};
    },
    languagesConfig () {
      return _.get(this.organization, 'configFacility.languages') || {};
    },
    baseFilterItems () {
      return _.map(
        ORDER_TEST_STATUSES,
        status => ({
          ...status,
          name: _.get(this.languagesConfig, status.languageSetting) || status.name,
        })
      );
    },
    useSectionFixtures () {
      const configKey = _.get(TYPE_CONFIG_KEY_MAP, this.type);
      if (!configKey) return;
      return _.get(this.organization, [configKey, 'useSectionFixtures']);
    },
    memberSections () {
      log('memberSections#$activeMembership', this.$activeMembership);
      return _.get(this.$activeMembership, 'diagnosticSections');
    },
    patientItems () {
      return _.filter(_.unionBy([this.patientFilter], this.patients, 'id'), Boolean);
    },
    allowableRoles () {
      return _.get(TYPE_ROLES_MAP, this.type);
    },
    isPrivileged () {
      return permitRoles(this.$activeMembership, this.allowableRoles);
    },
    filterItems () {
      return this.isPrivileged
        ? this.baseFilterItems
        : _.filter(
          this.baseFilterItems,
          s => s.status === 'finalized' || s.status === 'sent-out'
        );
    },
    orderTests () {
      return this.$store.state.diagnostic.orderTests;
    },
    orderTestsTotal () {
      return this.$store.state.diagnostic.orderTestsTotal;
    },
    exportFilename () {
      const { start, end } = this.dateFilter;
      const startDate = format(start, 'MMDDYY');
      const endDate = format(end, 'MMDDYY');
      const title = _.startCase(this.type);
      return `${title} - Worklist (${startDate}-${endDate})`;
    },
  },
  watch: {
    filter () {
      if (this.isInitialLoad) return;
      this.pagination.page = 1;
      this.fetchOrderTests();
    },
    section () {
      if (this.isInitialLoad) return;
      this.pagination.page = 1;
      this.fetchOrderTests();
    },
    dateFilter: {
      handler () {
        if (this.isInitialLoad) return;
        this.pagination.page = 1;
        this.fetchOrderTests();
      },
      deep: true,
    },
    patientFilter () {
      if (this.isInitialLoad) return;
      this.pagination.page = 1;
      this.fetchOrderTests();
    },
    testFilter () {
      if (this.isInitialLoad) return;
      this.pagination.page = 1;
      this.fetchOrderTests();
    },
    pagination: {
      async handler () {
        // default section filter
        if (this.useSectionFixtures && _.isEmpty(this.section)) {
          this.section = _.head(this.memberSections);
        }
        await this.fetchOrderTests();
        this.isInitialLoad = false;
      },
      deep: true,
      immediate: true,
    },
  },
  created () {
    this.exportFormat = item => genericTransform(EXPORT_MAPPINGS, item);
    this.exportHeaders = _.map(EXPORT_MAPPINGS, m => m.to);
    this.xlsxUtils = { ...xlsxUtils };
  },
  mounted () {
    this.init();
  },
  methods: {
    async init () {
      await this.onSearchPatients();
    },
    async fetchOrderTests () {
      if (this.useSectionFixtures && _.isEmpty(this.section)) {
        this.$store.dispatch('diagnostic/clearOrderTests');
        return;
      }

      this.loading = true;
      try {
        // add status filter logic
        log('fetchOrderTests#filter: %O', this.filter);
        const status = _.get(this.filter, 'status');
        const queryOpts = STATUS_QUERY_MAP[status] || {};

        // add section filter logic
        log('fetchOrderTests#useSectionFixtures: %O', this.useSectionFixtures);
        log('fetchOrderTests#section: %O', this.section);

        // add date filter logic
        log('fetchOrderTests#dateFilter: %O', this.dateFilter);
        // if (_.isEmpty(this.dateFilter)) return;
        const { start, end } = this.dateFilter;

        // add patient filter logic
        log('fetchOrderTests#patientFilter: %O', this.patientFilter);
        const patient = _.get(this.patientFilter, 'id');

        // add test filter logic
        log('fetchOrderTests#testFilter: %O', this.testFilter);
        const test = _.get(this.testFilter, 'id');

        // add pagination logic
        log('fetchOrderTests#pagination: %O', this.pagination);
        const { page, rowsPerPage } = this.pagination;

        const payload = {
          facility: this.$activeOrganization.id,
          type: this.type,
          patient,
          test,
          queryOpts,
          startDate: start,
          endDate: end,
          pageNo: page,
          pageSize: rowsPerPage,
        };
        if (this.useSectionFixtures) payload.section = this.section;
        log('fetchOrderTests#payload: %O', payload);
        await this.$store.dispatch('diagnostic/getOrderTests', payload);
      } catch (error) {
        log('fetchOrderTests#error: %O', error);
        await this.$enqueueSnack({
          color: 'error',
          message: error.message,
        });
      }
      this.loading = false;
    },
    async onSearchPatients (searchString) {
      log(`onSearchPatients#searchString: ${searchString}`);
      this.searchingPatient = true;
      const configInsurer = _.get(this.$activeOrganization, 'configInsurer.insurer');
      try {
        const parent = _.get(this.$activeOrganization, 'parent.id') ||
          _.get(this.$activeOrganization, 'parent');
        const includeOrganizationChildren = !!parent ||
          !_.isEmpty(this.$activeOrganization._ch);
        const organization = parent || this.$activeOrganization.id;
        this.patients = await this.$store.dispatch('patientsv5/getPatients', {
          organization,
          includeOrganizationChildren,
          searchString,
          configInsurer,
          limit: 20,
        });
        log('onSearchPatients#patients: %O', this.patients);
      } catch (error) {
        log('onSearchPatients#error: %O', error);
        this.$enqueueSnack({
          message: error.message,
          color: 'error',
        });
      }
      this.searchingPatient = false;
    },
    getTag (tag) {
      if (tag === 'VIP') {
        return 'vip';
      } else if (tag === 'Senior Citizen') {
        return 'seniorCitizen';
      }
    },
    getStatus (orderTest) {
      const {
        completedAt,
        verifiedAt,
        finalizedAt,
        sentOutAt,
        cancelledAt,
      } = orderTest;

      if (cancelledAt) return 'cancelled';
      if (sentOutAt && !completedAt && !finalizedAt) return 'sent-out';
      if (!completedAt) return 'pending';
      if (!verifiedAt) return 'completed';
      if (!finalizedAt) return 'verified';
      return 'finalized';
    },
    getStatusText (status) {
      const i = this.baseFilterItems.findIndex(x => x.status === status);
      return i > -1 ? this.baseFilterItems[i].name : _.startCase(status);
    },
    getColor (status) {
      return STATUS_COLOR_MAP[status];
    },
    getTagColor (tag) {
      return TAGS_COLOR_MAP[tag];
    },
    onItemClick (orderTest) {
      this.$router.push({ ...this.toRoute, params: { id: orderTest.id } });
    },
    onItemAdd () {
      this.addDialog = true;
    },
    async onCreate ({ patient, email, order, diagnosticTests }) {
      log('onCreate#patient: %O', patient);
      log('onCreate#diagnosticTests: %O', diagnosticTests);
      this.loading = true;
      try {
        // create patient if uncreated
        if (!patient?.id) {
          patient = await this.$sdk.service('medical-patients').create(patient);
          if (email) {
            // create invitation as well
            await this.$sdk.service('account-invitations').create({
              email,
              type: 'patient',
              patient: patient?.id,
            });
          }
        }
        // create medical test order
        const medicalTestOrderPayload = {
          type: this.medicalTestOrderType,
          patient: patient?.id,
          facility: this.$activeOrganization?.id,
          tests: diagnosticTests?.map(test => ({
            id: test.id,
            name: test.name,
          })),
        };
        const medicalTestOrder = await this.$sdk.service('medical-records')
          .create(medicalTestOrderPayload);
        // create diagnostic order
        const diagnosticOrderPayload = {
          ...order,
          type: this.type,
          patient: patient?.id,
          order: medicalTestOrder?.id,
          facility: this.$activeOrganization?.id,
          tests: diagnosticTests?.map(test => test.id),
        };
        const diagnosticOrder = await this.$sdk.service('diagnostic-orders')
          .create(diagnosticOrderPayload);
        // confirm diagnostic order tests
        await this.$sdk.service('diagnostic-order-tests')
          .update({ order: diagnosticOrder.id }, { $confirm: true });
        // UI feedback
        this.addDialog = false;
        await this.fetchOrderTests();
        this.$enqueueSnack({
          message: 'Order successfully created!',
          color: 'success',
        });
      } catch (error) {
        log('onCreate#error: %O', error);
        this.$enqueueSnack({
          message: error.message || 'An unknown error occured. Please try again',
          color: 'error',
        });
      }
      this.loading = false;
    },
  },
};
</script>

<style scoped>
  tr:hover {
    cursor: pointer !important;
  }
</style>
