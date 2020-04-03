<template lang="pug">
  div
    h1 Manage Corporate Partners
    p Add to list of partners.
    v-card
      generic-table(
        flat
        searchable
        add-label="Add Company Partner"
        import-label="Import Corporate Partners"
        import-template-link="/attach/partner-information.xlsx"
        :items="companies"
        :headers="headers"
        :loading="loading"
        :addable="addableOrImportable"
        :importable="addableOrImportable"
        :xlsx-utils="xlsxUtils"
        :total-items="totalItems"
        :import-headers="importHeaders"
        :pagination.sync="pagination"
        :search-text.sync="search"
        @import="onImportData"
        @add="openDialog(false)"
      )
        tr(slot="items" slot-scope="props")
          td {{ props.item.insurerName  || 'NA' }}
          td {{ props.item.insurerDescription }}
          td {{ props.item.id }}
          td.justify-end.layout.px-0
            v-btn(v-if="canEdit" icon @click="editItem(props.item)")
              v-icon(small).primary--text mdi-pencil
            v-btn(icon @click="deleteDialog = true; deletePartner = props.item")
              v-icon(small).error--text mdi-trash-can-outline
    //- Delete Dialog
    confirm-dialog(
      :dialog.sync="deleteDialog"
      title="Delete Partner"
      message="Are you sure you want to delete this partner?"
      primaryAction="Yes"
      secondaryAction="No"
      primaryColor="error"
      @yes="deleteItem(deletePartner)"
    )

    //-Add Partner Dialog
    v-dialog(
      v-model="addDialog"
      v-if="addDialog"
      width="600"
      persistent
    )
      v-card
        v-toolbar(flat)
          v-toolbar-title
            h4(v-if="!isEditing") Add Company Partner
            h4(v-else) Edit Company Partner
          v-spacer
          v-btn(icon @click="addDialog = false")
            v-icon mdi-close
        v-progress-linear(indeterminate v-if="loading" height="4").pa-0.ma-0
        v-card-text
          v-form(ref="form" @submit.prevent="saveItem")
            v-layout(row wrap)
              v-flex(xs12).pa-1
                v-text-field(
                  outline
                  label="Company Name*"
                  v-model="newCompany.insurerName"
                  :disabled="loading"
                  :rules="[v => !!v || 'This field is required']"
                )
              v-flex(xs12).pa-1
                v-textarea(
                  outline
                  label="Description"
                  v-model="newCompany.insurerDescription"
                  :disabled="loading"
                )
        v-divider
        v-card-actions
          v-spacer
          v-btn(
            color="primary"
            :loading="loading"
            @click="saveItem"
          ) {{ isEditing ? 'Update' : 'Save' }}
          v-btn(
            flat
            color="error"
            :disabled="loading"
            @click="addDialog = false"
          ) Cancel
</template>

<script>
// components
import GenericTable from '../../commons/generic-table';
import ConfirmDialog from '../../commons/confirm-dialog';
// constants
import { IMPORT_HEADERS_PARTNERS } from './constants';
import { DEFAULT_PAGINATION_VALUE } from '../../../constants/tables';
// utils
import _ from 'lodash';
import * as xlsxUtils from '../../../utils/xlsx';
import { initLogger } from '../../../utils/logger';
import { syncVuexState } from '../../../utils/vue';
import { permitPrivileges } from '../../../../src/utils/permissions';

export const COMPONENT_NAME = 'SettingsPartnersCompanies';
const log = initLogger(COMPONENT_NAME);

export default {
  components: {
    GenericTable,
    ConfirmDialog,
  },
  data () {
    return {
      loading: false,
      isEditing: false,
      newCompany: { insurerName: '', insurerDescription: '' },
      addDialog: false,
      deleteDialog: false,
      deletePartner: {},
      importHeaders: IMPORT_HEADERS_PARTNERS,
      headers: [
        { text: 'Name', value: 'insurerName', sortable: false },
        { text: 'Description', value: 'insurerDescription', sortable: false },
        { text: 'Company ID', value: 'id', sortable: false },
        { text: '', value: 'actions', sortable: false },
      ],
      xlsxUtils: {},
      debouncedFetch: _.debounce(this.init, 250),
      companies: [],
      totalItems: 0,
      isInitialLoad: true,
    };
  },
  computed: {
    addableOrImportable () {
      return permitPrivileges(this.$activeMembership, ['insurance_contractsCreate']);
    },
    canEdit () {
      return permitPrivileges(this.$activeMembership, ['insurance_contractsUpdate']);
    },
    pagination: {
      get () {
        return this.$store.state.table.settingsPartnersCompaniesPagination;
      },
      set (value) {
        const currentPaginationValue = this.$store.state.table.settingsPartnersCompaniesPagination;
        if (
          this.isInitialLoad &&
          currentPaginationValue !== DEFAULT_PAGINATION_VALUE
        ) {
          value = currentPaginationValue;
        }
        this.$store.commit('table/setSettingsPartnersCompaniesPagination', value);
      },
    },
    search: syncVuexState('table', 'settingsPartnersCompaniesSearchText'),
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
    search () {
      if (this.isInitialLoad) return;
      this.pagination.page = 1;
      this.debouncedFetch();
    },
  },
  async created () {
    this.xlsxUtils = { ...xlsxUtils };
  },
  methods: {
    async init () {
      try {
        this.loading = true;
        const searchText = this.search;
        const { page, rowsPerPage } = this.pagination;

        if (_.isEmpty(this.pagination)) return;

        const query = {
          insured: this.$activeOrganization.id,
          type: 'corporate-partner-facility',
        };

        // build searchstring
        if (typeof searchText === 'string' && searchText) {
          query.$or = [
            { insurerName: { $regex: `^${searchText}`, $options: 'gi' } },
            { insurerDescription: { $regex: `^${searchText}`, $options: 'gi' } },
          ];
        }

        // configure pagination
        query.$limit = rowsPerPage || 20;
        query.$skip = query.$limit * ((page || 1) - 1);

        // execute opts
        const result = await this.$sdk.service('insurance-contracts').find(query);
        this.companies = result.items;
        this.totalItems = result.total;
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
    openDialog (isEditing) {
      this.isEditing = isEditing;
      if (!isEditing) { this.newCompany = _.mapValues(this.newCompany, () => ''); }
      this.addDialog = true;
    },
    async saveItem () {
      if (this.$refs.form.validate()) {
        try {
          this.loading = true;
          if (!this.isEditing) {
            const fields = [
              'type', 'insured', 'insurer', 'insurerSubtype', 'insurerPicURL',
              'insurerName', 'insurerDescription', 'label', 'expiresAt', 'startAt',
              'endAt', 'meta',
            ];
            const data = {
              ..._.pick(this.newCompany, fields),
              type: 'corporate-partner-facility',
              insured: this.$activeOrganization.id,
            };
            const created = await this.$sdk.service('insurance-contracts').create(data);
            this.companies.push(created);
            this.totalItems++;
            this.$enqueueSnack({
              color: 'success',
              message: 'Item Successfully added!',
            });
          } else {
            const data = _.pick(this.newCompany, [
              'insurerSubtype', 'insurerPicURL', 'insurerName',
              'insurerDescription', 'label', 'expiresAt', 'startAt',
              'endAt', 'meta',
            ]);
            await this.$sdk.service('insurance-contracts').update(this.newCompany.id, data);
            this.$enqueueSnack({
              color: 'success',
              message: 'Item Successfully updated!',
            });
          }
          await this.init();
          this.addDialog = false;
        } catch (error) {
          log('saveItem#error');
          console.error(error);
          this.$enqueueSnack({
            color: 'error',
            message: error.message || 'Something went wrong! Please try again.',
          });
        } finally {
          this.loading = false;
          this.newCompany = _.mapValues(this.newCompany, () => '');
        }
      }
    },
    editItem (item) {
      this.newCompany = _.clone(item);
      this.openDialog(true);
    },
    async deleteItem (item) {
      try {
        this.loading = true;
        await this.$sdk.service('insurance-contracts').remove(item.id);
        this.$enqueueSnack({
          color: 'success',
          message: 'Successfully deleted!',
        });
        await this.init();
        this.deleteDialog = false;
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
    async onImportData (data) {
      try {
        this.loading = true;

        log('onImportData#data: %O', data);
        const contracts = data?.map(d => ({
          ...d,
          type: 'corporate-partner-facility',
          insured: this.$activeOrganization?.id,
        }));
        log('onImportData#contracts: %O', contracts);

        await this.$sdk.service('insurance-contracts').create(contracts);
        await this.init();
      } catch (error) {
        log('onImportData#error');
        console.error(error);
        this.$enqueueSnack({
          message: error.message || 'Something went wrong during import. Try again.',
          color: 'error',
        });
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>
