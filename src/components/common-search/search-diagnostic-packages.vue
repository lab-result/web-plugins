<template lang="pug">
  div
    generic-search(
      v-model="model"
      slotted
      no-filter
      :box="box"
      :disabled="disabled"
      :flat="flat"
      :hide-details="hideDetails"
      item-text="name"
      :item-value="itemValue"
      :items="items"
      :label="label"
      :loading="loading"
      :multiple="multiple"
      :outline="outline"
      :rules="rules"
      :single-line="outline"
      :solo-inverted="soloInverted"
      :solo="solo"
      :value="value"
      :height="height"
      :return-object="returnObject"
      :deletable-chips="deletableChips"
      @search="fetchItems"
    )
      template(#item="{ item }")
        v-list-tile-action(v-if="multiple")
          v-icon(v-if="isSelected(item)") mdi-checkbox-marked
          v-icon(v-else) mdi-checkbox-blank-outline
        v-list-tile-content
          v-list-tile-title {{ item.name }}
          v-list-tile-sub-title(v-if="!!item.tests")
            span {{ showIncludedTests(item.tests)}}
      template(#selection="{ item }")
        v-chip {{ item.name }}
</template>

<script>
// components
import GenericSearch from '../commons/generic-search';
// constants
// utils
import _ from 'lodash';
import { useModel } from '../../utils/vue';
import { initLogger } from '../../utils/logger';
import { normalizePopulated } from '../../utils';

const log = initLogger('SearchDiagnosticPackages');

export default {
  components: { GenericSearch },
  props: {
    box: Boolean,
    outline: Boolean,
    flat: Boolean,
    solo: Boolean,
    soloInverted: Boolean,
    value: {
      type: [Object, Array, String],
      default: null,
    },
    filters: {
      type: Array,
      default: null,
    },
    label: {
      type: String,
      default: 'Search...',
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    rules: {
      type: Array,
      default: () => [],
    },
    hideDetails: Boolean,
    multiple: Boolean,
    height: {
      type: String,
      default: undefined,
    },
    type: {
      type: String,
      default: undefined,
    },
    itemValue: {
      type: String,
      default: 'id',
    },
    returnObject: {
      type: Boolean,
      default: true,
    },
    deletableChips: Boolean,
  },
  data () {
    return {
      fetchedItems: [],
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
        : this.fetchedItemsModelArray;
    },
    items () {
      return _.isEmpty(this.model)
        ? this.fetchedItems
        : _.unionBy(this.fetchedItems, this.populatedModelArray, this.itemValue);
    },
  },
  watch: {
    model (model) {
      log('watch#model: %0', model);
      this.$emit('select', model);
      this.fetchItemsModel();
    },
    type (newVal, oldVal) {
      if (newVal !== oldVal) {
        this.fetchItems();
      }
    },
  },
  mounted () {
    this.fetchItems();
    this.fetchItemsModel();
  },
  methods: {
    async fetchItems (searchString) {
      log(`fetchItems#searchString: ${searchString}`);
      this.loading = true;
      try {
        const query = {
          facility: this.$activeOrganization.id,
          $limit: 20,
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

        if (this.type) query.type = this.type;

        // configure search
        if (typeof searchString === 'string' && searchString) {
          query.name = {
            $regex: `^${searchString}`,
            $options: 'i',
          };
        }

        // TODO: configure pagination
        // execute ops
        const result = await this.$sdk.service('diagnostic-packages').find(query);
        this.fetchedItems = normalizePopulated(result.items || []);

        log('fetchItems#fetchedItems: %O', this.fetchedItems);
      } catch (error) {
        log('fetchItems#error: %O', error);
        this.$enqueueSnack({
          message: 'Something went wrong! Please try again.',
          color: 'error',
        });
      }
      this.loading = false;
    },
    async fetchItemsModel () {
      log('fetchItemsModel#model: %O', this.model);
      if (_.isEmpty(this.model)) return;
      if (this.returnObject) return;
      if (_.every(this.normalizedModelArray, _.isObject)) return;
      this.loading = true;
      try {
        const promises = _.map(
          this.normalizedModelArray,
          item => _.isString(item)
            ? this.$store.dispatch('diagnostic/getDiagnosticTestById', item) ||
              this.$sdk.service('diagnostic-packages').get(item)
            : item
        );
        this.fetchedItemsModelArray = await Promise.all(promises);
        log('fetchItemsModel#fetchedItemsModelArray: %O', this.fetchedItemsModelArray);
      } catch (error) {
        log('fetchItemsModel#error: %O', error);
        this.$enqueueSnack({
          message: 'Something went wrong! Please try again.',
          color: 'error',
        });
      }
      this.loading = false;
    },
    isSelected (selectedValue) {
      const valueIds = _.map(this.model, item => {
        if (_.isObject(item)) return item.id;
        return item;
      });
      let selectedValueId = selectedValue;
      if (_.isObject(selectedValueId)) selectedValueId = selectedValue.id;
      return valueIds.includes(selectedValueId);
    },
    showIncludedTests (tests) {
      const testNames = (tests || []).map(test => test.name)
        .join(', ');
      return testNames;
    },
  },
};
</script>
