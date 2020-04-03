<template lang="pug">
  div.snackbar
</template>

<script>
import _ from 'lodash';
import Vue from 'vue';
import Toasted from 'vue-toasted';

Vue.use(Toasted);

export default {
  watch: {
    $snackbarQueue () {
      if (_.isEmpty(this.$snackbarQueue)) return;
      this.displaySnack();
    },
  },
  created () {
    this.$initLogger('global-snackbar');
  },
  methods: {
    async displaySnack () {
      const {
        message,
        theme = 'toasted-primary',
        color = 'info',
        timeout = 3000,
        top,
        bottom,
        left,
        right,
        action,
      } = await this.$dequeueSnack();
      this.$log(`displaySnack#message: ${message}`);

      const position = ['bottom', 'center'];
      if (bottom) position[0] = 'bottom';
      if (top) position[0] = 'top';
      if (left) position[1] = 'left';
      if (right) position[1] = 'right';
      if (!left && !right) position[1] = 'center';

      this.$toasted.show(message, {
        theme,
        position: position.join('-'),
        duration: timeout,
        keepOnHover: true,
        iconPack: 'mdi',
        type: color,
        className: 'mc-font',
        action,
      });
    },
  },
};
</script>

<style>
.mc-font {
  font-family: Roboto, sans-serif;
}
</style>
