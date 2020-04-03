<template lang="pug">
  v-snackbar(
    v-model="model"
    :timeout="timeout"
    :color="color"
    :top="top"
    :bottom="bottom"
    :left="left"
    :right="right"
  )
    span(v-html="message")
</template>

<script>
export default {
  data: () => ({
    model: false,
    timeout: 3000,
    color: '',
    message: '',
    top: null,
    bottom: null,
    left: null,
    right: null,
  }),
  watch: {
    model () {
      this.$emit('changeState', this.model);
    },
  },
  methods: {
    show (options) {
      this.model = true;
      for (const key in options) {
        if (Object.prototype.hasOwnProperty.call(options, key)) {
          this[key] = options[key];
        }
      }
    },
  },
};
</script>

<style>
  .count {
    font-size: 50px;
  }
</style>
