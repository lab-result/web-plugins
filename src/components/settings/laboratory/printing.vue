<template lang="pug">
  div
    h1 Manage Lab Test Printing Settings
    p Control print layout settings for lab tests
    v-card
      v-card-text
        v-checkbox(
          v-model="showIndicatorsOnPrint"
          color="primary"
          label="Show arrow indicators on print"
        )
        v-layout(row)
          v-flex(xs6)
            p
              | Arrow indicators such as
              v-icon(color="error" small).mx-1 mdi-arrow-up
              | or
              v-icon(color="error" small).mx-1 mdi-arrow-down
              | are used to mark lab test values that fall outside normal ranges.
            p
              | Check the box to display these indicators in the printout as well.

        v-checkbox(
          v-model="showRemarksOnPrint"
          color="primary"
          label="Show remarks on print"
        )
        v-layout(row)
          v-flex(xs6)
            p
              | Check the box to display user-input remarks in the printout.
</template>

<script>
import { initLogger } from '../../../utils/logger';
import { get } from 'lodash';

const log = initLogger('SettingsLaboratoryPrinting');

export default {
  computed: {
    activeOrganization () {
      return this.$activeOrganization;
    },
    showIndicatorsOnPrint: {
      get () {
        return get(this.activeOrganization, 'configLIS.showIndicatorsOnPrint');
      },
      set (value) {
        this.updateConfigLIS('showIndicatorsOnPrint', value);
      },
    },
    showRemarksOnPrint: {
      get () {
        return get(this.activeOrganization, 'configLIS.showRemarksOnPrint');
      },
      set (value) {
        this.updateConfigLIS('showRemarksOnPrint', value);
      },
    },
  },
  methods: {
    async updateConfigLIS (key, value) {
      try {
        const data = { configLIS: { [key]: value } };
        await this.$store.dispatch('organizations/updateOrganization', { data });
        this.$enqueueSnack({
          message: 'Config saved!',
          color: 'success',
        });
      } catch (error) {
        log('updateOrganization#error: %O', error);
        this.$enqueueSnack({
          message: error.message,
          color: 'error',
        });
      }
    },
  },
};
</script>
