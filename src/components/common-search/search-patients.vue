<template lang="pug">
  generic-search(
    v-model="model"
    :items="items"
    :loading="loading"
    :label="label"
    :item-value="itemValue"
    :return-object="returnObject"
    :multiple="multiple"
    :chips="chips"
    :outline="outline"
    :no-data-text="noDataText"
    no-filter
    :single-line="singleLine"
    :hide-details="hideDetails"
    :solo="solo"
    :flat="flat"
    :clearable="clearable"
    :disabled="disabled"
    slotted
    @search="fetchPatients"
  )
    template(#selection="{ item }")
      v-chip
        v-avatar
          img(v-if="item.picURL" :src="item.picURL")
          img(v-else src="@/assets/images/person-placeholder.png")
        | {{ item.name | prettify-name-first }}
    template(#item="{ item }")
      v-list-tile-avatar
        img(v-if="item.picURL" :src="item.picURL")
        img(v-else src="@/assets/images/person-placeholder.png")
      v-list-tile-content
        v-list-tile-title {{ item.name | prettify-name-first }}
</template>

<script>
// components
import GenericSearch from '../commons/generic-search';
// constants
// utils
import _ from 'lodash';
import { useModel } from '../../utils/vue';
import { initLogger } from '../../utils/logger';
import { getPatient } from '../../services/patients';

const log = initLogger('SearchPatients');

export default {
  components: { GenericSearch },
  props: {
    // FIXME: assign proper type
    value: null, // eslint-disable-line
    type: {
      type: String,
      default: undefined,
    },
    label: {
      type: String,
      default: 'Search by Patient',
    },
    returnObject: {
      type: Boolean,
      default: false,
    },
    multiple: {
      type: Boolean,
      default: false,
    },
    chips: {
      type: Boolean,
      default: false,
    },
    outline: {
      type: Boolean,
      default: false,
    },
    noDataText: {
      type: String,
      default: undefined,
    },
    itemValue: {
      type: String,
      default: 'id',
    },
    singleLine: {
      type: Boolean,
      default: false,
    },
    hideDetails: {
      type: Boolean,
      default: false,
    },
    solo: {
      type: Boolean,
      default: false,
    },
    flat: {
      type: Boolean,
      default: false,
    },
    clearable: {
      type: Boolean,
      default: false,
    },
    slotted: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  data () {
    return {
      fetchedPatients: [],
      fetchedPatientsModelArray: null,
      loading: false,
    };
  },
  computed: {
    // model is meant to be either a patient or an array of patients, controlled by v-model
    model: useModel(),
    // normalizedModelArray is always an array,
    // normalizing the two cases of this.multiple
    normalizedModelArray () {
      return this.multiple ? this.model : [this.model];
    },
    // populatedModel is always populated as a object, never a raw id
    // normalizing the two cases of whether normalizedModelArray contains ids or objects
    populatedModelArray () {
      if (this.returnObject) return this.normalizedModelArray;
      // if some items in normalizedModelArray are not objects,
      // fetchPatientsModel will fetch an array of populated patients
      // and place it into fetchedPatientsModelArray
      return _.every(this.normalizedModelArray, _.isObject)
        ? this.normalizedModelArray
        : this.fetchedPatientsModelArray;
    },
    items () {
      // always keep model in items
      // to avoid disappearing model when searching
      return _.isEmpty(this.model)
        ? this.fetchedPatients
        // make sure to use populatedModelArray here
        // because model can sometimes be an unpopulated id or an array of unpopulated ids
        : _.unionBy(this.fetchedPatients, this.populatedModelArray, this.itemValue);
    },
  },
  watch: {
    model (model) {
      // mirror other common-search components' interface: emit 'select' on select
      this.$emit('select', model);

      // re-fetch if needed
      this.fetchPatientsModel();
    },
  },
  mounted () {
    this.fetchPatients();
    this.fetchPatientsModel();
  },
  methods: {
    async fetchPatients (searchString) {
      log(`fetchPatients#searchString: ${searchString}`);
      this.loading = true;
      const configInsurer = _.get(this.$activeOrganization, 'configInsurer.insurer');
      try {
        const parent = _.get(this.$activeOrganization, 'parent.id') ||
          _.get(this.$activeOrganization, 'parent');
        const includeOrganizationChildren = !!parent ||
          !_.isEmpty(this.$activeOrganization._ch);
        const organization = parent || this.$activeOrganization.id;
        this.fetchedPatients = await this.$store.dispatch('patientsv5/getPatients', {
          organization,
          includeOrganizationChildren,
          searchString,
          configInsurer,
          limit: 20,
        });
        log('fetchPatients#patients: %O', this.fetchedPatients);
      } catch (error) {
        log('fetchPatients#error: %O', error);
        this.$enqueueSnack({
          message: 'Something went wrong! Please try again.',
          color: 'error',
        });
      }
      this.loading = false;
    },
    async fetchPatientsModel () {
      log('fetchPatientsModel#model: %O', this.model);
      if (_.isEmpty(this.model)) return;

      // fetch only if patients are ids and place into fetchedPatientsModelArray
      // use normalizedModelArray for simplicity, which is always an array
      if (this.returnObject) return;
      if (_.every(this.normalizedModelArray, _.isObject)) return;

      this.loading = true;
      try {
        const promises = _.map(
          this.normalizedModelArray,
          // fetch only if item is an id
          item => _.isString(item)
            ? getPatient(this.$sdk, { id: item })
            : item
        );
        this.fetchedPatientsModelArray = await Promise.all(promises);
        log('fetchPatientsModel#fetchedPatientsModelArray: %O', this.fetchedPatientsModelArray);
      } catch (error) {
        console.error(error);
        log('fetchPatientsModel#error');
        this.$enqueueSnack({
          message: error.message || 'Something went wrong! Please try again.',
          color: 'error',
        });
      }
      this.loading = false;
    },
  },
};
</script>
