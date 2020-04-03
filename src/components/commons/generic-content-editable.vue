<template lang="pug">
  div(
    contenteditable
    ref="contenteditable"
    @input="model = $event.target.innerHTML"
  ).field
</template>
<script>
import _ from 'lodash';

export default {
  props: {
    value: {
      type: String,
      default: undefined,
    },
  },
  computed: {
    model: {
      set (val) {
        this.$emit('input', val);
        this.$emit('update:value', val);
        this.debouncedEmitDebounce(val);
      },
      get () {
        return this.value;
      },
    },
  },
  watch: {
    // value () {
    //   this.$refs.contenteditable.innerHTML = this.value || '';
    // }
  },
  mounted () {
    this.$refs.contenteditable.innerHTML = this.value || '';
  },
  created () {
    this.debouncedEmitDebounce = _.debounce(this.emitDebounce, 500);
  },
  methods: {
    emitDebounce (val) {
      this.$emit('debounce', val);
    },
  },
};
</script>
<style scoped>
.field {
  border: 2px solid rgba(0, 0, 0, 0.54);
  padding: 12px;
  border-radius: 2px
}
</style>
