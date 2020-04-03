<template lang="pug">
  div
    h1 Manage Accredited Government Insurances
    p Add clinic list of accredited Government Insurances.
    v-card
      generic-table(
        flat
        slotted-footer
        internal-searchable
        internal-search-model-enabled
        add-label="Add Government Insurance"
        :headers="headers"
        :loading="loading"
        :addable="addable"
        :items="govInsurances"
        :pagination.sync="pagination"
        :internal-search.sync="searchText"
        @add="showCreateRow"
      )
        tr(slot="items" slot-scope="props")
          td {{ props.item.insurerName }}
          td {{ props.item.id }}
          td.justify-end.layout.px-0
            v-btn(icon @click="deleteDialog = true; deleteGov = props.item")
              v-icon(small).error--text mdi-trash-can-outline
        tr(slot="footer" v-if="createRow")
          td(colspan="2")
            div#rowForm
              v-form(ref="form" v-model="valid" lazy-validation @submit.prevent="saveItem")
                v-layout(row wrap).py-3
                  v-flex(grow)
                    generic-search(
                      v-model="newGovIns"
                      :items="govAccounts"
                      label="Add new government insurance"
                      item-text="name"
                      return-object
                      outline
                      :disabled="loading"
                      :rules="genericFieldRules"
                    )
          td(colspan="1" align="center")
            v-btn(
              depressed
              color="success"
              type="submit"
              :loading="loading"
              @click="saveItem"
            ).pa-2 Add
            v-btn(
              depressed
              :disabled="loading"
              @click="cancel"
            ).pa-2 Cancel
    //- Delete Dialog
    confirm-dialog(
      :dialog.sync="deleteDialog"
      title="Delete Partner"
      message="Are you sure you want to delete this partner?"
      primaryAction="Yes"
      secondaryAction="No"
      primaryColor="error"
      @yes="deleteItem(deleteGov)"
    )
</template>

<script>
// components
import GenericTable from '../../commons/generic-table';
import GenericSearch from '../../commons/generic-search';
import ConfirmDialog from '../../commons/confirm-dialog';
// constants
// utils
import { isEmpty } from 'lodash';
import VueScrollTo from 'vue-scrollto';
import { initLogger } from '../../../utils/logger';
import { permitPrivileges } from '../../../../src/utils/permissions';
import { syncVuexState } from '../../../utils/vue';
import { DEFAULT_PAGINATION_VALUE } from '../../../constants/tables';

export const COMPONENT_NAME = 'SettingsPartnersGovInsurances';
const log = initLogger(COMPONENT_NAME);

export default {
  components: {
    GenericTable,
    ConfirmDialog,
    GenericSearch,
  },
  data () {
    return {
      search: '',
      loading: false,
      valid: false,
      newGovIns: null,
      addDialog: false,
      createRow: false,
      deleteDialog: false,
      headers: [
        { text: 'Name', value: 'insurerName' },
        { text: 'Government ID', value: 'govId' },
        { text: '', value: 'action', sortable: false },
      ],
      govInsurances: [],
      govAccountsRaw: [],
      isInitialLoad: true,
    };
  },
  computed: {
    govAccounts () {
      const insured = [];
      this.govInsurances.forEach(govIn => {
        insured.push(govIn.insurerName);
      });
      return this.govAccountsRaw.filter(acc => {
        return !insured.includes(acc.name);
      });
    },
    addable () {
      return permitPrivileges(this.$activeMembership, ['insurance_contractsCreate']);
    },
    pagination: {
      get () {
        return this.$store.state.table.settingsPartnersGovInsurancesPagination;
      },
      set (value) {
        const currentPaginationValue = this.$store.state.table.settingsPartnersGovInsurancesPagination;
        if (
          this.isInitialLoad &&
          currentPaginationValue !== DEFAULT_PAGINATION_VALUE
        ) {
          value = currentPaginationValue;
        }
        this.$store.commit('table/setSettingsPartnersGovInsurancesPagination', value);
      },
    },
    searchText: syncVuexState('table', 'settingsPartnersGovInsurancesSearchText'),
  },
  async created () {
    await this.init();
    this.isInitialLoad = false;
  },
  methods: {
    async init () {
      try {
        this.loading = true;
        const query = {
          type: 'insurance',
          subtype: 'government',
        };
        // TODO: configure pagination
        await this.$sdk.service('organizations').find(query).then(result => {
          this.govAccountsRaw = result.items;
        });
        await this.loadGovInsurances();
      } catch (error) {
        log('init#error');
        console.error(error);
        this.$enqueueSnack({
          message: error.message,
          color: 'error',
        });
      } finally {
        this.loading = false;
      }
    },
    showCreateRow () {
      this.createRow = true;
      this.$nextTick(() => VueScrollTo.scrollTo('#rowForm', 500, { easing: 'ease' }));
    },
    cancel () {
      this.newGovIns = {};
      this.hideCreateRow();
    },
    hideCreateRow () {
      this.createRow = false;
    },
    async loadGovInsurances () {
      try {
        this.loading = true;
        const query = {
          insured: this.$activeOrganization.id,
          type: 'insurance-facility',
          insurerSubtype: 'government',
        };
        // TODO: configure pagination
        // execute opts
        const result = await this.$sdk.service('insurance-contracts').find(query);
        this.govInsurances = result.items;
      } catch (error) {
        log('loadGovInsurances#error');
        console.error(error);
        this.$enqueueSnack({
          message: error.message || 'Something went wrong! Please try again',
          color: 'error',
        });
      } finally {
        this.loading = false;
      }
    },
    async saveItem () {
      try {
        this.valid = this.$refs.form.validate();
        if (!isEmpty(this.newGovIns) && this.valid) {
          const data = {
            insurer: this.newGovIns.id,
            insurerName: this.newGovIns.insurerName,
            insurerPicURL: this.newGovIns.insurerPicURL,
            insured: this.$activeOrganization.id,
            type: 'insurance-facility',
            insurerSubtype: 'government',
          };
          this.loading = true;
          await this.$sdk.service('insurance-contracts').create(data);
          this.$enqueueSnack({
            color: 'success',
            message: 'Item Successfully added!',
          });
          this.newGovIns = {};
          await this.loadGovInsurances();
          this.$refs.form.resetValidation();
          this.hideCreateRow();
        } else {
          this.$enqueueSnack({
            color: 'warning',
            message: 'Please select one partner.',
          });
        }
      } catch (error) {
        log('saveItem#error');
        console.error(error);
        this.$enqueueSnack({
          color: 'error',
          message: error.message || 'There was an error. Please try again.',
        });
      } finally {
        this.loading = false;
      }
    },
    async deleteItem (item) {
      try {
        this.loading = true;
        await this.$sdk.service('insurance-contracts').remove(item.id);
        await this.loadGovInsurances();
        this.$enqueueSnack({
          color: 'success',
          message: 'Successfully deleted!',
        });
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
