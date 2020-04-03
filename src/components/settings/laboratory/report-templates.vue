<template lang="pug">
  div
    h1 Lab Report Templates
    p Add report templates
    v-card
      async-confirm-dialog(ref="confirmDialog")
      generic-table(
        :headers="headers"
        :items="labReportTemplates"
        :loading="loading"
        :pagination.sync="pagination"
        :total-items="totalItems"
        flat
        searchable
        addable
        add-label="Add New Lab Report Template"
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
        template(slot="right-action")
          input(
            ref="fileInput"
            type="file"
            hidden
            @change="onImportJson"
          )
          v-tooltip(bottom)
            v-menu(slot="activator")
              v-btn(slot="activator" color="primary" flat icon large)
                v-icon mdi-json
              v-list
                v-list-tile(@click.stop="onJsonFileInput")
                  | Import from JSON
                v-list-tile(@click.stop="onExportJson")
                  | Export to JSON
            | Import/Export JSON
        tr(slot="items" slot-scope="props")
          td
            | {{ props.item.name }}
            v-chip(color="warning" text-color="white" v-if="props.item.hiddenAt").ml-2 Archived
          td {{ props.item.subtype }}
          td {{ props.item.description }}
            span(v-for="test in props.item.tests") {{ test }}
              br
          td.justify-end.layout.px-0
            v-tooltip(bottom)
              template(slot="activator" slot-scope="tooltipProps")
                v-btn(icon @click.stop="editItem(props.item)")
                  v-icon(small v-on="tooltipProps.on").primary--text mdi-pencil
              span Edit
            v-tooltip(bottom v-if="!props.item.hiddenAt")
              template(slot="activator" slot-scope="tooltipProps")
                v-btn(icon @click.stop="hideItem(props.item, true)")
                  v-icon(small v-on="tooltipProps.on").warning--text mdi-package-down
              span Archive
            v-tooltip(bottom v-if="props.item.hiddenAt")
              template(slot="activator" slot-scope="tooltipProps")
                v-btn(icon @click.stop="hideItem(props.item, false)")
                  v-icon(small v-on="tooltipProps.on").success--text mdi-package-up
              span Unarchive
            v-tooltip(bottom)
              template(slot="activator" slot-scope="tooltipProps")
                v-btn(icon @click.stop="deleteDialog = true; deleteReport = props.item")
                  v-icon(small v-on="tooltipProps.on").error--text mdi-trash-can-outline
              span Delete
      confirm-dialog(
        :dialog.sync="deleteDialog"
        title="Delete Template"
        message="Are you sure you want to delete this item?"
        primary-action="Yes"
        secondary-action="No"
        primary-color="error"
        @yes="deleteItem(deleteReport)"
      )
    v-dialog(
      v-model="templateDialog"
      v-if="templateDialog"
      persistent
      scrollable
      width="800"
    )
      v-card
        v-toolbar(flat)
          v-toolbar-title
            h4(v-if="!isEditing") Add New Lab Report Template
            h4(v-else) Edit Lab Report Template
          v-spacer
          v-btn(
            icon
            :disabled="loading"
            @click.stop="templateDialog = false"
          )
            v-icon mdi-close
        v-progress-linear(indeterminate v-if="loading" height="4").pa-0.ma-0
        v-card-text
          v-form(ref="form" v-model="validTemplate" lazy-validation)
            v-layout(row wrap)
              v-flex(xs12).pa-1
                v-text-field(
                  v-model="newReport.name"
                  flat
                  outline
                  label="* Name"
                  placeholder="e.g. PAP Smear Report"
                  :disabled="loading"
                  :rules="genericFieldRules"
                )
              v-flex(xs12).pa-1
                v-text-field(
                  v-model="newReport.subtype"
                  flat
                  outline
                  label="* Category"
                  placeholder="e.g. PAP Smear"
                  :disabled="loading"
                  :rules="genericFieldRules"
                )
              v-flex(xs12).pa-1
                v-textarea(
                  v-model="newReport.description"
                  flat
                  outline
                  label="Description"
                  placeholder="Write here"
                  :disabled="loading"
                )
              v-flex(xs12).pa-1.mb-3
                mc-wysiwyg(
                  v-model="newReport.template"
                  :rules="genericFieldRules"
                  :height="350"
                )
        v-divider
        v-card-actions
          v-spacer
          v-btn(
            color="primary"
            :loading="loading"
            @click.stop="saveReport"
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
import { McWysiwyg } from '@mycure/vue-wysiwyg';
import GenericTable from '../../commons/generic-table';
import ConfirmDialog from '../../commons/confirm-dialog';
import AsyncConfirmDialog from '../../commons/async-confirm-dialog';
// constants
// utils
import _ from 'lodash';
import { initLogger } from '../../../utils/logger';
import { readInputFile } from '../../../utils/file';

export const COMPONENT_NAME = 'LaboratoryReportTemplates';
const log = initLogger(COMPONENT_NAME);

export default {
  components: {
    ConfirmDialog,
    GenericTable,
    McWysiwyg,
    AsyncConfirmDialog,
  },
  data () {
    return {
      sample1: [],
      sample2: [],
      searchText: '',
      loading: false,
      isEditing: false,
      validTemplate: false,
      newReport: {},
      deleteReport: {},
      labReportTemplate: {
        name: '',
        type: 'lab-result',
        subtype: '',
        description: '',
      },
      templateDialog: false,
      deleteDialog: false,
      headers: [
        {
          text: 'Name',
          value: 'name',
          sortable: false,
        },
        {
          text: 'Section',
          value: 'section',
          sortable: false,
        },
        {
          text: 'Description',
          value: 'description',
          sortable: false,
        },
        {
          text: '',
          value: 'action',
          sortable: false,
        },
      ],
      pagination: {},
      debouncedFetch: _.debounce(this.fetchTemplates, 250),
      // NOTE: moved from settings store
      labReportTemplates: [],
      totalItems: 0,
    };
  },
  watch: {
    pagination: {
      async handler () {
        await this.fetchTemplates();
      },
      deep: true,
    },
    searchText: {
      async handler () {
        this.pagination.page = 1;
        await this.debouncedFetch();
      },
    },
  },
  created () {
    this.$initLogger(COMPONENT_NAME);
  },
  methods: {
    async init () {
      try {
        this.loading = true;
        await this.fetchTemplates();
        this.newReport = _.cloneDeep(this.labReportTemplate);
      } catch (error) {
        console.error(error);
        log('init#error');
        this.$enqueueSnack({
          message: error.message || 'Something went wrong! Please try again.',
          color: 'error',
        });
      } finally {
        this.loading = false;
      }
    },
    async fetchTemplates () {
      try {
        this.loading = true;
        const { rowsPerPage, page } = this.pagination;
        const query = {
          facility: this.$activeOrganization.id,
          type: 'lab-result',
          $sort: { name: 1 },
        };

        // configure search
        if (typeof this.searchText === 'string' && this.searchText) {
          query.$or = [
            { tags: { $regex: `^${this.searchText}`, $options: 'i' } },
            { name: { $regex: `^${this.searchText}`, $options: 'i' } },
          ];
        }

        // configure paginations
        query.$limit = rowsPerPage || 20;
        query.$skip = query.$limit * ((page || 1) - 1);

        // execute ops
        const result = await this.$sdk.service('form-templates').find(query);
        this.labReportTemplates = result.items;
        this.totalItems = result.total;
      } catch (error) {
        console.error(error);
        log('fetchTemplates#error');
        this.$enqueueSnack({
          color: 'error',
          message: error.message || 'Something went wrong! Please try again later',
        });
      } finally {
        this.loading = false;
      }
    },
    openDialog (isEditing) {
      this.isEditing = isEditing;
      if (!isEditing) { this.newReport = _.mapValues(this.newReport, () => ''); }
      this.templateDialog = true;
    },
    async saveReport () {
      this.validTemplate = this.$refs.form.validate();
      if (this.validTemplate) {
        try {
          this.loading = true;
          if (!this.isEditing) {
            const data = {
              ...this.newReport,
              type: 'lab-result',
              facility: this.$activeOrganization.id,
            };
            await this.$sdk.service('form-templates').create(data);
          } else {
            const item = _.clone(this.newReport);
            const toReplace = _.pick(item,
              ['name', 'subtype', 'description', 'template', 'tags']);
            await this.$sdk.service('form-templates').remove(item.id);
            const data = {
              ...toReplace,
              type: 'lab-result',
              facility: this.$activeOrganization.id,
            };
            await this.$sdk.service('form-templates').create(data);
          }
          await this.init();
          this.templateDialog = false;
          this.newReport = _.mapValues(this.newReport, () => '');
          this.$enqueueSnack({
            color: 'success',
            message: `Lab Report Template successfully 
              ${this.isEditing ? 'updated' : 'added'}!`,
          });
        } catch (error) {
          console.error(error);
          log('saveReport#error');
          this.$enqueueSnack({
            color: 'error',
            message: error.message || 'Something went wrong! Please try again.',
          });
        } finally {
          this.loading = false;
        }
      } else {
        this.$enqueueSnack({
          color: 'warning',
          message: 'Make sure you completed all required fields.',
        });
      }
    },
    editItem (item) {
      this.newReport = _.clone(item);
      this.openDialog(true);
    },
    async deleteItem (template) {
      try {
        this.loading = true;
        await this.$sdk.service('form-templates').remove(template.id);
        await this.init();
        this.$enqueueSnack({
          color: 'success',
          message: 'Lab Report Template deleted!',
        });
      } catch (error) {
        console.error(error);
        log('deleteItem#error');
        this.$enqueueSnack({
          color: 'error',
          message: error.message || 'There was an error. Please try again.',
        });
      } finally {
        this.loading = false;
      }
    },
    async hideItem (item, hide) {
      try {
        const res = await this.$refs.confirmDialog.open(
          `${hide ? 'Archive' : 'Unarchive'} Template`,
          `Are you sure you want to ${hide ? 'archive' : 'unarchive'} this template?`,
          {
            primaryAction: `${hide ? 'Archive' : 'Unarchive'}`,
            primaryColor: `${hide ? 'warning' : 'success'}`,
          }
        );
        if (!res) return;

        this.loading = true;
        await this.$sdk.service('form-templates').update(item.id, { hide });
        await this.init();
        this.$enqueueSnack({
          color: 'success',
          message: `Successfully ${hide ? 'archived' : 'unarchived'} template!`,
        });
      } catch (error) {
        console.error(error);
        log('deleteItem#error');
        this.$enqueueSnack({
          color: 'error',
          message: error.message || 'There was an error. Please try again. Make sure that this template is not in use',
        });
      } finally {
        this.loading = false;
      }
    },
    onJsonFileInput () {
      this.$refs.fileInput.click();
    },
    async onImportJson (event) {
      this.loading = true;
      try {
        log('onImportJson#event: %O', event);
        const json = await readInputFile(event, 'text');
        log('onImportJson#json: %O', json);

        const payload = JSON.parse(json);
        log('onImportJson#payload: %O', payload);
        const normalizedPayload = _.isArray(payload) ? payload : [payload];
        const contextualizedPayload = _.map(normalizedPayload, template => ({
          ...template,
          facility: this.$activeOrganization.id,
        }));
        log('onImportJson#contextualizedPayload: %O', contextualizedPayload);

        await this.$sdk.service('form-templates').create(contextualizedPayload);
        await this.init();
        this.$enqueueSnack({
          message: 'Successfully imported report templates!',
          color: 'success',
        });
      } catch (error) {
        console.error(error);
        log('onImportJson#error');
        this.$enqueueSnack({
          message: error.message,
          color: 'error',
        });
      } finally {
        this.loading = false;
      }
    },
    onExportJson () {
      const a = document.createElement('a');
      const data = _.map(this.labReportTemplates, test => _.pick(test,
        'type', 'subtype', 'name', 'description', 'template', 'items', 'tags',
        'meta'));
      const json = JSON.stringify(data);
      a.setAttribute('href', 'data:text/plain;charset=utf-u,' + window.encodeURIComponent(json));
      a.setAttribute('download', 'lab-report-templates.json');
      a.click();
    },
  },
};
</script>
