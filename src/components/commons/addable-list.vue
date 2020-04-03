<template lang="pug">
  v-layout(column)
    v-layout(
      v-for="(item, index) in items"
      :key="item | chooseKey(normalizedKeys)"
      row
      align-center
    )
      v-flex(xs11)
        slot(:item="item" :index="index")
          pre {{item}}
      v-flex(xs1)
        v-btn(
          icon
          small
          @click="onDelete({ item, index })"
        )
          v-icon(dark color="error") mdi-close
    v-flex(v-if="addable")
      v-btn(
        v-if="fab"
        fab
        icon
        dark
        small
        color="primary"
        :disabled="disabled"
        @click="$emit('add')"
      )
        v-icon(dark) mdi-plus
      v-btn(
        v-else
        color="primary"
        :disabled="disabled"
        @click="$emit('add')"
      ) {{addLabel}}
</template>

<script>
import _ from 'lodash';

const chooseKey = (item, props) => {
  for (const prop of props) {
    const value = _.get(item, prop);
    if (_.isString(value)) return value;
  }
};

export default {
  filters: { chooseKey },
  props: {
    items: {
      type: Array,
      default: undefined,
    },
    extractKey: {
      type: [String, Array],
      default: 'id',
    },
    allowEmpty: Boolean,
    addable: {
      type: Boolean,
      default: true,
    },
    fab: Boolean,
    addLabel: {
      type: String,
      default: 'Add Item',
    },
  },
  computed: {
    normalizedKeys () {
      return _.isArray(this.extractKey) ? this.extractKey : [this.extractKey];
    },
    disabled () {
      if (this.allowEmpty) return;

      return !_.every(this.items, item => chooseKey(item, this.normalizedKeys));
    },
  },
  methods: {
    onDelete ({ item, index }) {
      const key = chooseKey(item, this.normalizedKeys);
      this.$emit('delete', { key, index });
    },
  },
};
</script>
