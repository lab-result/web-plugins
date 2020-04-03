<template lang="pug">
  v-layout(column)
    v-text-field(
      v-model="searchText"
      :append-icon="searchIcon"
      label="Search"
      single-line
      hide-details
      :solo="solo"
      :flat="flat"
      clearable
    ).mt-1
    .mc-scroll
      v-list(
        :two-line="!threeLine"
        :three-line="threeLine"
      )
        template(v-for="(item, i) in items")
          slot(:item="item")
            v-list-tile(
              :key="item | get-key(keyField, i)"
              @click="$emit('select', item)"
            )
              v-list-tile-content
                v-list-tile-title {{item}}
</template>

<script>
import _ from 'lodash';
import { initLogger } from '../../utils/logger';

const log = initLogger('GenericPicker');

export default {
  filters: {
    getKey (item, keyField, index) {
      if (_.isString(item)) return item;
      if (!_.isObject(item)) return index;
      if (!_.isEmpty(keyField) && !_.isEmpty(item[keyField])) {
        return item[keyField];
      }

      return index;
    },
  },
  props: {
    loading: {
      type: Boolean,
      default: undefined,
    },
    items: {
      type: Array,
      required: true,
    },
    keyField: {
      type: String,
      default: undefined,
    },
    hasMore: {
      type: Boolean,
      default: undefined,
    },
    solo: {
      type: Boolean,
      default: true,
    },
    flat: {
      type: Boolean,
      default: undefined,
    },
    threeLine: {
      type: Boolean,
      default: false,
    },
  },
  data () {
    return {
      searchText: null,
      debouncedSearch: _.debounce(this.search, 1000),
    };
  },
  computed: {
    searchIcon () {
      return _.isEmpty(this.searchText) ? 'mdi-magnify' : null;
    },
  },
  watch: {
    searchText () {
      this.debouncedSearch();
    },
  },
  methods: {
    search () {
      log(`search#searchText: ${this.searchText}`);
      this.$emit('search', this.searchText);
    },
  },
};
</script>

<style scoped>
.mc-scroll {
  max-height: 300px;
  overflow-y: auto;
}
</style>
