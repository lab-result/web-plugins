<template lang="pug">
  div
    h1 Manage Diagnostic Centers
    p Add to list of diagnostic center partners.
    v-card
      generic-table(
        flat
        searchable
        add-label="Add Partner"
        :items="diagCenters"
        :headers="headers"
        :loading="loading"
        :addable="addable"
        :total-items="totalItems"
        :pagination.sync="pagination"
        :search-text.sync="search"
        @add="openDialog(false)"
      )
        tr(slot="items" slot-scope="props")
          td {{ props.item.name || 'NA'}}
          td {{ props.item.description }}
          td {{ props.item.createdAt | morph-date('MMM DD, YYYY') }}
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

    // Add Partner Dialog
    v-dialog(
      v-model="addDialog"
      v-if="addDialog"
      persistent
      width="600"
    )
      v-card
        v-toolbar(flat)
          v-toolbar-title
            h4(v-if="isEditing") Add Diagnostic Center
            h4(v-else) Edit Diagnostic Center
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
                  label="Name*"
                  v-model="newCenter.name"
                  :rules="[v => !!v || 'Name is required']"
                  :disabled="loading"
                )
              v-flex(xs12).pa-1
                v-textarea(
                  outline
                  label="Description"
                  v-model="newCenter.description"
                  :disabled="loading"
                )
        v-divider
        v-card-actions
          v-spacer
          v-btn(
            color="primary"
            :loading="loading"
            @click="saveItem"
          ) {{ isEditing ? 'Update' : 'Save'}}
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
import { DEFAULT_PAGINATION_VALUE } from '../../../constants/tables';
// utils
import _ from 'lodash';
import { initLogger } from '../../../utils/logger';
import { syncVuexState } from '../../../utils/vue';
import { permitPrivileges } from '../../../../src/utils/permissions';

export const COMPONENT_NAME = 'SettingsPartnersDiagnosticCenters';
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
      newCenter: { name: '', description: '' },
      addDialog: false,
      deleteDialog: false,
      deletePartner: {},
      headers: [
        { text: 'Name', value: 'name', width: '40%', sortable: false },
        { text: 'Description', value: 'description', sortable: false },
        { text: 'Created At', value: 'createdAt', sortable: false },
        { text: '', value: 'actions', sortable: false },
      ],
      debouncedFetch: _.debounce(this.init, 250),
      diagCenters: [],
      totalItems: 0,
      isInitialLoad: true,
    };
  },
  computed: {
    addable () {
      return permitPrivileges(this.$activeMembership, ['insurance_contractsCreate']);
    },
    canEdit () {
      return permitPrivileges(this.$activeMembership, ['insurance_contractsUpdate']);
    },
    pagination: {
      get () {
        return this.$store.state.table.settingsPartnersDiagnosticCentersPagination;
      },
      set (value) {
        const currentPaginationValue = this.$store.state.table.settingsPartnersDiagnosticCentersPagination;
        if (
          this.isInitialLoad &&
          currentPaginationValue !== DEFAULT_PAGINATION_VALUE
        ) {
          value = currentPaginationValue;
        }
        this.$store.commit('table/setSettingsPartnersDiagnosticCentersPagination', value);
      },
    },
    search: syncVuexState('table', 'settingsPartnersDiagnosticCentersSearchText'),
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
  methods: {
    async init () {
      try {
        this.loading = true;
        const searchText = this.search;
        const { page, rowsPerPage } = this.pagination;

        if (_.isEmpty(this.pagination)) return;

        const query = {
          type: 'diagnostic-center',
          overlords: this.$activeOrganization.id,
        };

        // configure search
        if (typeof searchText === 'string' && searchText) {
          query.$or = [
            { name: { $regex: `^${searchText}`, $options: 'gi' } },
            { description: { $regex: `^${searchText}`, $options: 'gi' } },
          ];
        }

        // configure pagination
        query.$limit = rowsPerPage || 20;
        query.$skip = query.$limit * ((page || 1) - 1);

        // execute opts
        const result = await this.$sdk.service('organizations').find(query);
        this.diagCenters = result.items;
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
      if (!isEditing) { this.newCenter = _.mapValues(this.newCenter, () => ''); }
      this.addDialog = true;
    },
    async saveItem () {
      if (this.$refs.form.validate()) {
        try {
          this.loading = true;
          if (!this.isEditing) {
            const data = {
              ..._.pick(this.newCenter, ['name', 'description']),
              overlords: [this.$activeOrganization.id],
              type: 'diagnostic-center',
            };
            const created = await this.$sdk.service('organizations').create(data);
            this.diagCenters.push(created);
            this.$enqueueSnack({
              color: 'success',
              message: 'Item Successfully added!',
            });
          } else {
            const fields = ['name', 'description'];
            const data = _.pickBy(_.pick(this.newCenter, fields));
            await this.$sdk.service('organizations').update(this.newCenter.id, data);
            this.$enqueueSnack({
              color: 'success',
              message: 'Item Successfully updated!',
            });
          }
          await this.init();
        } catch (error) {
          log('saveItem#error');
          console.error(error);
          this.$enqueueSnack({
            color: 'error',
            message: error.message || 'There was an error. Please try again!',
          });
        } finally {
          this.loading = false;
          this.addDialog = false;
          this.newCenter = _.mapValues(this.newCenter, () => '');
        }
      }
    },
    editItem (item) {
      this.newCenter = _.clone(item);
      this.openDialog(true);
    },
    async deleteItem (item) {
      try {
        this.loading = true;
        await this.$sdk.service('organizations').remove(item.id);
        this.$enqueueSnack({
          color: 'success',
          message: 'Successfully deleted!',
        });
        this.init();
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
  },
};
</script>
