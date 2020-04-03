<template lang="pug">
  div
    h1 History
    v-card.mt-3
      generic-table(
        :headers="headers"
        :items="items"
        :total-items="totalHistoryItems"
        :loading="loading"
        flat
        filterable
        :filter.sync="historyType"
        :filter-items="historyTypes"
        filter-label="By Action"
        searchable
        date-filterable
        :date-filter.sync="dateFilter"
        search-label="Search name"
        :pagination.sync="pagination"
      )
        template(slot="search")
          org-members-search(
            v-model="staffFilter"
            solo
            flat
          )
        tr(slot="items" slot-scope="props")
          td(v-bind="getColor(props.item.action)") {{ props.item.action | filter-action }}
          td {{ props.item | filter-name }}
          td
            v-btn(
              @click="showRecord(props.item)"
              small
              outline
              color="primary"
            ).text-none {{props.item | filter-type}}
          td {{ props.item | filter-created-at | morph-date('MMM. DD, YYYY - hh:mm A') }}

    record-preview(
      :dialog="previewDialog"
      :activity-log="selectedActivityLog"
      :record="selectedRecord"
      :patient="patient"
      @close="previewDialog = $event"
    )
</template>

<script>
// components
import RecordPreview from './history-record-preview';
import GenericTable from '../../commons/generic-table';
import OrgMembersSearch from '../../org/org-members-search';
// constants
import { DEFAULT_PAGINATION_VALUE } from '../../../constants/tables';
// utils
import { isEmpty, startCase } from 'lodash';
import { initLogger } from '../../../utils/logger';
import { syncVuexState } from '../../../utils/vue';
import { prettifyName } from '../../../utils/string';
import { getPatient } from '../../../services/patients';

const log = initLogger('SettingsClinicHistory');

export default {
  filters: {
    filterAction (str) {
      if (str === 'create') return 'Create';
      if (str === 'patch') return 'Update';
      if (str === 'remove') return 'Delete';
    },
    filterName (item) {
      const name = item?._account?.name;
      if (isEmpty(name)) return '-';
      return prettifyName(name);
    },
    filterType (item) {
      const { record } = item;
      if (isEmpty(record)) return '-';
      return startCase(record.type);
    },
    filterCreatedAt (item) {
      return item.createdAt;
    },
  },
  components: {
    RecordPreview,
    GenericTable,
    OrgMembersSearch,
  },
  data () {
    return {
      loading: false,
      previewDialog: false,
      selectedActivityLog: {},
      patient: null,
      items: [],
      totalHistoryItems: 0,
      historyTypes: [
        { text: 'All', value: '' },
        { text: 'Create', value: 'create' },
        { text: 'Update', value: 'patch' },
        { text: 'Delete', value: 'remove' },
      ],
      headers: [
        {
          text: 'Action',
          value: 'action',
          sortable: false,
        },
        {
          text: 'User',
          value: 'user',
          sortable: false,
        },
        {
          text: 'Record',
          value: 'record',
          sortable: false,
        },
        {
          text: 'Date',
          value: 'date',
          sortable: false,
        },
      ],
      isInitialLoad: true,
    };
  },
  computed: {
    selectedRecord () {
      const { record, patient, template } = this.selectedActivityLog;
      return { ...record, patient, $populated: { template } };
    },
    selectedRecordPatientId () {
      return this.selectedRecord?.patient?.id;
    },
    pagination: {
      get () {
        return this.$store.state.table.settingsClinicHistoryPagination;
      },
      set (value) {
        const currentPaginationValue = this.$store.state.table.settingsClinicHistoryPagination;
        if (
          this.isInitialLoad &&
          currentPaginationValue !== DEFAULT_PAGINATION_VALUE
        ) {
          value = currentPaginationValue;
        }
        this.$store.commit('table/setSettingsClinicHistoryPagination', value);
      },
    },
    dateFilter: syncVuexState('table', 'settingsClinicHistoryDateFilter'),
    staffFilter: syncVuexState('table', 'settingsClinicHistoryStaffFilter'),
    historyType: syncVuexState('table', 'settingsClinicHistoryActionFilter'),
  },
  watch: {
    pagination: {
      async handler () {
        await this.fetchHistory();
        this.isInitialLoad = false;
      },
      deep: true,
      immediate: true,
    },
    staffFilter () {
      if (this.isInitialLoad) return;
      this.pagination.page = 1;
      this.fetchHistory();
    },
    historyType () {
      if (this.isInitialLoad) return;
      this.pagination.page = 1;
      this.fetchHistory();
    },
    dateFilter () {
      if (this.isInitialLoad) return;
      this.pagination.page = 1;
      this.fetchHistory();
    },
    selectedRecordPatientId () {
      this.fetchPatient();
    },
  },
  methods: {
    async fetchHistory () {
      try {
        this.loading = true;
        const { page, rowsPerPage } = this.pagination;

        if (isEmpty(this.pagination)) return;
        if (isEmpty(this.dateFilter)) return;

        await this.$store.dispatch('activity-logs/getActivityLogs', {
          facility: this.$activeOrganization.id,
          account: this.staffFilter && this.staffFilter.uid,
          action: this.historyType,
          ...!isEmpty(this.dateFilter) && {
            startAt: this.dateFilter.start,
            endAt: this.dateFilter.end,
          },
          limit: rowsPerPage,
          skip: page,
        });
        const items = this.$store.state['activity-logs'].logs;
        const total = this.$store.state['activity-logs'].logsTotal;
        this.items = items;
        this.totalHistoryItems = total;
        log('fetchHistory#items: %O', this.items);
        log('fetchHistory#totalHistoryItems: %O', this.totalHistoryItems);
      } catch (error) {
        log('fetchHistory#error');
        console.error(error);
        this.$enqueueSnack({
          message: error.message || 'There was an error. Please try again later.',
          color: 'error',
        });
      } finally {
        this.loading = false;
      }
    },
    async fetchPatient () {
      try {
        this.patient = await getPatient(this.$sdk, {
          id: this.selectedRecordPatientId,
        });
        log('fetchPatient#patient: %O', this.patient);
      } catch (error) {
        log('fetchPatient#error');
        console.error(error);
        this.$enqueueSnack({
          message: error.message,
          color: 'error',
        });
      }
    },
    getColor (str) {
      let cssClass = 'success--text';
      if (str === 'create') cssClass = 'success--text';
      if (str === 'patch') cssClass = 'warning--text';
      if (str === 'remove') cssClass = 'error--text';
      return {
        class: cssClass,
      };
    },
    showRecord (item) {
      this.selectedActivityLog = item;
      this.previewDialog = true;
    },
  },
};
</script>
