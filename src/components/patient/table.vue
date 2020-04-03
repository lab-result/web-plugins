<template lang="pug">
  generic-table(
    :items="patients"
    :headers="headers"
    :loading="loading"
    :pagination.sync="pagination"
    :total-items="patientsTotal"
    filterable
    :filter.sync="filterType"
    :filter-items="filterTypes"
    filter-label="Filter Type"
    :filter-options="filterOptions"
    searchable
    :search-text.sync="search"
    addable
    add-label="Create new patient"
    @add="onAdd"
    importable
    import-template-link="/attach/import-patients-template.xlsx"
    :import-headers="importHeaders"
    :xlsx-utils="xlsxUtils"
    @import="onImportData"
  )
    tr(slot="items" slot-scope="props" @click="gotoProfile(props.item)")
      td(width="40").pt-1
        //- v-avatar(:size="40").mr-2
        img(width="40" :src="props.item.picURL" v-if="props.item.picURL")
        img(width="40" src="@/assets/images/person-placeholder.png" v-else)
      td {{ props.item.name | prettify-name }}
      td #[span(v-if="props.item.sex") {{ props.item.sex.substr(0,1) | morph-capitalize }}]
      td #[span(v-if="props.item.dateOfBirth") {{ props.item.dateOfBirth | morph-date('MMM DD, YYYY') }}]
      td #[span(v-if="props.item.lastVisitAt") {{ props.item.lastVisitAt | morph-date('MMM DD, YYYY') }}]
      td
        span(v-if="props.item.personalDetails && props.item.personalDetails.hmos")
          | {{ props.item.personalDetails.hmos | format-insurance }}
      td
        span(v-if="props.item.personalDetails && props.item.personalDetails.tags")
          | {{ props.item.personalDetails.tags | format-tags }}
      td #[span(v-if="props.item.branch") {{ props.item.branch }}]
</template>

<script>
// components
import GenericTable from '../commons/generic-table';
// constants
import {
  FILTER_QUERY_BUILDER_MAP,
  IMPORT_HEADERS,
  IMPORT_PATIENT_MAPPINGS,
} from './constants';
// utils
import _ from 'lodash';
import * as xlsxUtils from '../../utils/xlsx';
import { initLogger } from '../../utils/logger';
import { syncVuexState } from '../../utils/vue';
import { genericTransform } from '../../utils/obj';
import { getPatients } from '../../services/patients';
import { mapPagination } from '../../utils/ui-store-mapping';
import { DEFAULT_PAGINATION_VALUE } from '../../constants/tables';

const log = initLogger('PatientTable');

export default {
  components: { GenericTable },
  filters: {
    formatInsurance (hmos) {
      return hmos?.map(hmo => hmo.name)?.join(', ');
    },
    formatTags (tags) {
      return tags?.join(', ');
    },
  },
  props: {
    readOnly: {
      type: Boolean,
      default: undefined,
    },
    patientRoute: {
      type: Object,
      default: () => ({
        name: 'patient-profile',
      }),
    },
  },
  data () {
    return {
      loading: false,
      filterOptions: {
        itemText: 'name',
        returnObject: true,
      },
      headers: [
        {
          sortable: false,
        },
        {
          text: 'Name',
          align: 'left',
          value: 'name',
          sortable: false,
        },
        {
          text: 'Sex',
          align: 'left',
          value: 'sex',
          sortable: false,
        },
        {
          text: 'Birthday',
          align: 'left',
          value: 'dateOfBirth',
          sortable: false,
        },
        {
          text: 'Last Visit',
          align: 'left',
          value: 'lastVisitAt',
          sortable: false,
        },
        {
          text: 'Insurance',
          align: 'left',
          value: 'insuranceCards',
          sortable: false,
        },
        {
          text: 'Tags',
          align: 'left',
          value: 'tags',
          sortable: false,
        },
        {
          text: 'Branch',
          align: 'left',
          value: 'branch',
          sortable: false,
        },
      ],
      importHeaders: IMPORT_HEADERS,
      debouncedFetch: _.debounce(this.fetchPatients, 500),
      isInitialLoad: true,
      patients: [],
      patientsTotal: 0,
    };
  },
  computed: {
    currentUser () {
      return this.$store.state.auth.currentUser;
    },
    searchIcon () {
      return _.isEmpty(this.search) ? 'mdi-magnify' : null;
    },
    tags () {
      const defaultTags = ['VIP', 'Senior Citizen'];
      return (this.$activeOrganization.tags || [])?.concat(defaultTags);
    },
    filterTypes () {
      const defaultFilterTypes = [
        { name: 'All', type: 'all' },
        { name: 'Male', type: 'male' },
        { name: 'Female', type: 'female' },
      ];
      const tagFilterTypes = this.tags.map(tag => ({
        name: tag,
        type: 'tag',
        meta: { tag },
      }));

      return defaultFilterTypes?.concat(tagFilterTypes);
    },
    pagination: {
      get () {
        return this.$store.state.table.patientTablePagination;
      },
      set (value) {
        const currentPaginationValue = this.$store.state.table.patientTablePagination;
        if (
          this.isInitialLoad &&
          currentPaginationValue !== DEFAULT_PAGINATION_VALUE
        ) {
          value = currentPaginationValue;
        }
        this.$store.commit('table/setPatientTablePagination', value);
      },
    },
    search: syncVuexState('table', 'patientTableSearch'),
    filterType: syncVuexState('table', 'patientTableTypeFilter'),
  },
  watch: {
    filterType () {
      if (this.isInitialLoad) return;
      this.pagination.page = 1;
      this.fetchPatients();
    },
    search () {
      if (this.isInitialLoad) return;
      this.pagination.page = 1;
      this.debouncedFetch();
    },
    pagination: {
      async handler () {
        await this.fetchPatients();
        this.isInitialLoad = false;
      },
      deep: true,
      immediate: true,
    },
  },
  created () {
    this.xlsxUtils = { ...xlsxUtils };
  },
  methods: {
    async fetchPatients () {
      log(`fetchPatients#searchText: ${this.search}`);
      log('fetchPatients#pagination: %O', this.pagination);
      if (_.isEmpty(this.pagination)) return;

      this.loading = true;
      try {
        // add filter logic
        log('fetchPatients#filterType: %O', this.filterType);
        let filterQuery = {};
        if (this.filterType) {
          const { type, meta } = this.filterType;
          filterQuery = FILTER_QUERY_BUILDER_MAP[type](meta);
        }
        log('fetchPatients#filterQuery: %O', filterQuery);

        const configInsurer = this.$activeOrganization?.configInsurer?.insurer;

        const { items, total } = await getPatients(this.$sdk, {
          ...filterQuery,
          facility: this.$activeOrganization,
          uid: this.currentUser.uid,
          searchText: this.search,
          configInsurer,
          ...mapPagination(this.pagination),
        });

        this.patients = items;
        this.patientsTotal = total;
      } catch (error) {
        console.error(error);
        log('fetchPatients#error');
        this.$enqueueSnack({
          message: error.message,
          color: 'error',
        });
      } finally {
        this.loading = false;
      }
    },
    onAdd () {
      this.$router.push({
        name: 'create-patient',
        params: { action: 'create' },
      });
    },
    async onImportData (data) {
      try {
        this.loading = true;

        log('onImportData#data: %O', data);
        const patientData = data?.map(d => genericTransform(IMPORT_PATIENT_MAPPINGS, d));
        log('onImportData#patientData: %O', patientData);
        const createData = patientData?.map(patient => ({
          facility: this.$activeOrganization.id,
          personalDetails: patient,
        }));
        await this.$sdk.service('medical-patients').create(createData);
        await this.fetchPatients();
        this.$enqueueSnack({ message: 'Import successful!', color: 'success' });
      } catch (error) {
        console.error(error);
        log('onImportData#error');
        this.$enqueueSnack({
          message: error.message || 'Something went wrong during import. Try again.',
          color: 'error',
        });
      } finally {
        this.loading = false;
      }
    },
    gotoProfile (patient) {
      if (!this.readOnly) {
        this.$router.push({
          ...this.patientRoute,
          params: { patient: patient.id, id: patient.id },
        });
      }
    },
  },
};
</script>

<style scoped>
  tr:hover {
    cursor: pointer;
  }

  tbody tr:nth-of-type(odd) {
    background-color: rgba(0, 0, 0, .03);
  }
</style>
