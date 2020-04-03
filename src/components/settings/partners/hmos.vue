<template lang="pug">
  div
    h1 Manage Accredited HMOs
    p Add list of accredited HMOs
    v-card
      generic-table(
        flat
        searchable
        slotted-footer
        add-label="Add HMO"
        :headers="headers"
        :items="accreditedHmos"
        :loading="loading"
        :addable="addable"
        :total-items="totalItems"
        :pagination.sync="pagination"
        :search-text.sync="search"
        @add="showCreateRow"
      )
        tr(slot="items" slot-scope="props")
          td {{ props.item.insurerName }}
          td {{ props.item.id }}
          td.justify-end.layout.px-0
            v-btn(icon @click="deleteDialog=true; deleteHMO = props.item")
              v-icon(small).error--text mdi-trash-can-outline
        tr(slot="footer" v-if="createRow")
          td(colspan="2")
            div#rowForm
              v-form(ref="form" v-model="valid" @submit.prevent="saveItem" lazy-validation)
                v-layout(row wrap).py-3
                  v-flex(xs12)
                    search-hmos(
                      v-model="newHMO"
                      outline
                      return-object
                      exclude-existing
                      label="Add new HMO"
                      item-text="name"
                      :disabled="loading"
                      :rules="genericFieldRules"
                    )
          td(colspan="1" align="center")
            v-btn(
              color="success"
              type="submit"
              @click="saveItem"
              :loading="loading"
              depressed
            ).pa-2 Add
            v-btn(
              @click="cancel"
              :disabled="loading"
              depressed
            ).pa-2 Cancel
    //- Delete Dialog
    confirm-dialog(
      :dialog.sync="deleteDialog"
      title="Delete Partner"
      message="Are you sure you want to delete this partner?"
      primaryAction="Yes"
      secondaryAction="No"
      primaryColor="error"
      @yes="deleteItem(deleteHMO)"
    )
</template>

<script>
// components
import GenericTable from '../../commons/generic-table';
import ConfirmDialog from '../../commons/confirm-dialog';
import GenericSearch from '../../commons/generic-search';
import SearchHmos from '../../common-search/search-hmos';
// constants
import { DEFAULT_PAGINATION_VALUE } from '../../../constants/tables';
// utils
import VueScrollTo from 'vue-scrollto';
import { debounce, isEmpty } from 'lodash';
import { initLogger } from '../../../utils/logger';
import { syncVuexState } from '../../../utils/vue';
import { permitPrivileges } from '../../../../src/utils/permissions';

export const COMPONENT_NAME = 'SettingsPartnersHmos';
const log = initLogger(COMPONENT_NAME);

export default {
  components: {
    GenericTable,
    ConfirmDialog,
    GenericSearch,
    SearchHmos,
  },
  data () {
    return {
      loading: false,
      valid: false,
      newHMO: null,
      createRow: false,
      deleteDialog: false,
      headers: [
        { text: 'Name', value: 'insurerName', sortable: false },
        { text: 'HMO ID', value: 'id', sortable: false },
        { text: '', value: 'action', sortable: false },
      ],
      debouncedFetch: debounce(this.loadAccreditedHMOList, 250),
      accreditedHmos: [],
      totalItems: 0,
      isInitialLoad: true,
    };
  },
  computed: {
    addable () {
      return permitPrivileges(this.$activeMembership, ['insurance_contractsCreate']);
    },
    pagination: {
      get () {
        return this.$store.state.table.settingsPartnersHmosPagination;
      },
      set (value) {
        const currentPaginationValue = this.$store.state.table.settingsPartnersHmosPagination;
        if (
          this.isInitialLoad &&
          currentPaginationValue !== DEFAULT_PAGINATION_VALUE
        ) {
          value = currentPaginationValue;
        }
        this.$store.commit('table/setSettingsPartnersHmosPagination', value);
      },
    },
    search: syncVuexState('table', 'settingsPartnersHmosSearchText'),
  },
  watch: {
    pagination: {
      async handler () {
        await this.loadAccreditedHMOList();
        this.isInitialLoad = false;
      },
      deep: true,
      immediate: true,
    },
    search () {
      if (this.isInitialLoad) return;
      this.pagination.page = 1;
      this.debouncedFetch();
    },
  },
  methods: {
    showCreateRow () {
      this.createRow = true;
      this.$nextTick(() => VueScrollTo.scrollTo('#rowForm', 500, { easing: 'ease' }));
    },
    cancel () {
      this.newHMO = {};
      this.hideCreateRow();
    },
    hideCreateRow () {
      this.createRow = false;
    },
    async loadAccreditedHMOList () {
      try {
        this.loading = true;
        const searchText = this.search;
        const { page, rowsPerPage } = this.pagination;

        if (isEmpty(this.pagination)) return;

        const query = {
          insured: this.$activeOrganization.id,
          type: 'insurance-facility',
          insurerSubtype: 'hmo',
        };

        // build searchString
        if (typeof searchText === 'string' && searchText) {
          query.insurerName = {
            $regex: `^${searchText}`,
            $options: 'i',
          };
        }

        // configure pagination
        query.$limit = rowsPerPage || 20;
        query.$skip = query.$limit * ((page || 1) - 1);

        // execute ops
        const result = await this.$sdk.service('insurance-contracts').find(query);
        this.accreditedHmos = result.items;
        this.totalItems = result.total;
      } catch (error) {
        log('loadAccreditedHMOList#error',);
        console.error(error);
        this.$enqueueSnack({
          color: 'error',
          message: error.message || 'Something went wrong! Please try again.',
        });
      } finally {
        this.loading = false;
      }
    },
    async saveItem () {
      try {
        this.valid = this.$refs.form.validate();
        if (!isEmpty(this.newHMO) && this.valid) {
          this.loading = true;
          log('saveItem#newHMO: %O', this.newHMO);
          const data = {
            insurer: this.newHMO.id,
            insurerName: this.newHMO.name,
            insurerPicURL: this.newHMO.picURL,
            insured: this.$activeOrganization.id,
            type: 'insurance-facility',
            insurerSubtype: 'hmo',
          };
          log('saveItem#data: %O', data);
          const found = await this.$sdk.service('insurance-contracts').findOne({
            insurer: data.insurer,
            insured: data.insured,
          });
          if (found) {
            const error = new Error('Accredited HMO already exists.');
            error.code = 'insurance-contracts/duplicate';
            throw error;
          }
          await this.$sdk.service('insurance-contracts').create(data);
          this.$enqueueSnack({
            color: 'success',
            message: 'Item Successfully added!',
          });
          this.newHMO = {};
          this.$refs.form.resetValidation();
          await this.loadAccreditedHMOList();
          this.hideCreateRow();
        } else {
          this.$enqueueSnack({
            color: 'warning',
            message: 'Please select one partner!',
          });
        }
      } catch (error) {
        log('saveItem#error');
        console.error(error);
        this.$enqueueSnack({
          color: 'error',
          message: error.message || 'Something went wrong! Please try again.',
        });
      } finally {
        this.loading = false;
      }
    },
    async deleteItem (item) {
      try {
        this.loading = true;
        await this.$sdk.service('insurance-contracts').remove(item.id);
        this.$enqueueSnack({
          color: 'success',
          message: 'Successfully deleted!',
        });
        await this.loadAccreditedHMOList();
      } catch (error) {
        log('deleteItem#error');
        console.error(error);
        let message = '';
        if (error.message === 'Contract already has a coverage') {
          message = 'You cannot delete this partner. Partner is currently in use';
        } else {
          message = error.message || 'Something went wrong! Please try again.';
        }
        this.$enqueueSnack({
          color: 'error',
          message,
        });
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>
