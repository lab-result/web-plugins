<template lang="pug">
  div
    h1 Terminology Settings
    p Customize labels and terms in your clinic.
    v-card.mt-3
      v-card-text
        v-form
          table(width="100%")
            thead
              tr.inactive-cell
                th.pa-2 Original Text
                th.pa-2 Custom Text
            tbody
              template(v-for="(group, groupName) in fields")
                tr
                  td(colspan="2").pa-2
                    b.primary--text {{groupName}}
                tr(v-for="(field, key) in group")
                  td.pl-4.font-weight-bold {{field.text}}
                  td.pa-2
                    v-text-field(
                      v-model="model[field.key]"
                      solo
                      label="Type here..."
                      hide-details
                      flat
                    )
      v-divider
      v-card-actions
        v-spacer
        v-btn(
          depressed
          large
          color="success"
          :loading="loading"
          :disabled="loading"
          @click="save()"
        ) Update
</template>

<script>
import { LANGUAGE_SETTINGS } from './constants';
import _ from 'lodash';
import { initLogger } from '../../../utils/logger';

export const COMPONENT_NAME = 'ClinicLangSettings';
const log = initLogger(COMPONENT_NAME);

export default {
  data () {
    return {
      loading: false,
      model: _.reduce(
        LANGUAGE_SETTINGS,
        (acc, setting) => ({ ...acc, [setting.key]: null }),
        {}
      ),
    };
  },
  computed: {
    fields () {
      return _.groupBy(LANGUAGE_SETTINGS, 'group');
    },
    activeOrganization () {
      return this.$activeOrganization || {};
    },
  },
  created () {
    this.$initLogger(COMPONENT_NAME);
    this.init();
  },
  methods: {
    init () {
      const org = this.activeOrganization;
      const languages = _.get(org, 'configFacility.languages');
      log('init#languages', languages);
      this.model = languages || {};
    },
    save () {
      this.updateClinic();
    },
    async updateClinic () {
      try {
        this.loading = true;
        const data = { configFacility: { languages: this.model } };
        await this.$store.dispatch('organizations/updateOrganization', { data });
        this.$enqueueSnack({
          color: 'success',
          message: 'Successfuly updated configuration.',
        });
        this.init();
      } catch (error) {
        log('updateClinic#error: %O', error);
        this.$enqueueSnack({
          color: 'error',
          message: error.message || 'Something went wrong! Please try again.',
        });
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
  table {
    border-collapse: collapse;
  }

  table, th, td {
    border: 1px solid lightgrey;
  }

  .inactive-cell {
    background-color: #f5f5f5;
  }

  .clickable-cell:hover {
    cursor: pointer;
  }
</style>
