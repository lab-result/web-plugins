<template lang="pug">
  div
    generic-search(
      chips
      no-filter
      :box="box"
      :disabled="disabled"
      :flat="flat"
      :hide-details="hideDetails"
      :item-value="itemValue"
      :item-text="itemText"
      :items="items"
      :label="label"
      :loading="loading"
      :multiple="multiple"
      :outline="outline"
      :rules="rules"
      :single-line="outline"
      :slotted="true"
      :solo-inverted="soloInverted"
      :solo="solo"
      :value="value"
      @search="searchItem"
      @select="selectItem"
    )
      template(slot="label") Search Diagnosis Code
        span(v-if="required").error--text *
      template(slot="selection" slot-scope="props")
        span {{props.item.code}} - {{props.item.text}}
      template(slot="item" slot-scope="props")
        v-list-tile-content
          v-list-tile-title {{props.item.code}} - {{props.item.text}}
          //- v-list-tile-sub-title
</template>

<script>
// components
import { Money } from 'v-money';
import GenericSearch from '../commons/generic-search';
// utils
import _ from 'lodash';

export default {
  components: {
    GenericSearch,
    Money,
  },
  props: {
    box: Boolean,
    outline: Boolean,
    flat: Boolean,
    solo: Boolean,
    soloInverted: Boolean,
    // FIXME: assign proper type
    value: null, // eslint-disable-line
    filters: {
      type: Array,
      default: null,
    },
    label: {
      type: String,
      default: 'Search ICD10',
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
    type: {
      type: String,
      default: undefined,
    },
    account: {
      type: String,
      default: undefined,
    },
    itemValue: {
      type: String,
      default: 'id',
    },
    itemText: {
      type: String,
      default: undefined,
    },
    loading: Boolean,
    required: Boolean,
  },
  data () {
    return {
      data: [],
      loadingICD10: false,
    };
  },
  computed: {
    selectedItem: {
      get () {
        return this.value;
      },
      set (value) {
        this.$emit('input', value);
        this.$emit('select', value);
      },
    },
    items () {
      if (!_.isEmpty(this.value)) {
        return _.union(this.data, [this.value]);
      } else {
        return this.data;
      }
    },
  },
  created () {
    this.loadingICD10 = this.loading;
    this.init();
  },
  methods: {
    async init () {
      try {
        this.loadingICD10 = true;
        this.loadItems();
      } catch (error) {
        console.error(error);
        this.$enqueueSnack({
          color: 'error',
          message: error.message,
        });
      } finally {
        this.loadingICD10 = false;
      }
    },
    async loadItems (searchString) {
      try {
        const query = {};
        if (searchString) query.searchString = searchString;
        this.data = await this.$store.dispatch('fixtures/getICD10Fixtures', query);
      } catch (e) {
        console.error(e);
      }
    },
    searchItem (searchString) {
      this.loadItems(searchString, true);
    },
    selectItem (value) {
      this.selectedItem = _.cloneDeep(value);
    },
  },
};
</script>

<style scoped>
.status-color {
  height: 15px;
  width: 15px;
}
</style>
