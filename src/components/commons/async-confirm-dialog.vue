<template lang="pug">
  v-dialog(
    v-model="dialog"
    persistent
    width="400"
  )
    v-card
      v-toolbar(v-if="title" flat)
        h2 {{ title }}
      v-card-text
        p(v-if="message").subheading {{message}}
        p(v-if="innerHTMLMessage" v-html="innerHTMLMessage").subheading
      v-divider
      v-card-actions
        v-spacer
        v-btn(
          depressed
          large
          :color="primaryColor || 'primary'"
          @click.stop="primary()"
          v-if="!hidePrimaryAction"
        ) {{ primaryAction }}
        v-btn(
          depressed
          flat
          large
          :color="secondaryColor || 'secondary'"
          @click.stop="cancel()"
          v-if="!hideSecondaryAction"
        ) {{ secondaryAction }}
</template>
<script>
/**
 * Insert component where you want to use it:
 * <mc-async-confirm-dialog ref="confirmDialog"></mc-async-confirm-dialog>
 *
 * Call it:
 * this.$refs.confirmDialog.open(title, message, options).then((res) => {})
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
      primaryAction: 'Confirm',
      secondaryAction: 'Cancel',
      primaryColor: 'primary',
      secondaryColor: 'secondary',
      hidePrimaryAction: false,
      hideSecondaryAction: false,
    };
  },
  methods: {
    open (title, message, {
      primaryAction,
      secondaryAction,
      primaryColor,
      secondaryColor,
      hidePrimaryAction,
      hideSecondaryAction,
    } = {}, innerHTMLMessage) {
      this.dialog = true;
      this.title = title;
      this.message = message;
      this.innerHTMLMessage = innerHTMLMessage;
      this.primaryAction = primaryAction || 'Confirm';
      this.secondaryAction = secondaryAction || 'Cancel';
      this.primaryColor = primaryColor || 'primary';
      this.secondaryColor = secondaryColor || 'secondary';
      this.hidePrimaryAction = hidePrimaryAction;
      this.hideSecondaryAction = hideSecondaryAction;

      return new Promise((resolve, reject) => {
        this.resolve = resolve;
        this.reject = reject;
      });
    },
    primary () {
      this.resolve(true);
      this.dialog = false;
    },
    cancel () {
      this.resolve(false);
      this.dialog = false;
    },
  },
};
</script>
