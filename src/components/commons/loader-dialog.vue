<template lang="pug">
  v-dialog(
    persistent
    :max-width="dialogMaxWidth"
    v-model="dialog"
  )
    v-card
      v-card-text
        v-layout(column v-if="title")
          v-flex.mb-4
            span.title {{ title }}
        v-layout(row wrap align-center).pa-0.ma-0
          v-flex(shrink).px-2
            v-progress-circular(
              :size="progressSize"
              :width="progressWidth"
              :color="progressColor"
              indeterminate
            )
          v-flex(grow v-if="!hideMessage").px-2
            span.body-1 {{ message }}
</template>
<script>
/**
 * Insert component where you want to use it:
 * <mc-loader-dialog ref="loaderDialog"></mc-loader-dialog>
 *
 * Call it:
 * this.$refs.loaderDialog.open(message, title, options);
 * this.$refs.loaderDialog.close();
 */
export default {
  data () {
    return {
      dialog: false,
      message: 'Loading...',
      title: 'Please wait...',
      options: {
        dialogMaxWidth: 250,
        hideTitle: false,
        hideMessage: false,
        progressColor: 'primary',
        progressSize: 45,
        progressWidth: 5,
      },
    };
  },
  computed: {
    dialogMaxWidth () {
      return (this.options || {}).dialogMaxWidth || 250;
    },
    hideTitle () {
      return (this.options || {}).hideTitle === true;
    },
    hideMessage () {
      return (this.options || {}).hideMessage === true;
    },
    progressColor () {
      return (this.options || {}).progressColor || 'primary';
    },
    progressSize () {
      return (this.options || {}).progressSize || 40;
    },
    progressWidth () {
      return (this.options || {}).progressWidth || 5;
    },
  },
  methods: {
    open (message, title, options) {
      this.dialog = true;
      this.message = message;
      this.title = title;
      this.options = options;
    },
    close () {
      this.dialog = false;
    },
    updateMessage (message) {
      this.message = message;
    },
  },
};
</script>
