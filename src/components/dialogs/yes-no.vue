<template lang="pug">
  v-dialog(v-model="model" :width="width" :persistent="loading")
    v-card
      v-toolbar(flat)
        v-toolbar-title
          h4 {{title}}
        v-spacer
        v-btn(icon @click="model = false")
          v-icon mdi-close
      v-card-text
        p.subheading {{message}}
      v-divider
      v-card-actions
        v-spacer
        v-btn(large color="primary" @click="yes" :loading="loading" :disabled="loading") {{yesText}}
        v-btn(large color="error" flat @click="no" :disabled="loading") {{noText}}
</template>

<script>
export default {
  props: {
    dialog: Boolean,
    loading: {
      type: Boolean,
      default: false,
    },
    title: {
      type: String,
      default: 'Title',
    },
    message: {
      type: String,
      default: 'Message',
    },
    yesText: {
      type: String,
      default: 'Yes',
    },
    noText: {
      type: String,
      default: 'No',
    },
    width: {
      type: [Number, String],
      default: '400',
    },
  },
  data () {
    return {
      model: this.dialog,
    };
  },
  watch: {
    dialog (val) {
      this.model = val;
    },
    model (val) {
      if (!val) {
        this.$emit('close', false);
      }
    },
  },
  methods: {
    yes () {
      this.$emit('yes', true);
      this.model = false;
    },
    no () {
      this.$emit('no', false);
      this.model = false;
    },
  },
};
</script>
