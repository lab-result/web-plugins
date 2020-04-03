<template lang="pug">
  div
    h1 Manage Lab Test Order Templates
    p Add your custom laboratory tests order templates in your clinic
    v-card
      generic-table(
        :headers="headers"
        :items="labOrderTemplates"
        :loading="loading"
        :pagination.sync="pagination"
        :total-items="totalItems"
        flat
        searchable
        addable
        add-label="Add New Lab Order Template"
        @add="() => openDialog(false)"
      )
        template(slot="search")
          v-text-field(
            v-model="searchText"
            append-icon="mdi-magnify"
            label="Search"
            single-line
            hide-details
            clearable
            solo
            flat
          )
        tr(slot="items" slot-scope="props")
          td {{ props.item.name }}
          td {{ props.item.description }}
          td {{ props.item.tests }}
          td.justify-end.layout.px-0
            v-btn(icon @click.stop="editItem(props.item.original)")
              v-icon(small).primary--text mdi-pencil
            v-btn(icon @click.stop="deleteDialog = true; deleteId = props.item.id")
              v-icon(small).error--text mdi-trash-can-outline
      confirm-dialog(
        :dialog.sync="deleteDialog"
        title="Delete Lab Test"
        message="Are you sure you want to delete this item?"
        primary-action="Yes"
        secondary-action="No"
        primary-color="error"
        @yes="deleteOrder(deleteId)"
      )
    //- Add New Lab Order
    v-dialog(
      v-model="templateDialog"
      v-if="templateDialog"
      persistent
      scrollable
      width="600"
    )
      v-card
        v-toolbar(flat)
          v-toolbar-title
            h4(v-if="!isEditing") Laboratory Order Template Details
            h4(v-else) Edit Laboratory Order Template Details
          v-spacer
          v-btn(
            icon
            :disabled="loading"
            @click.stop="templateDialog = false"
          )
            v-icon mdi-close
        v-progress-linear(indeterminate v-if="loading" height="4").pa-0.ma-0
        v-card-text
          v-form(ref="form" v-model="valid" lazy-validation)
            v-layout(row wrap)
              v-flex(xs12).pa-1
                v-text-field(
                  v-model="newOrder.name"
                  flat
                  outline
                  label="* Template Name"
                  placeholder="e.g. Basic 5"
                  :rules="genericFieldRules"
                  :disabled="loading"
                )
              v-flex(xs12).pa-1
                v-textarea(
                  v-model="newOrder.description"
                  flat
                  outline
                  label="Description"
                  :disabled="loading"
                )
              v-flex(xs12).pa-1
                search-diagnostic-tests(
                  v-model="newOrder.tests"
                  type="laboratory"
                  label="Search Laboratory Test to Request"
                  multiple
                  outline
                  :return-object="false"
                  :rules="rules"
                  :disabled="loading"
                  deletable-chips
                )
        v-divider
        v-card-actions
          v-spacer
          v-btn(
            color="primary"
            :loading="loading"
            @click.stop="saveOrder"
          ) {{ isEditing ? 'Update' : 'Save' }}
          v-btn(
            flat
            color="error"
            :disabled="loading"
            @click.stop="templateDialog = false"
          ) Cancel
</template>

<script>
// components
import GenericTable from '../../commons/generic-table';
import ConfirmDialog from '../../commons/confirm-dialog';
import SearchDiagnosticTests from '../../common-search/search-diagnostic-tests';
// constants
// utils
import _ from 'lodash';
import { initLogger } from '../../../utils';

export const COMPONENT_NAME = 'LaboratoryOrderTemplates';
const log = initLogger(COMPONENT_NAME);

export default {
  components: {
    ConfirmDialog,
    GenericTable,
    SearchDiagnosticTests,
  },
  data () {
    return {
      isEditing: false,
      searchText: '',
      loading: false,
      newOrder: {},
      valid: false,
      templateDialog: false,
      deleteDialog: false,
      addLabOrder: false,
      deleteId: '',
      rules: [v => !_.isEmpty(v) || 'This is a required field.'],
      headers: [
        {
          text: 'Name',
          value: 'name',
          sortable: false,
        },
        {
          text: 'Description',
          value: 'description',
          sortable: false,
        },
        {
          text: 'Test(s)',
          value: 'tests',
          sortable: false,
        },
        {
          text: '',
          value: 'action',
          sortable: false,
        },
      ],
      pagination: {},
      debouncedInit: _.debounce(this.init, 250),
      // NOTE: moved from settings store
      totalItems: 0,
      labOrderTemplates: [],
    };
  },
  watch: {
    pagination: {
      async handler () {
        await this.init();
      },
      deep: true,
    },
    searchText: {
      async handler () {
        await this.debouncedInit();
      },
    },
  },
  methods: {
    async init () {
      try {
        this.loading = true;
        const { rowsPerPage, page } = this.pagination;
        const query = {
          facility: this.$activeOrganization.id,
          type: 'laboratory',
          $populate: {
            tests: {
              service: 'diagnostic-tests',
              key: 'tests',
              method: 'find',
              methodOps: '$in',
              idField: 'id',
            },
          },
        };

        // configure search
        if (typeof this.searchText === 'string' && this.searchText) {
          query.$or = [
            { name: { $regex: `^${this.searchText}`, $options: 'i' } },
            { subtype: { $regex: `^${this.searchText}`, $options: 'i' } },
          ];
        }

        // configure pagination
        query.$limit = rowsPerPage || 20;
        query.$skip = query.$limit * ((page || 1) - 1);

        // execute ops
        const result = await this.$sdk.service('diagnostic-packages').find(query);
        this.totalItems = result.total;
        this.labOrderTemplates = result.items.map(p => ({
          name: p.name,
          description: p.description,
          id: p.id,
          original: p,
          tests: p.$populated?.tests
            ?.map(test => test.name)
            ?.join(', '),
        }));
      } catch (error) {
        console.error(error);
        log('init#error');
        this.$enqueueSnack({
          color: 'error',
          message: error.message || 'Something went wrong! Please try again later.',
        });
      } finally {
        this.loading = false;
      }
    },
    openDialog (isEditing) {
      this.isEditing = isEditing;
      if (!isEditing) { this.newOrder = _.mapValues(this.newOrder, () => ''); }
      this.templateDialog = true;
    },
    async saveOrder () {
      this.valid = this.$refs.form.validate();
      if (this.valid) {
        try {
          this.loading = true;
          if (!this.isEditing) {
            const data = {
              ...this.newOrder,
              type: 'laboratory',
              facility: this.$activeOrganization.id,
            };
            await this.$sdk.service('diagnostic-packages').create(data);
          } else {
            const templateToEdit = _.pick(this.newOrder, ['name', 'description', 'tests']);
            await this.$sdk.service('diagnostic-packages').update(this.newOrder.id, templateToEdit);
          }
          await this.init();
          this.templateDialog = false;
          this.newOrder = _.mapValues(this.newOrder, () => '');
          this.$enqueueSnack({
            color: 'success',
            message: `Laboratory Order Template successfully ${this.isEditing ? 'updated' : 'added'}!`,
          });
        } catch (error) {
          console.error(error);
          log('saveOrder#error');
          this.$enqueueSnack({
            color: 'error',
            message: error.message || 'There was an error. Please try again.',
          });
        } finally {
          this.loading = false;
        }
      } else {
        this.$enqueueSnack({
          color: 'warning',
          message: 'Please make sure to fill the required fields.',
        });
      }
    },
    async deleteOrder (order) {
      try {
        this.loading = true;
        await this.$sdk.service('diagnostic-packages').remove(order);
        await this.init();
        this.$enqueueSnack({
          color: 'success',
          message: 'Laboratory Order Template deleted!',
        });
      } catch (error) {
        console.error(error);
        log('deleteOrder#error');
        this.$enqueueSnack({
          color: 'error',
          message: error.message || 'There was an error. Please try again.',
        });
      } finally {
        this.loading = false;
      }
    },
    editItem (item) {
      this.newOrder = _.clone(item);
      this.openDialog(true);
    },
  },
};
</script>
