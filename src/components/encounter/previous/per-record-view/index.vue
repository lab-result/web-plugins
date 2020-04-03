<template lang="pug">
  div
    v-layout(row wrap justify-end v-if="!hideInternalDate").grey.lighten-3
      v-flex(shrink).pa-2
        date-filter(
          v-model="dateFilter"
          v-bind="dateFilterOptions"
          outline
        )
    v-layout(row v-if="loading")
      v-flex(xs12).pa-2.text-xs-center
        v-progress-circular(indeterminate color="primary")
    template(v-else)
      template(v-for="(group, key) in recordGroup")
        template(v-if="group.records && group.records.length")
          v-toolbar(flat dense v-if="group.records.length > 1")
            v-toolbar-title {{ group.name }}
          v-expansion-panel(
            v-model="group.expand"
            :key="key"
          ).elevation-0
            template(v-for="record in group.records")
              lab-test-order(
                :records="labTestOrders"
                :patient="patient"
                @loadMore="v => loadMore('labTestOrders', 'lab-test-order', null, v)"
                v-if="record.data === 'labTestOrders'"
              )
</template>

<script>
// components
import LabTestOrder from './lab-test-order';
import DateFilter from '../../../commons/date-filter';
// constants
import { PAGINATION_LIMIT } from '../constants';
// utils
import _ from 'lodash';
import { initLogger } from '../../../../utils/logger';
import { getPatient } from '../../../../services/patients';
import { getRecordByType } from '../../../../services/medical-records';

const log = initLogger('PreviousPerRecordView');
const RECORD_TYPES = [
  { data: 'labTestOrders', type: 'lab-test-order', group: 'plan' },
];
const RECORD_GROUPING = [
  {
    name: 'Plan',
    group: 'plan',
    records: RECORD_TYPES.filter(t => t.group === 'plan'),
    expand: [],
  },
];

export default {
  components: {
    LabTestOrder,
  },
  props: {
    hideInternalDate: {
      type: Boolean,
      default: false,
    },
    date: {
      type: Object,
      default: () => {},
    },
    expandOnStart: {
      type: Boolean,
      default: false,
    },
    filteredRecordTypes: {
      type: [Array, Object],
      default: () => null,
    },
  },
  data () {
    const types = RECORD_TYPES.reduce((prev, curr) => {
      prev[curr.data] = { items: [] };
      return prev;
    }, {});
    return {
      ...types,
      loading: false,
      patient: null,
      recordsVisibilityStatus: [],
      dateMenu: null,
      dateFilter: {},
      isInitialLoad: true,
      dateFilterOptions: {
        noFuture: true,
        allowAllOption: true,
      },
      recordGroup: [],
    };
  },
  computed: {
    filteredRecords () {
      return this.filteredRecordTypes && typeof this.filteredRecordTypes === 'object'
        ? [this.filteredRecordTypes]
        : this.filteredRecordTypes;
    },
  },
  watch: {
    dateFilter: {
      handler () {
        if (this.isInitialLoad) return;
        this.init();
      },
      deep: true,
    },
    date: {
      handler () {
        this.dateFilter = this.date;
      },
      deep: true,
    },
  },
  async created () {
    await this.init();
    this.isInitialLoad = false;
  },
  methods: {
    async init () {
      this.mapRecordGroup();
      await this.fetchPatient();
      await this.loadAllRecords();
      this.loading = false;
    },
    mapRecordGroup () {
      this.recordGroup = RECORD_GROUPING
        .map(group => {
          if (this.expandOnStart) group.expand = 0;
          if (this.filteredRecords?.length) {
            group.records = group.records
              .filter(
                rec => this.filteredRecords.some(f => f.type === rec.type && (!f.subtype || f.subtype === rec.subType))
              );
          }
          return group;
        });
    },

    async loadAllRecords () {
      try {
        const recordTypes = RECORD_TYPES
          .filter(type => this.filteredRecords?.length
            ? this.filteredRecords.some(fType => fType.type === type.type && (!fType.subtype || fType.subtype === type.subType))
            : true);

        if (!recordTypes.length) return;
        this.loading = true;
        const results = await Promise.all(
          recordTypes.map(recordType => this.loadRecords(recordType.type, recordType.subtype))
        );
        // FIXME: lint error on forEach
        /* eslint-disable */
        recordTypes.forEach((recordType, i) => {
          this[recordType.data] = results[i];
        });
        /* eslint-enable */
      } catch (error) {
        console.error(error);
        log('loadAllRecords#error');
        this.$enqueueSnack({
          message: error.message,
          color: 'error',
        });
      } finally {
        this.loading = false;
      }
    },
    loadRecords (type, subtype, pagination) {
      const patient = this.$route.params.patient || this.$route.params.id;
      const query = {
        type,
        patient,
        limit: PAGINATION_LIMIT,
        skip: 0,
        dateFilter: this.dateFilter,
      };
      if (pagination) {
        query.limit = pagination.limit;
        query.skip = pagination.skip;
      }
      return getRecordByType(this.$sdk, {
        ...query,
        ...!_.isEmpty(subtype) && { subtype },
      });
    },
    async fetchPatient () {
      try {
        this.loading = true;
        const id = this.$route.params.patient || this.$route.params.id;
        this.patient = await getPatient(this.$sdk, { id });
      } catch (error) {
        console.error(error);
        log('fetchPatient#error');
        this.$enqueueSnack({
          message: error.message,
          color: 'error',
        });
      } finally {
        this.loading = false;
      }
    },
    showRecords (group) {
      this.selectedGroup = group;
      this.showRecordsContainer = true;
    },
    parseRecords (type, subtype) {
      if (!subtype) { return this.allRecords.filter(record => record.type === type); }
      return this.allRecords.filter(record => record.subtype === subtype);
    },
    async loadMore (model, type, subtype, pagination) {
      const items = _.get(this[model], 'items');
      const total = _.get(this[model], 'total');
      const result = await this.loadRecords(type, subtype, { ...pagination, $total: false });
      if (!_.isEmpty(items)) {
        this[model] = {
          ...result,
          total: total,
          items: _.concat(items, result.items),
        };
      } else {
        this[model] = result;
      }
    },
  },
};
</script>
