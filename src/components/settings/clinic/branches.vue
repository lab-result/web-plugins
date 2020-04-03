<template lang="pug">
  div
    h1 Manage Branches
    p Set up all branches that your clinic conduct business from. Billing and shipping, as well as stock locations.
    v-card
      generic-table(
        :headers="headers"
        :items="branches"
        :loading="loading"
        :pagination.sync="pagination"
        :total-items="totalItems"
        flat
        searchable
        :search-text.sync="searchText"
        search-label="Search by Name"
      )
        tr(slot="items" slot-scope="props" @click="updateBranch(props.item)").generic-table-tr
          td {{props.item.name}}
          td {{props.item | get-address | morph-truncate(50)}}
</template>

<script>
// computed
import GenericTable from '../../commons/generic-table';
// constants
import { DEFAULT_PAGINATION_VALUE } from '../../../constants/tables';
// utils
import { isEmpty, debounce } from 'lodash';
import { initLogger } from '../../../utils/logger';
import { syncVuexState } from '../../../utils/vue';
import { prettifyAddress } from '../../../utils/string';

export const COMPONENT_NAME = 'SettingsClinicBranches';
const log = initLogger(COMPONENT_NAME);

export default {
  components: {
    GenericTable,
  },
  filters: {
    getAddress (clinic) {
      const { address } = clinic;
      if (isEmpty(address)) {
        return '-';
      }
      return prettifyAddress(address);
    },
  },
  data () {
    return {
      clinicType: null,
      loading: false,
      dialog: false,
      headers: [
        {
          text: 'BRANCH NAME',
          value: 'name',
          sortable: false,
        },
        {
          text: 'BRANCH ADDRESS',
          value: 'address',
          sortable: false,
        },
      ],
      selectedClinic: {},
      debouncedInit: debounce(this.init, 250),
      branches: [],
      totalItems: 0,
      isInitialLoad: true,
    };
  },
  computed: {
    pagination: {
      get () {
        return this.$store.state.table.settingsClinicBranchesPagination;
      },
      set (value) {
        const currentPaginationValue = this.$store.state.table.settingsClinicBranchesPagination;
        if (
          this.isInitialLoad &&
          currentPaginationValue !== DEFAULT_PAGINATION_VALUE
        ) {
          value = currentPaginationValue;
        }
        this.$store.commit('table/setSettingsClinicBranchesPagination', value);
      },
    },
    searchText: syncVuexState('table', 'settingsClinicBranchesSearchText'),
  },
  watch: {
    pagination: {
      async handler () {
        await this.init();
        this.isInitialLoad = false;
      },
      deep: true,
      immediate: true,
    },
    searchText () {
      if (this.isInitialLoad) return;
      this.pagination.page = 1;
      this.debouncedInit();
    },
  },
  methods: {
    async init () {
      try {
        this.loading = true;

        const { rowsPerPage, page } = this.pagination;
        const query = {};
        switch (this.$activeOrganization.type) {
          case 'personal-clinic': {
            query.createdBy = this.$activeOrganization.createdBy;
            break;
          }
          case 'cms': {
            query.parent = this.$activeOrganization.id;
            break;
          }
        }

        // configure search
        if (typeof this.searchText === 'string' && this.searchText) {
          query.name = {
            $regex: `^${this.searchText}`,
            $options: 'i',
          };
        }

        // configure pagination
        query.$limit = rowsPerPage || 20;
        query.$skip = query.$limit * ((page || 1) - 1);

        // execute ops
        const result = await this.$sdk.service('organizations').find(query);
        this.totalItems = result.total;
        this.branches = result.items;
      } catch (error) {
        log('init#error');
        console.error(error);
        this.$enqueueSnack({
          color: 'error',
          message: error.message || 'Something went wrong! Please try again.',
        });
      } finally {
        this.loading = false;
      }
    },
    updateBranch (clinic) {
      this.$router.push({
        name: 'settings-clinic-update-branches',
        params: {
          selectedClinic: clinic,
        },
      });
    },
  },
};
</script>

<style scoped>
  .generic-table-tr:hover {
    cursor: pointer;
  }
</style>
