<template lang="pug">
  v-list
    v-list-tile(
      v-for="item in itemsModel"
      :key="item[extractKey]"
    )
      v-list-tile-action
        v-checkbox(
          v-model="item.selected"
          color="primary"
        )
      v-list-tile-content.py-3
        slot(name="items" :item="item")
          span {{item}}
</template>

<script>
import _ from 'lodash';

export default {
  props: {
    items: {
      type: Array,
      required: true,
    },
    extractKey: {
      type: String,
      default: 'id',
    },
    value: {
      type: Array,
      default: () => [],
    },
  },
  data () {
    return {
      itemsModel: [],
    };
  },
  computed: {
    selectedItems () {
      return _.filter(this.itemsModel, 'selected')
        .map(i => _.omit(i, 'selected'));
    },
  },
  watch: {
    items () {
      this.init();
    },
    selectedItems () {
      this.$emit('input', this.selectedItems);
    },
  },
  created () {
    this.init();
  },
  methods: {
    init () {
      this.itemsModel = _.map(this.items, i => ({
        ...i,
        selected: false,
      }));
    },
  },
};
</script>
