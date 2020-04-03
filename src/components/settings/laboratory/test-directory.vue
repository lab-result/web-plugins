<template lang="pug">
  div
    h1 Manage Laboratory Tests
    p Add custom laboratory tests in your clinic
    v-card
      async-confirm-dialog(ref="confirmDialog")
      generic-table(
        :headers="headersTest"
        :items="settingsLabTests"
        :pagination.sync="pagination"
        :total-items="settingsLabTestsTotal"
        :loading="loading"
        importable
        :import-headers="importHeaders"
        import-template-link="/attach/lab-tests-information.xlsx"
        import-label="Import Laboratory Tests"
        :xlsx-utils="xlsxUtils"
        @import="onImportData"
        flat
        searchable
        :search-text.sync="searchText"
        addable
        add-label="Add New Laboratory Test"
        @add="() => openDialogTest(false)"
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
          td {{ props.item.section }}
          td.justify-end.layout.px-0
            v-tooltip(bottom)
              template(slot="activator" slot-scope="tooltipProps")
                v-btn(icon @click.stop="editItemTest(props.item)")
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
                v-btn(icon @click.stop="deleteDialogTest = true; deleteTestId = props.item.id")
                  v-icon(small v-on="tooltipProps.on").error--text mdi-trash-can-outline
              span Delete
      confirm-dialog(
        :dialog.sync="deleteDialogTest"
        title="Delete Laboratory Test"
        message="Are you sure you want to delete this item?"
        primary-action="Yes"
        secondary-action="No"
        primary-color="error"
        @yes="deleteItemTest(deleteTestId)"
      )
      mc-lab-test-dialog(
        v-if="templateDialogTest"
        :new-test="newTest"
        :dialog.sync="templateDialogTest"
        :loading="loading"
        :is-editing-test="isEditingTest"
        :lab-test-ref-values="labTestRefValues"
        :test-id="testId"
        @add="v => saveTest(v)"
        @loadLabRef="v => loadLabRef(v)"
        @saveItemRef="v => saveItemRef(v)"
        @deleteItemRef="v => deleteItemRef(v)"
      )
</template>

<script>
// components
import mcLabTestDialog from './lab-test-dialog';
import GenericTable from '../../commons/generic-table';
import ConfirmDialog from '../../commons/confirm-dialog';
import AsyncConfirmDialog from '../../commons/async-confirm-dialog';
// constants
// utils
import _ from 'lodash';
import * as xlsxUtils from '../../../utils/xlsx';
import { initLogger } from '../../../utils/logger';
import { readInputFile } from '../../../utils/file';

export const COMPONENT_NAME = 'LaboratoryTestDirectory';
const log = initLogger(COMPONENT_NAME);

export default {
  components: {
    mcLabTestDialog,
    ConfirmDialog,
    GenericTable,
    AsyncConfirmDialog,
  },
  data () {
    return {
      searchText: null,
      loading: false,
      templateDialogTest: false,
      isEditingTest: false,
      deleteDialogTest: false,
      testId: null,
      pagination: {},
      newTest: {},
      deleteTestId: {},
      headersTest: [
        { text: 'Name', value: 'name', sortable: false },
        { text: 'Section', value: 'section', sortable: false },
        { text: '', value: 'action', sortable: false },
      ],
      importHeaders: [
        'name',
        'section',
        'description',
        'hl7IdentifierCod',
        'hl7IdentifierSys',
      ],
      debouncedInit: _.debounce(this.init, 250),
      // TODO: moved from settings store
      settingsLabTests: [],
      settingsLabTestsTotal: 0,
      labTestRefValues: [],
    };
  },
  watch: {
    pagination: {
      handler () {
        this.init();
      },
      deep: true,
    },
    searchText () {
      this.pagination.page = 1;
      this.debouncedInit();
    },
  },
  created () {
    this.xlsxUtils = { ...xlsxUtils };
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
            whitelist: {
              service: 'organization-members',
              method: 'find',
              localKey: 'whitelist',
              foreignKey: 'uid',
              organization: this.$activeOrganization.id,
            },
            measures: {
              service: 'diagnostic-measures',
              method: 'find',
              localKey: 'id',
              foreignKey: 'test',
            },
          },
        };

        // configure search text
        if (typeof this.searchText === 'string' && this.searchText) {
          query.$or = [
            { name: { $regex: `^${this.searchText}`, $options: 'i' } },
            { section: { $regex: `^${this.searchText}`, $options: 'i' } },
          ];
        }

        // configure pagination
        query.$limit = rowsPerPage || 20;
        query.$skip = query.$limit * ((page || 1) - 1);

        // execute ops
        const result = await this.$sdk.service('diagnostic-tests').find(query);
        this.settingsLabTestsTotal = result.total;
        this.settingsLabTests = result.items.map(({ $populated, ...i }) => ({ ...i, ...$populated }));

        log('init#settingsLabTests: %O', this.settingsLabTests);
      } catch (error) {
        console.error(error);
        log('init#error');
        this.$enqueueSnack({
          color: 'error',
          message: error.message || 'Something went wrong! Please try again.',
        });
      } finally {
        this.loading = false;
      }
    },
    async saveTest (test) {
      try {
        this.loading = true;
        if (!this.isEditingTest) {
          const data = {
            ...test,
            type: 'laboratory',
            facility: this.$activeOrganization.id,
          };
          await this.$sdk.service('diagnostic-tests').create(data);
          await this.init();
        } else {
          const updated = await this.$sdk.service('diagnostic-tests').update(this.testId, test);
          if (!updated) throw new Error('Failed to updated test');
          this.settingsLabTests = this.settingsLabTests.map(t => t.id !== updated.id ? t : updated);
        }
        this.templateDialogTest = false;
        this.$enqueueSnack({
          color: 'success',
          message: `Laboratory Test successfully ${this.isEditingTest ? 'updated' : 'created'}!`,
        });
      } catch (error) {
        console.error(error);
        log('saveTest#error');
        this.$enqueueSnack({
          color: 'error',
          message: error.message || 'There was an error. Please try again.',
        });
      } finally {
        this.loading = false;
      }
    },
    async openDialogTest (isEditing) {
      this.isEditingTest = isEditing;
      if (!this.isEditingTest) {
        this.newTest = {};
      }
      this.templateDialogTest = true;
    },
    async editItemTest (item) {
      this.newTest = _.clone(item);
      this.testId = item.id;
      this.openDialogTest(true);
    },
    async deleteItemTest (id) {
      try {
        this.loading = true;
        await this.$sdk.service('diagnostic-tests').remove(id);
        await this.init();
        this.$enqueueSnack({
          color: 'success',
          message: 'Laboratory Test deleted!',
        });
      } catch (error) {
        console.error(error);
        log('deleteItemTest#error');
        this.$enqueueSnack({
          color: 'warning',
          message: error.message || 'There was an error. Please try again.',
        });
      } finally {
        this.loading = false;
      }
    },
    async loadLabRef (id) {
      try {
        this.loading = true;
        const result = await this.$sdk.service('diagnostic-measures').get(id);
        if (!result) throw new Error('Test not found');
        this.labTestRefValues = result.referenceRanges || [];
      } catch (error) {
        console.error(error);
        log('loadLabRef#error');
        this.$enqueueSnack({
          color: 'error',
          message: error.message || 'There was an error loading the Lab refs.',
        });
      } finally {
        this.loading = false;
      }
    },
    async saveItemRef (data) {
      try {
        this.loading = true;
        const { id } = data;
        const newRef = data.data;
        const { isEditingRef } = data;
        if (isEditingRef && newRef.id) {
          const payload = {
            $pull: {
              referenceRanges: {
                id: newRef.id,
              },
            },
          };
          await this.$sdk.service('diagnostic-measures').update(id, payload);
        }
        const fields = ['min', 'max', 'simin', 'simax', 'ageMin', 'ageMax', 'sex'];
        const payload = {
          $addToSet: {
            referenceRanges: _.pickBy(_.pick(newRef, fields)),
          },
        };
        await this.$sdk.service('diagnostic-measures').update(id, payload);
        await this.loadLabRef(data.id);
        this.$enqueueSnack({
          color: 'success',
          message: `Ref successfully ${this.isEditingRef ? 'updated' : 'added'}!`,
        });
      } catch (error) {
        console.error(error);
        log('saveItemRef#error');
        this.$enqueueSnack({
          color: 'error',
          message: error.message || 'There was an error. Please try again.',
        });
      } finally {
        this.loading = false;
      }
    },
    async deleteItemRef (item) {
      try {
        this.loading = true;
        const data = {
          $pull: {
            referenceRanges: { id: item.refValue.id },
          },
        };
        await this.$sdk.service('diagnostic-measures').update(item.id, data);
        await this.loadLabRef(item.id);
        this.$enqueueSnack({
          color: 'success',
          message: 'Ref successfully deleted.',
        });
      } catch (error) {
        console.error(error);
        log('deleteItemRef#error');
        this.$enqueueSnack({
          color: 'error',
          message: error.message || 'There was an error in deleting.',
        });
      } finally {
        this.loading = false;
      }
    },
    async hideItem (item, hide) {
      try {
        const res = await this.$refs.confirmDialog.open(
          `${hide ? 'Archive' : 'Unarchive'} Test`,
          `Are you sure you want to ${hide ? 'archive' : 'unarchive'} this test?`,
          {
            primaryAction: `${hide ? 'Archive' : 'Unarchive'}`,
            primaryColor: `${hide ? 'warning' : 'success'}`,
          }
        );
        if (!res) return;

        this.loading = true;
        await this.$sdk.service('diagnostic-tests').update(item.id, { $hide: hide });
        await this.init();
        this.$enqueueSnack({
          color: 'success',
          message: `Successfully ${hide ? 'archived' : 'unarchived'} test!`,
        });
      } catch (error) {
        console.error(error);
        log('deleteItem#error');
        this.$enqueueSnack({
          color: 'error',
          message: error.message || 'There was an error. Please try again. Make sure that this test is not in use',
        });
      } finally {
        this.loading = false;
      }
    },
    async onImportData (data) {
      try {
        this.loading = true;

        log('onImportData#data: %O', data);
        const labTests = _.map(data, d => ({
          ...d,
          type: 'laboratory',
          facility: _.get(this.$activeOrganization, 'id'),
        }));
        log('onImportData#labTests: %O', labTests);

        await this.$sdk.service('diagnostic-tests').create(labTests);
        await this.init();
        this.$enqueueSnack({
          color: 'success',
          message: 'Successfully imported tests.',
        });
      } catch (error) {
        console.error(error);
        log('onImportData#error');
        this.$enqueueSnack({
          message: error.message,
          color: 'error',
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
        const contextualizedPayload = _.map(normalizedPayload, test => ({
          ...test,
          type: 'laboratory',
          facility: this.$activeOrganization.id,
        }));
        log('onImportJson#contextualizedPayload: %O', contextualizedPayload);

        const tests = await this.$sdk.service('diagnostic-tests').create(contextualizedPayload);
        const services = _.map(tests, test => ({
          facility: this.$activeOrganization.id,
          type: 'diagnostic',
          subtype: 'lab',
          ref: test.id,
          name: test.name,
        }));
        await this.$store.dispatch('services/createNewServices', services);
        await this.init();
        this.$enqueueSnack({
          message: 'Tests imported!',
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
      const data = _.map(this.settingsLabTests, test => ({
        ..._.pick(test, 'type', 'name', 'description', 'section',
          'isConfidential', 'isWhitelisted', 'hl7IdentifierCod', 'hl7IdentifierSys'),
        measures: _.map(test.measures, measure => _.pick(measure, 'name',
          'set', 'description', 'type', 'choices', 'unit', 'siunit',
          'referenceRanges', 'panicRanges', 'hl7IdentifierCod', 'hl7IdentifierSys')),
      }));
      const json = JSON.stringify(data);
      a.setAttribute('href', 'data:text/plain;charset=utf-u,' + window.encodeURIComponent(json));
      a.setAttribute('download', 'lab-tests.json');
      a.click();
    },
  },
};
</script>
