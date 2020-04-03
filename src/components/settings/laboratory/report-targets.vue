<template lang="pug">
  div
    h1 Manage Specimen Report Recipients
    p Add entities for whom specimen reports will be prepared
    generic-table(
      :headers="headers"
      :items="reportTargets"
      :loading="loading"
      flat
      addable
      add-label="Add Recipient"
      @add="showCreateRow"
      internal-searchable
      slotted-footer
    ).elevation-1
      tr(slot="items" slot-scope="props")
        td {{ props.item }}
        td.justify-end.layout.px-0
          v-btn(icon @click.stop="deleteDialog = true; deleteTarget = props.item")
            v-icon(small).error--text mdi-trash-can-outline
      tr(slot="footer" v-if="createRow")
        td.pt-4
          div#rowForm
            v-form(ref="form" v-model="valid" lazy-validation @submit.prevent="saveItem")
              v-layout(row align-center)
                v-flex(grow)
                  v-text-field(
                    v-model="newTarget"
                    label="Recipient"
                    placeholder="e.g. Claims"
                    :rules="genericFieldRules"
                    :disabled="loading"
                    outline
                  )
        td(align="center")
          v-btn(
            depressed
            color="success"
            type="submit"
            :loading="loading"
            @click.stop="saveItem"
          ) Add
          v-btn(
            depressed
            :loading="loading"
            @click.stop="hideCreateRow"
          ) Cancel
    confirm-dialog(
      :dialog.sync="deleteDialog"
      title="Delete Recipient"
      message="Are you sure you want to delete this item?"
      primary-action="Yes"
      secondary-action="No"
      primary-color="error"
      @yes="deleteItem(deleteTarget)"
    )
</template>

<script>
// components
import GenericTable from '../../commons/generic-table';
import ConfirmDialog from '../../commons/confirm-dialog';
// constants
// utils
import _ from 'lodash';
import VueScrollTo from 'vue-scrollto';
import { initLogger } from '../../../utils/logger';

const log = initLogger('SettingsLaboratoryReportTargets');

export default {
  components: {
    ConfirmDialog,
    GenericTable,
  },
  data () {
    return {
      search: '',
      loading: false,
      valid: false,
      createRow: false,
      deleteDialog: false,
      newTarget: '',
      deleteTarget: '',
      headers: [
        { text: 'Recipients', value: 'reportTarget', sortable: false },
        { text: '', value: 'action', sortable: false },
      ],
      reportTargets: [],
    };
  },
  computed: {
    activeOrganization () {
      return this.$activeOrganization;
    },
  },
  created () {
    this.init();
  },
  methods: {
    init () {
      this.reportTargets = this.activeOrganization?.configLIS?.orderTestsReportTargets || [];
    },
    showCreateRow () {
      this.createRow = true;
      this.$nextTick(() => VueScrollTo.scrollTo('#rowForm', 500, { easing: 'ease' }));
    },
    hideCreateRow () {
      this.newTarget = '';
      this.createRow = false;
    },
    async saveItem () {
      if (this.$refs.form.validate()) {
        try {
          this.loading = true;
          this.valid = this.$refs.form.validate();
          if (this.valid) {
            log('saveItem#newTarget: %O', this.newTarget);
            const reportTargets = _.concat(this.reportTargets, this.newTarget);
            log('saveItem#reportTargets: %O', reportTargets);
            this.loading = true;
            const data = { configLIS: { orderTestsReportTargets: reportTargets } };
            const res = await this.$store.dispatch('organizations/updateOrganization', { data });
            this.reportTargets = res?.configLIS?.orderTestsReportTargets || [];
            this.$enqueueSnack({
              color: 'success',
              message: 'Successfully added!',
            });
            this.hideCreateRow();
            this.$refs.form.resetValidation();
          }
        } catch (error) {
          console.error(error);
          log('saveItem#error');
          this.$enqueueSnack({
            color: 'error',
            message: error.message,
          });
        } finally {
          this.loading = false;
        }
      }
    },
    async deleteItem (item) {
      try {
        this.loading = true;
        const reportTargets = _.reject(this.reportTargets, target => target === item);
        const data = { configLIS: { orderTestsReportTargets: reportTargets } };
        const res = await this.$store.dispatch('organizations/updateOrganization', { data });
        this.reportTargets = res?.configLIS?.orderTestsReportTargets || [];
        this.$enqueueSnack({
          color: 'success',
          message: 'Successfully removed!',
        });
      } catch (error) {
        console.error(error);
        log('deleteItem#error');
        this.$enqueueSnack({
          color: 'error',
          message: error.message,
        });
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>
