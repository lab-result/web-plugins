<template lang="pug">
  v-dialog(
    v-model="dialog"
    persistent
    width="700"
  )
    v-card
      v-card-title(v-if="title")
        span.headline {{ title }}
      v-card-text
        p(v-if="message").subheading {{message}}
        p(v-if="innerHTMLMessage" v-html="innerHTMLMessage").subheading
      v-card-actions
        v-spacer
        template(v-for="action in actions")
          v-btn(
            depressed
            :color="action.color || 'secondary'"
            @click="click(action.action)"
          ) {{ action.name }}
</template>
<script>
/**
 * Insert component where you want to use it:
 * <mc-async-confirm-custom-actions-dialog ref="confirmDialog"></mc-async-confirm-custom-actions-dialog>
 *
 * Call it:
 * this.$refs.confirmDialog.open(title, message, actions).then((res) => {})
 */

export default {
  data () {
    return {
      dialog: false,
      resolve: null,
      reject: null,
      title: 'Confirm',
      message: null,
      innerHTMLMessage: null,
      actions: [],
    };
  },
  methods: {
    open (title, message, actions, innerHTMLMessage) {
      this.dialog = true;
      this.title = title;
      this.message = message;
      this.innerHTMLMessage = innerHTMLMessage;
      this.actions = actions;

      return new Promise((resolve, reject) => {
        this.resolve = resolve;
        this.reject = reject;
      });
    },
    click (action) {
      this.resolve(action);
      this.dialog = false;
    },
  },
};
</script>
