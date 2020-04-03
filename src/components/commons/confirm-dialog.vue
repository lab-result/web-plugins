<template lang="pug">
  v-dialog(v-model="model" width="400" persistent)
    v-card
      v-toolbar(flat)
        h2 {{ title }}
        v-spacer
        v-btn(icon @click="close")
          v-icon mdi-close
      v-card-text
        p.subheading {{message}}
      v-divider
      v-card-actions
        v-spacer
        v-btn(
          @click.stop="yes"
          depressed
          large
          :color="primaryColor || 'primary'"
        ) {{ primaryAction }}
        v-btn(
          @click.stop="close"
          flat
          large
          :color="secondaryColor || 'secondary'"
        ) {{ secondaryAction }}

</template>

<script>
export default {
  props: {
    dialog: Boolean,
    title: {
      type: String,
      default: 'Confirm',
    },
    message: {
      type: String,
      default: undefined,
    },
    primaryAction: {
      type: String,
      default: 'Yes',
    },
    secondaryAction: {
      type: String,
      default: 'No',
    },
    primaryColor: {
      type: String,
      default: 'primary',
    },
    secondaryColor: {
      type: String,
      default: 'secondary',
    },
  },
  computed: {
    model: {
      set (val) {
        this.$emit('update:dialog', val);
      },
      get () {
        return this.dialog;
      },
    },
  },
  methods: {
    close () {
      this.$emit('update:dialog', false);
    },
    yes () {
      this.$emit('yes');
      this.close();
    },
  },
};
</script>
