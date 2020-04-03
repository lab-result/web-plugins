<template lang="pug">
  div
    template(v-if="slotted")
      v-autocomplete(
        v-model="model"
        :loading="loading"
        :flat="flat"
        :items="itemsData"
        :search-input.sync="searchText"
        :filter="filter"
        :no-filter="noFilter"
        :item-text="itemText"
        :item-value="itemValue"
        :multiple="multiple"
        :return-object="returnObject"
        :solo="solo"
        :box="box"
        :outline="outline"
        :single-line="singleLine"
        prepend-inner-icon="mdi-magnify"
        :label="label"
        hide-details
        @change="select"
        :clearable="!readOnly && clearable"
        :hint="hint"
        :readonly="readOnly"
        :hide-no-data="!searchText || loading"
        :placeholder="placeholder"
        :rules="rules"
        :required="required"
        :disabled="disabled"
        :hide-selected="hideSelected"
        :append-icon="appendIcon"
        :append-outer-icon="appendIconOuter"
        :chips="chips"
        :deletable-chips="deletableChips"
        :height="height"
      )
        template(slot="no-data")
          slot(name="no-data")
            v-layout(row)
              v-flex(xs12).px-3
                strong {{ noDataText }}
        template(slot="selection" slot-scope="data")
          slot(name="selection" :item="data.item")
        template(slot="item" slot-scope="data")
          slot(name="item" :item="data.item")
        template(slot="append")
          slot(name="append")
        template(slot="label")
          slot(name="label")
    template(v-else)
      v-autocomplete(
        v-model="model"
        :loading="loading"
        :flat="flat"
        :items="itemsData"
        :search-input.sync="searchText"
        :filter="filter"
        :no-filter="noFilter"
        :item-text="itemText"
        :item-value="itemValue"
        :multiple="multiple"
        :return-object="returnObject"
        :solo="solo"
        :box="box"
        :outline="outline"
        :single-line="singleLine"
        :chips="chips"
        :deletable-chips="deletableChips"
        prepend-inner-icon="mdi-magnify"
        :label="label"
        hide-details
        @change="select"
        :clearable="!readOnly && clearable"
        :hint="hint"
        :readonly="readOnly"
        :hide-no-data="!searchText || loading"
        :placeholder="placeholder"
        :rules="rules"
        :required="required"
        :disabled="disabled"
        :hide-selected="hideSelected"
        :append-icon="appendIcon"
        :append-outer-icon="appendIconOuter"
        :height="height"
      )
        template(slot="no-data")
          v-layout(row)
            v-flex(xs12).px-3
              strong {{ noDataText }}
        template(slot="append")
          slot(name="append")
        template(slot="label")
          slot(name="label")
</template>

<script>
import _ from 'lodash';
import { initLogger } from '../../utils/logger';

const log = initLogger('GenericSearch');

export default {
  props: {
    readOnly: {
      type: Boolean,
      default: undefined,
    },
    required: {
      type: Boolean,
      default: undefined,
    },
    items: {
      type: Array,
      required: true,
    },
    // FIXME: assign proper type
    value: null, // eslint-disable-line
    flat: {
      type: Boolean,
      default: undefined,
    },
    filter: {
      type: Function,
      default: undefined,
    },
    noFilter: {
      type: Boolean,
      default: undefined,
    },
    itemText: {
      type: [String, Array, Function],
      default: undefined,
    },
    itemValue: {
      type: [String, Array, Function],
      default: undefined,
    },
    label: {
      type: String,
      default: 'Search',
    },
    placeholder: {
      type: String,
      default: null,
    },
    slotted: {
      type: Boolean,
      default: undefined,
    },
    multiple: {
      type: Boolean,
      default: undefined,
    },
    chips: {
      type: Boolean,
      default: undefined,
    },
    deletableChips: {
      type: Boolean,
      default: undefined,
    },
    noDataText: {
      type: String,
      default: 'No data available',
    },
    solo: {
      type: Boolean,
      default: undefined,
    },
    box: {
      type: Boolean,
      default: undefined,
    },
    outline: {
      type: Boolean,
      default: undefined,
    },
    singleLine: {
      type: Boolean,
      default: undefined,
    },
    hint: {
      type: String,
      default: undefined,
    },
    loading: {
      type: Boolean,
      default: undefined,
    },
    rules: {
      type: Array,
      default: undefined,
    },
    disabled: {
      type: Boolean,
      default: undefined,
    },
    hideSelected: {
      type: Boolean,
      default: undefined,
    },
    clearable: {
      type: Boolean,
      default: true,
    },
    returnObject: {
      type: Boolean,
      default: true,
    },
    appendIcon: {
      type: String,
      default: undefined,
    },
    appendIconOuter: {
      type: String,
      default: undefined,
    },
    height: {
      type: [Number, String],
      default: undefined,
    },
  },
  data () {
    return {
      itemsData: this.items,
      searchText: _.get(this.value, this.itemText) || '',
      debouncedSearchText: _.debounce(this.search, 500),
    };
  },
  computed: {
    model: {
      get () {
        return this.value;
      },
      set (val) {
        this.$emit('input', val);
      },
    },
  },
  watch: {
    searchText (val) {
      this.debouncedSearchText(val);
    },
    itemsData (val, oldVal) {
      if (_.isEmpty(val)) return;
      const items = val.filter(item => !Object.prototype.hasOwnProperty.call(item, 'header'));
      if (!items.length) this.itemsData = items;
    },
    items (val) {
      this.itemsData = val;
    },
  },
  methods: {
    search (searchText) {
      log(`search: ${searchText}`);
      this.$emit('search', searchText);
    },
    select (item) {
      log('select', item);
      this.$emit('select', item);
    },
  },
};
</script>
