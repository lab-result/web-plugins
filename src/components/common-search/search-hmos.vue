<template lang="pug">
  generic-search(
    v-model="model"
    item-text="name"
    item-value="id"
    no-filter
    :items="items"
    :loading="loading"
    :label="label"
    :return-object="returnObject"
    :multiple="multiple"
    :chips="chips"
    :outline="outline"
    :no-data-text="noDataText"
    :read-only="readOnly"
    :disabled="disabled"
    :placeholder="placeholder"
    :rules="rules"
    @search="fetchHMOs"
  )
</template>

<script>
import GenericSearch from '../commons/generic-search';
import { useModel } from '../../utils/vue';
import { initLogger } from '../../utils/logger';
import _ from 'lodash';

const log = initLogger('SearchHmos');

export default {
  components: { GenericSearch },
  props: {
    // FIXME: set proper type
    value: null, // eslint-disable-line
    label: {
      type: String,
      default: undefined,
    },
    returnObject: Boolean,
    multiple: Boolean,
    chips: Boolean,
    outline: Boolean,
    noDataText: {
      type: String,
      default: undefined,
    },
    readOnly: Boolean,
    disabled: Boolean,
    rules: {
      type: Array,
      default: undefined,
    },
    placeholder: {
      type: String,
      default: 'Search HMOs',
    },
  },
  data () {
    return {
      fetchedHMOs: [],
      fetchedHMOsModelArray: null,
      loading: false,
    };
  },
  computed: {
    model: useModel(),
    normalizedModelArray () {
      return this.multiple ? this.model : [this.model];
    },
    populatedModelArray () {
      if (this.returnObject) return this.normalizedModelArray;
      return _.every(this.normalizedModelArray, _.isObject)
        ? this.normalizedModelArray
        : this.fetchedHMOsModelArray;
    },
    items () {
      return _.isEmpty(this.model)
        ? this.fetchedHMOs
        : _.unionBy(this.fetchedHMOs, this.populatedModelArray, 'id');
    },
  },
  watch: {
    model (model) {
      this.$emit('select', model);
      log('watch#model: %O', model);
      this.fetchHMOsModel();
    },
  },
  mounted () {
    this.fetchHMOs();
    this.fetchHMOsModel();
  },
  methods: {
    async fetchHMOs (searchText) {
      this.loading = true;
      try {
        const query = {
          type: 'insurance',
          subtype: 'hmo',
        };
        // build search text
        if (typeof searchText === 'string' && searchText) {
          query.name = {
            $regex: `^${searchText}`,
            $options: 'i',
          };
        }
        // TODO: configure pagination
        // execute call
        const result = await this.$sdk.service('organizations').find(query);
        log('fetchHMOs#items: %O', result.items);
        this.fetchedHMOs = result.items;
      } catch (error) {
        log('fetchHMOs#error: %O', error);
        this.$enqueueSnack({
          message: error.message || 'Something went wrong! Please try again.',
          color: 'error',
        });
      }
      this.loading = false;
    },
    async fetchHMOsModel () {
      log('fetchHMOsModel#model: %O', this.model);
      if (_.isEmpty(this.model)) return;
      if (this.returnObject) return;
      if (_.every(this.normalizedModelArray, _.isObject)) return;
      this.loading = true;
      try {
        const promises = _.map(
          this.normalizedModelArray,
          item => _.isString(item)
            ? this.$sdk.service('organizations').get(item)
            : item
        );
        this.fetchedHMOsModelArray = await Promise.all(promises);
        log('fetchHMOsModel#fetchedHMOsModelArray: %O', this.fetchedHMOsModelArray);
      } catch (error) {
        log('fetchHMOsModel#error: %O', error);
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
