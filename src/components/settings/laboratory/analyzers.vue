<template lang="pug">
  div
    h1 Manage LIS Analyzers
    p Connect your machines using HL7 Protocol
    v-card
      generic-table(
        :headers="headers"
        :items="labAnalyzers"
        :loading="loading"
        flat
        :addable="addable"
        internal-searchable
        :internal-filter="internalFilter"
        add-label="Add Analyzer"
        @add="() => openDialog(false)"
      )
        tr(slot="items" slot-scope="props")
          td {{ props.item.name }}
          td {{ props.item.description }}
          td {{ props.item.hl7SendingApplication }}
          td.justify-end.layout.px-0
            v-btn(v-if="canUpdate" icon @click.stop="editItem(props.item)")
              v-icon(small).primary--text mdi-pencil
            v-btn(v-if="canDelete" icon @click.stop="deleteDialog = true; itemToDelete = props.item.id")
              v-icon(small).error--text mdi-trash-can-outline
      confirm-dialog(
        :dialog.sync="deleteDialog"
        title="Delete Laboratory Analyzer"
        message="Are you sure you want to delete this item?"
        primary-action="Yes"
        secondary-action="No"
        primary-color="error"
        @yes="deleteAnalyzer(itemToDelete)"
      )
    v-dialog(
      v-model="templateDialog"
      width="600"
      persistent
      scrollable
    )
      v-card
        v-toolbar(flat)
          v-toolbar-title
            h4(v-if="!isEditing") Add New Analyzer
            h4(v-else) Edit Analyzer
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
                  v-model="newAnalyzer.name"
                  flat
                  outline
                  label="* Analyzer Name"
                  placeholder="e.g. Blood Chemistry Analyzer"
                  :rules="genericFieldRules"
                  :disabled="loading"
                )
              v-flex(xs12).pa-1
                v-textarea(
                  v-model="newAnalyzer.description"
                  outline
                  label="Description"
                  placeholder=""
                  :disabled="loading"
                )
              v-flex(xs12).pa-1
                v-text-field(
                    v-model="newAnalyzer.hl7ReceivingFacility"
                    flat
                    outline
                    label="HL7 Receiving Facility"
                    :disabled="loading"
                  )
              v-flex(xs12).pa-1
                v-text-field(
                    v-model="newAnalyzer.hl7ReceivingApplication"
                    flat
                    outline
                    label="HL7 Receiving Application"
                    :disabled="loading"
                  )
        v-divider
        v-card-actions
          v-spacer
          v-btn(
            color="primary"
            :loading="loading"
            @click.stop="saveAnalyzer"
          ) {{ isEditing ? 'Update' : 'Save' }}
          v-btn(
            flat
            color="error"
            :disabled="loading"
            @click.stop="templateDialog = false"
          ) Cancel
</template>

<script>
import _ from 'lodash';
import ConfirmDialog from '../../commons/confirm-dialog';
import GenericTable from '../../commons/generic-table';
import { permitPrivileges } from '../../../../src/utils/permissions';
import { initLogger } from '../../../utils/logger';

export const COMPONENT_NAME = 'LaboratoryAnalyzers';
const log = initLogger(COMPONENT_NAME);

export default {
  components: {
    ConfirmDialog,
    GenericTable,
  },
  data () {
    return {
      searchString: '',
      loading: false,
      valid: false,
      isEditing: false,
      templateDialog: false,
      itemToDelete: {},
      deleteDialog: false,
      newAnalyzer: {},
      headers: [
        { text: 'Name', value: 'name' },
        { text: 'Description', value: 'description' },
        { text: 'Sending App', value: 'hl7SendingApplication' },
        { text: '', value: 'action', sortable: false },
      ],
      // NOTE: moved from settings store
      labAnalyzers: [],
    };
  },
  computed: {
    addable () {
      return permitPrivileges(this.$activeMembership, ['lis_analyzersCreate']);
    },
    canUpdate () {
      return permitPrivileges(this.$activeMembership, ['lis_analyzersUpdate']);
    },
    canDelete () {
      return permitPrivileges(this.$activeMembership, ['lis_analyzersDelete']);
    },
  },
  async created () {
    await this.init();
  },
  methods: {
    async init () {
      try {
        this.loading = true;
        const query = {
          facility: this.$activeOrganization.id,
        };
        // TODO: configure pagination
        // execute ops
        const result = await this.$sdk.service('diagnostic-analyzers').find(query);
        this.labAnalyzers = result.items;
      } catch (error) {
        log('init#error: %O', error);
        this.$enqueueSnack({
          message: error.message || 'Something weng wrong! Please try again',
          color: 'error',
        });
      } finally {
        this.loading = false;
      }
    },
    internalFilter (items, searchString) {
      if (!searchString) {
        return items;
      }
      const regex = new RegExp(`^${searchString.trim()}`, 'i');
      return items.filter(anal => {
        return regex.test(anal.name);
      });
    },
    openDialog (isEditing) {
      this.isEditing = isEditing;
      if (!isEditing) { this.newAnalyzer = _.mapValues(this.newAnalyzer, () => ''); }
      this.$refs.form.resetValidation();
      this.templateDialog = true;
    },
    async saveAnalyzer () {
      try {
        this.valid = this.$refs.form.validate();
        if (this.valid) {
          this.loading = true;
          if (!this.isEditing) {
            const data = {
              ...this.newAnalyzer,
              facility: this.$activeOrganization.id,
            };
            const created = await this.$sdk.service('diagnostic-analyzers').create(data);
            this.labAnalyzers.push(created);
          } else {
            const analyzerToEdit = _.pick(this.newAnalyzer, ['name', 'description']);
            const updated = await this.$sdk.service('diagnostic-analyzers').update(this.newAnalyzer.id, analyzerToEdit);
            if (!updated) throw new Error('Failed to update analyzer');
            this.labAnalyzers = this.labAnalyzers.map(a => a.id !== updated.id ? a : updated);
          }
          this.templateDialog = false;
          this.newAnalyzer = _.mapValues(this.newAnalyzer, () => '');
          this.$enqueueSnack({
            color: 'success',
            message: `Laboratory Analyzer successfully ${this.isEditing ? 'updated' : 'added'}!`,
          });
        } else {
          this.$enqueueSnack({
            color: 'warning',
            message: 'Please make sure to fill the required fields.',
          });
        }
      } catch (error) {
        log('saveAnalyzer#error: %O', error);
        this.$enqueueSnack({
          color: 'error',
          message: error.message || 'There was an error. Please try again later.',
        });
      } finally {
        this.loading = false;
      }
    },
    async deleteAnalyzer (item) {
      try {
        this.loading = true;
        await this.$sdk.service('diagnostic-analyzers').remove(item);
        await this.init();
        this.$enqueueSnack({
          color: 'success',
          message: 'Laboratory Analyzer deleted!',
        });
      } catch (error) {
        log('deleteAnalyzer#error: %O', error);
        this.$enqueueSnack({
          color: 'error',
          message: error.message || 'There was an error. Please try again.',
        });
      } finally {
        this.loading = false;
      }
    },
    editItem (item) {
      this.newAnalyzer = _.clone(item);
      this.openDialog(true);
    },
  },
};
</script>
